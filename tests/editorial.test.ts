import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { createClient } from '@libsql/client'
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { parseReviewedEntries, type ReviewedEntry } from '../src/lib/editorial-types.ts'
import { captureBaselines, publishReviewedEntry, restoreBaselineLookups, seedReviewedEntries, setPublicationStatus } from '../src/lib/editorial.ts'
import { createDictionary } from '../src/lib/dictionary.ts'

let directory: string
let client: PrismaClient
let pilot: ReviewedEntry[]
const reviewedAt = new Date('2026-10-04T10:48:09Z')
const options = { expectedRevision: 0, actor: 'test-editor', note: 'Integration review', reviewedAt }

before(async () => {
  directory = process.env.SLANGDEE_TEST_DB_DIR ?? ''
  assert.ok(directory, 'Run npm test to provide an isolated database directory')
  const url = `file:${join(directory, 'test.db').replaceAll('\\', '/')}`
  const sql = createClient({ url })
  for (const migration of (await readdir('prisma/migrations')).filter((name) => /^\d/.test(name)).sort()) {
    await sql.executeMultiple(await readFile(`prisma/migrations/${migration}/migration.sql`, 'utf8'))
  }
  sql.close()
  client = new PrismaClient({ adapter: new PrismaLibSql({ url }) })
  const data: unknown = JSON.parse(await readFile('prisma/reviewed-entries.json', 'utf8'))
  pilot = parseReviewedEntries(data)
})

after(async () => {
  await client?.$disconnect()
})

function fixture(slug: string): ReviewedEntry {
  return { ...pilot[0], slug, headword: slug, aliases: [`${slug}-alias`], tags: ['test-category'] }
}

test('pilot has 20 reviewed entries per language and rejects unsupported claims', () => {
  assert.equal(pilot.filter((entry) => entry.originalLanguage === 'th').length, 20)
  assert.equal(pilot.filter((entry) => entry.originalLanguage === 'en').length, 20)
  assert.throws(() => parseReviewedEntries([{ ...fixture('bad-ipa'), ipa: '///' }]), /non-empty/)
  assert.throws(() => parseReviewedEntries([{ ...fixture('bad-claim'), sources: [] }]), /MEANING evidence/)
  assert.throws(() => parseReviewedEntries([{ ...fixture('bad-origin'), origin: { status: 'DOCUMENTED', th: 'Claim', en: 'Claim' } }]), /origin needs evidence/)
  assert.throws(() => parseReviewedEntries([{ ...fixture('bad-example'), examples: { th: 'unlabelled', en: 'unlabelled' } }]), /editorial record/)
  assert.throws(() => parseReviewedEntries([{ ...fixture('bad-url'), sources: [{ ...pilot[0].sources[0], url: 'javascript:alert(1)' }] }]), /HTTPS/)
})

test('review preserves IDs and previous word URLs, records full history, and reconciles tags', async () => {
  const old = await client.slang.create({ data: {
    slug: 'legacy-entry', headword: 'Former headword', originalLanguage: 'th', romanization: 'former-spelling', status: 'PUBLISHED',
    translations: { create: [{ locale: 'en', word: 'Old translated word', meaning: 'Old meaning' }] },
    examples: { create: [{ locale: 'en', text: 'Old example' }] },
  } })
  await captureBaselines(client)
  const reviewed = await publishReviewedEntry(client, fixture('legacy-entry'), options)
  assert.equal(reviewed.id, old.id)
  assert.equal(reviewed.revision, 1)
  const dictionary = createDictionary(client)
  for (const lookup of ['Former headword', 'former-spelling', 'Old translated word']) {
    assert.equal((await dictionary.findPublished(lookup))?.id, old.id)
  }
  const baseline = await client.slangRevision.findUniqueOrThrow({ where: { slangId_number: { slangId: old.id, number: 0 } } })
  assert.match(baseline.snapshot, /Old meaning/)
  assert.match(baseline.snapshot, /Old example/)
  const revision = await client.slangRevision.findUniqueOrThrow({ where: { slangId_number: { slangId: old.id, number: 1 } } })
  assert.match(revision.snapshot, /MEANING/)
  assert.match(revision.snapshot, /EDITORIAL/)
  assert.match(revision.snapshot, /reviewedAt/)
  const corrected = { ...fixture('legacy-entry'), tags: ['corrected-category'] }
  await publishReviewedEntry(client, corrected, { ...options, expectedRevision: 1 })
  assert.equal((await dictionary.searchPublished('#test-category')).some((entry) => entry.id === old.id), false)
  assert.equal((await dictionary.searchPublished('#corrected-category'))[0].id, old.id)
  await assert.rejects(client.slangRevision.update({ where: { id: revision.id }, data: { note: 'Tamper' } }))
  assert.equal((await client.slangRevision.findUniqueOrThrow({ where: { id: revision.id } })).note, revision.note)
})

