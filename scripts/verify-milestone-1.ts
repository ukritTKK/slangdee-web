import 'dotenv/config'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { parseReviewedEntries } from '../src/lib/editorial-types.ts'
import { baselineLookups } from '../src/lib/editorial.ts'
import { createDictionary, type PublishedEntry } from '../src/lib/dictionary.ts'

const client = new PrismaClient({ adapter: new PrismaLibSql({ url: process.env.DATABASE_URL ?? 'file:./dev.db' }) })
try {
  const data: unknown = JSON.parse(await readFile('prisma/reviewed-entries.json', 'utf8'))
  const pilot = parseReviewedEntries(data)
  const dictionary = createDictionary(client)
  const legacy = await client.slangRevision.findMany({ where: { action: 'LEGACY_BASELINE' } })
  for (const revision of legacy) {
    const current = await client.slang.findUniqueOrThrow({ where: { id: revision.slangId } })
    const parsed: unknown = JSON.parse(revision.snapshot)
    assert.ok(parsed && typeof parsed === 'object' && 'entry' in parsed)
    assert.ok(parsed.entry && typeof parsed.entry === 'object' && 'slug' in parsed.entry)
    assert.equal(current.slug, parsed.entry.slug)
    if (current.status === 'PUBLISHED') {
      for (const name of baselineLookups(revision.snapshot)) {
        assert.ok(await dictionary.findPublished(name), `Old lookup no longer resolves: ${name}`)
      }
    }
  }
  for (const entry of pilot) {
    const stored = await dictionary.findPublished(entry.slug)
    assert.ok(stored?.reviewedAt, `${entry.slug} is not reviewed`)
    assert.ok(stored.sources.length > 0, `${entry.slug} has no usage reference`)
    for (const locale of ['th', 'en'] as const) {
      const translation: PublishedEntry['translations'][number] | undefined = stored.translations.find((item) => item.locale === locale)
      assert.ok(translation?.ipa && translation.meaning)
      assert.ok(translation.sources.some((item) => item.claim === 'MEANING'))
      assert.ok(translation.sources.some((item) => item.claim === 'PRONUNCIATION'))
      assert.ok(stored.examples.some((item) => item.locale === locale && item.kind === 'EDITORIAL'))
      if (translation.originStatus === 'UNKNOWN') assert.equal(translation.origin, null)
    }
    const latest = await client.slangRevision.findUniqueOrThrow({ where: { slangId_number: { slangId: stored.id, number: stored.revision } } })
    assert.match(latest.snapshot, /schemaVersion/)
  }
  console.log(`Verified ${legacy.length} preserved baseline entries and ${pilot.length} reviewed entries.`)
  console.log(JSON.stringify(await client.slang.groupBy({ by: ['originalLanguage'], where: { reviewedAt: { not: null } }, _count: true })))
  const baseUrl = process.env.VERIFY_BASE_URL
  if (baseUrl) {
    const read = async (path: string) => {
      const response = await fetch(new URL(path, baseUrl))
      return { response, html: await response.text() }
    }
    const detail = await read('/en/slang/rage-bait')
    assert.equal(detail.response.status, 200)
    const text = detail.html.replace(/<[^>]*>/g, '')
    for (const expected of ['ˈreɪdʒ ˌbeɪt', 'English', 'Meaning references', 'Editorial example by Slangdee', 'The origin is not established.', 'Sources reviewed on', 'Usage references']) assert.ok(text.includes(expected), expected)
    assert.ok(detail.html.includes('dictionary.cambridge.org/us/dictionary/english/rage-bait'))
    const thai = await read('/th/slang/ting')
    assert.equal(thai.response.status, 200)
    assert.ok(thai.html.includes('ตัวอย่างที่เรียบเรียงโดย Slangdee'))
    assert.ok(thai.html.includes('แหล่งอ้างอิงการออกเสียง'))
    const alias = await read('/en/slang/Side%20relationship')
    assert.equal(new URL(alias.response.url).pathname, '/en/slang/gik')
    const pending = await read('/en/slang/67')
    assert.ok(pending.html.includes('Awaiting source review'))
    assert.ok(!pending.html.includes('aria-label="IPA pronunciation"'))
    const sitemap = await read('/sitemap.xml')
    assert.equal(sitemap.response.status, 200)
    for (const published of await dictionary.publishedUrls()) assert.ok(sitemap.html.includes(`/en/slang/${published.slug}`))
    if (process.env.VERIFY_PRIVATE_FIXTURES === '1') {
      for (const slug of ['milestone-private-draft', 'milestone-private-archive', 'milestone-private-draft-alias']) {
        const privatePage = await read(`/en/slang/${slug}`)
        assert.equal(privatePage.response.status, 404)
        assert.ok(!privatePage.html.includes('PRIVATE_CONTENT_MUST_NOT_APPEAR'))
        assert.ok(!sitemap.html.includes(slug))
      }
      for (const path of ['/api/search?q=milestone-private&locale=en', '/en/search?q=milestone-private', '/en/search?q=%23private-check', '/en', '/en/slang/rage-bait']) {
        const result = await read(path)
        assert.ok(!result.html.includes('PRIVATE_CONTENT_MUST_NOT_APPEAR'))
        assert.ok(!result.html.includes('Milestone Private Secret'))
        if (path === '/en' || path === '/en/slang/rage-bait') assert.ok(!result.html.includes('private-check'))
      }
    }
    console.log('Rendered bilingual detail, alias redirect, pending-review label, sitemap, and publication-route checks passed.')
  }
} finally {
  await client.$disconnect()
}