test('failed writes and stale revisions cannot partially publish content', async () => {
  await client.$executeRawUnsafe(`CREATE TRIGGER reject_test_alias BEFORE INSERT ON SlangAlias WHEN NEW.value = '__reject_alias__' BEGIN SELECT RAISE(ABORT, 'test rejection'); END`)
  await assert.rejects(publishReviewedEntry(client, { ...fixture('rollback-entry'), aliases: ['__reject_alias__'] }, options))
  assert.equal(await client.slang.findUnique({ where: { slug: 'rollback-entry' } }), null)
  await client.$executeRawUnsafe('DROP TRIGGER reject_test_alias')
  const published = await publishReviewedEntry(client, fixture('conflict-entry'), options)
  const before = await client.slangRevision.count({ where: { slangId: published.id } })
  await assert.rejects(publishReviewedEntry(client, fixture('conflict-entry'), options), /Revision conflict/)
  assert.equal(await client.slangRevision.count({ where: { slangId: published.id } }), before)
  assert.equal((await client.slang.findUniqueOrThrow({ where: { id: published.id } })).revision, 1)
})

test('public discovery excludes drafts and archives, including alias collisions and tag counts', async () => {
  const publicEntry = await publishReviewedEntry(client, { ...fixture('visible-entry'), tags: ['visibility-test'], aliases: ['hidden-entry'] }, options)
  const tag = await client.tag.findUniqueOrThrow({ where: { slug: 'visibility-test' } })
  const draft = await client.slang.create({ data: {
    slug: 'hidden-entry', translations: { create: [{ locale: 'en', word: 'hidden word', meaning: 'Private meaning' }] },
    slangTags: { create: [{ tagId: tag.id }] }, aliases: { create: [{ value: 'private-alias' }] },
  } })
  const archived = await publishReviewedEntry(client, { ...fixture('archived-entry'), tags: ['visibility-test'] }, options)
  await setPublicationStatus(client, archived.id, 'ARCHIVED', { ...options, expectedRevision: 1 })
  const dictionary = createDictionary(client)
  assert.equal(await dictionary.findPublished('hidden-entry'), null)
  assert.equal(await dictionary.findPublished('private-alias'), null)
  assert.equal(await dictionary.findPublished('archived-entry'), null)
  assert.deepEqual((await dictionary.searchPublished('hidden')).map((entry) => entry.id), [publicEntry.id])
  assert.equal((await dictionary.searchPublished('private-alias')).length, 0)
  assert.deepEqual((await dictionary.searchPublished('#visibility-test')).map((entry) => entry.id), [publicEntry.id])
  assert.equal((await dictionary.getRelated(publicEntry.id, [tag.id])).length, 0)
  const home = await dictionary.getHome(reviewedAt)
  assert.equal(home.totalSlangs, await client.slang.count({ where: { status: 'PUBLISHED' } }))
  assert.equal(home.trendingTags.find((item) => item.id === tag.id)?._count.slangTags, 1)
  assert.notEqual(home.wordOfTheDay?.id, draft.id)
  assert.equal(home.trendingSlangs.some((entry) => entry.id === draft.id || entry.id === archived.id), false)
  assert.equal((await dictionary.publishedUrls()).some((entry) => entry.slug === 'hidden-entry' || entry.slug === 'archived-entry'), false)
  await assert.rejects(setPublicationStatus(client, draft.id, 'PUBLISHED', options), /source review/)
  const archiveRevision = await client.slangRevision.findUniqueOrThrow({ where: { slangId_number: { slangId: archived.id, number: 2 } } })
  assert.match(archiveRevision.snapshot, /ARCHIVED/)
})

test('seeding is repeatable and leaves subsequent editorial changes untouched', async () => {
  const entry = fixture('seed-entry')
  assert.deepEqual(await seedReviewedEntries(client, [entry], reviewedAt), { applied: 1, skipped: 0 })
  const current = await client.slang.findUniqueOrThrow({ where: { slug: entry.slug } })
  const corrected = { ...entry, meanings: { th: 'คำอธิบายที่แก้ไข', en: 'A later editorial correction.' } }
  await publishReviewedEntry(client, corrected, { ...options, expectedRevision: 1 })
  assert.deepEqual(await seedReviewedEntries(client, [entry], reviewedAt), { applied: 0, skipped: 1 })
  assert.equal((await client.slangTranslation.findUniqueOrThrow({ where: { slangId_locale: { slangId: current.id, locale: 'en' } } })).meaning, corrected.meanings.en)
  await assert.rejects(seedReviewedEntries(client, [{ ...entry, headword: 'Changed seed' }], reviewedAt), /overwrite a later editorial revision/)
})

test('legacy alias repair preserves later corrections and archived visibility', async () => {
  const current = await client.slang.findUniqueOrThrow({ where: { slug: 'legacy-entry' } })
  const corrected = { ...fixture('legacy-entry'), meanings: { th: 'แก้ไขล่าสุด', en: 'Later correction to preserve.' } }
  const reviewed = await publishReviewedEntry(client, corrected, { ...options, expectedRevision: current.revision })
  const archived = await setPublicationStatus(client, current.id, 'ARCHIVED', { ...options, expectedRevision: reviewed.revision })
  await client.slangAlias.deleteMany({ where: { slangId: current.id, value: 'Old translated word' } })
  assert.equal(await restoreBaselineLookups(client, current.id, { ...options, expectedRevision: archived.revision }), true)
  const repaired = await client.slang.findUniqueOrThrow({ where: { id: current.id }, include: { translations: true, aliases: true } })
  assert.equal(repaired.status, 'ARCHIVED')
  assert.equal(repaired.translations.find((item) => item.locale === 'en')?.meaning, corrected.meanings.en)
  assert.ok(repaired.aliases.some((item) => item.value === 'Old translated word'))
  assert.equal(await restoreBaselineLookups(client, current.id, { ...options, expectedRevision: repaired.revision }), false)
})

test('sourced examples and corrected source catalog metadata survive snapshots', async () => {
  const entry = fixture('sourced-entry')
  const reviewed = await publishReviewedEntry(client, {
    ...entry, examples: { ...entry.examples, en: { text: 'A test-only source excerpt.', kind: 'SOURCED', sourceUrl: entry.sources[0].url } },
  }, options)
  const first = await client.slangRevision.findUniqueOrThrow({ where: { slangId_number: { slangId: reviewed.id, number: 1 } } })
  assert.match(first.snapshot, /SOURCED/)
  const sourced = await client.example.findFirstOrThrow({ where: { slangId: reviewed.id, locale: 'en' }, include: { source: true } })
  assert.equal(sourced.source?.url, entry.sources[0].url)
  await publishReviewedEntry(client, { ...entry, sources: [{ ...entry.sources[0], title: 'Corrected catalog title' }] }, { ...options, expectedRevision: 1 })
  assert.equal((await client.source.findUniqueOrThrow({ where: { url: entry.sources[0].url } })).title, 'Corrected catalog title')
  assert.equal((await client.slangRevision.findUniqueOrThrow({ where: { id: first.id } })).snapshot, first.snapshot)
})
