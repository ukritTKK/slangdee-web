import { createHash } from 'node:crypto'
import type { Prisma, PrismaClient, PublicationStatus } from '@prisma/client'
import { parseReviewedEntries, type ReviewedEntry } from './editorial-types.ts'

const snapshotInclude = {
  aliases: { orderBy: { id: 'asc' } },
  translations: {
    orderBy: { locale: 'asc' },
    include: { sources: { include: { source: true }, orderBy: { sourceId: 'asc' } } },
  },
  examples: { include: { source: true }, orderBy: { id: 'asc' } },
  slangTags: { include: { tag: true }, orderBy: { tagId: 'asc' } },
  sources: { include: { source: true }, orderBy: { sourceId: 'asc' } },
} satisfies Prisma.SlangInclude

interface RevisionOptions {
  expectedRevision: number
  actor: string
  note: string
}

async function saveSnapshot(
  tx: Prisma.TransactionClient,
  slangId: number,
  action: string,
  options: Pick<RevisionOptions, 'actor' | 'note'>,
  contentHash: string | null = null
) {
  const entry = await tx.slang.findUniqueOrThrow({ where: { id: slangId }, include: snapshotInclude })
  await tx.slangRevision.create({
    data: {
      slangId, number: entry.revision, action, actor: options.actor, note: options.note, contentHash,
      snapshot: JSON.stringify({ schemaVersion: 1, entry }),
    },
  })
}

export async function captureBaselines(client: PrismaClient) {
  const entries = await client.slang.findMany({ select: { id: true, revision: true } })
  for (const entry of entries) {
    await client.$transaction(async (tx) => {
      const existing = await tx.slangRevision.findUnique({
        where: { slangId_number: { slangId: entry.id, number: entry.revision } },
      })
      if (!existing) {
        await saveSnapshot(tx, entry.id, 'LEGACY_BASELINE', {
          actor: 'milestone-1-migration', note: 'Content preserved before the reviewed pilot import.',
        })
      }
    })
  }
}

export function baselineLookups(snapshot: string): string[] {
  const parsed: unknown = JSON.parse(snapshot)
  if (!parsed || typeof parsed !== 'object' || !('entry' in parsed)) throw new Error('Invalid baseline snapshot')
  const entry = parsed.entry
  if (!entry || typeof entry !== 'object' || !('translations' in entry) || !Array.isArray(entry.translations)) {
    throw new Error('Invalid baseline entry')
  }
  const names: unknown[] = [
    'headword' in entry ? entry.headword : null,
    'romanization' in entry ? entry.romanization : null,
    ...entry.translations.map((item: unknown) => item && typeof item === 'object' && 'word' in item ? item.word : null),
  ]
  return names.filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
}

export async function restoreBaselineLookups(client: PrismaClient, slangId: number, options: RevisionOptions) {
  requireRevisionMetadata(options)
  return client.$transaction(async (tx) => {
    const current = await tx.slang.findUniqueOrThrow({ where: { id: slangId }, include: { aliases: true, translations: true } })
    if (current.revision !== options.expectedRevision) throw new Error('Revision conflict')
    const baseline = await tx.slangRevision.findFirst({ where: { slangId, action: 'LEGACY_BASELINE' } })
    if (!baseline) return false
    const activeNames = new Set([
      current.headword, current.romanization, ...current.translations.map((item) => item.word),
      ...current.aliases.map((item) => item.value),
    ])
    const missing = [...new Set(baselineLookups(baseline.snapshot))].filter((name) => !activeNames.has(name))
    if (!missing.length) return false
    const updated = await tx.slang.updateMany({
      where: { id: slangId, revision: options.expectedRevision }, data: { revision: { increment: 1 } },
    })
    if (updated.count !== 1) throw new Error('Revision conflict')
    await tx.slangAlias.createMany({ data: missing.map((value) => ({ slangId, value })) })
    await saveSnapshot(tx, slangId, 'LOOKUP_REPAIR', options)
    return true
  })
}

function requireRevisionMetadata(options: RevisionOptions) {
  if (!options.actor.trim() || !options.note.trim() || !Number.isInteger(options.expectedRevision) || options.expectedRevision < 0) {
    throw new Error('Revision requires an actor, a note, and a non-negative expected revision')
  }
}

export async function publishReviewedEntry(
  client: PrismaClient,
  input: ReviewedEntry,
  options: RevisionOptions & { reviewedAt: Date; contentHash?: string }
) {
  const [entry] = parseReviewedEntries([input])
  requireRevisionMetadata(options)
  if (!Number.isFinite(options.reviewedAt.getTime())) throw new Error('Invalid review date')
  return client.$transaction(async (tx) => {
    let current = await tx.slang.findUnique({ where: { slug: entry.slug }, include: { translations: true } })
    if (!current) {
      if (options.expectedRevision !== 0) throw new Error('Revision conflict')
      current = await tx.slang.create({ data: { slug: entry.slug }, include: { translations: true } })
    }
    if (current.revision !== options.expectedRevision) throw new Error('Revision conflict')
    const updated = await tx.slang.updateMany({
      where: { id: current.id, revision: options.expectedRevision },
      data: {
        headword: entry.headword, originalLanguage: entry.originalLanguage,
        romanization: entry.romanization, status: 'PUBLISHED',
        revision: { increment: 1 }, reviewedAt: options.reviewedAt, reviewedBy: options.actor,
      },
    })
    if (updated.count !== 1) throw new Error('Revision conflict')
    const slangId = current.id
    const existingAliases = await tx.slangAlias.findMany({ where: { slangId } })
    const aliases = new Set(existingAliases.map((item) => item.value))
    const baseline = await tx.slangRevision.findFirst({ where: { slangId, action: 'LEGACY_BASELINE' } })
    const previousNames = [current.headword, current.romanization, ...current.translations.map((item) => item.word)]
      .filter((name): name is string => name !== null)
    for (const value of new Set([...entry.aliases, entry.headword, ...previousNames, ...(baseline ? baselineLookups(baseline.snapshot) : [])])) {
      if (!aliases.has(value)) await tx.slangAlias.create({ data: { slangId, value } })
    }
    await tx.slangTag.deleteMany({ where: { slangId } })
    for (const slug of entry.tags) {
      const tag = await tx.tag.upsert({ where: { slug }, update: {}, create: { slug, name: slug } })
      await tx.slangTag.upsert({
        where: { slangId_tagId: { slangId, tagId: tag.id } }, update: {},
        create: { slangId, tagId: tag.id },
      })
    }
    const sources = new Map<string, number>()
    await tx.slangSource.deleteMany({ where: { slangId } })
    for (const evidence of entry.sources) {
      const record = await tx.source.upsert({
        where: { url: evidence.url },
        update: { title: evidence.title, publisher: evidence.publisher, kind: evidence.kind, accessedAt: options.reviewedAt },
        create: {
          url: evidence.url, title: evidence.title, publisher: evidence.publisher,
          kind: evidence.kind, accessedAt: options.reviewedAt,
        },
      })
      sources.set(evidence.url, record.id)
      if (evidence.targets.includes('USAGE')) {
        await tx.slangSource.upsert({
          where: { slangId_sourceId: { slangId, sourceId: record.id } }, update: { note: evidence.note },
          create: { slangId, sourceId: record.id, note: evidence.note },
        })
      }
    }
    for (const locale of ['th', 'en'] as const) {
      const translation = await tx.slangTranslation.upsert({
        where: { slangId_locale: { slangId, locale } },
        update: {
          word: entry.headword, meaning: entry.meanings[locale], ipa: entry.ipa,
          origin: entry.origin[locale], originStatus: entry.origin.status,
        },
        create: {
          slangId, locale, word: entry.headword, meaning: entry.meanings[locale], ipa: entry.ipa,
          origin: entry.origin[locale], originStatus: entry.origin.status,
        },
      })
      await tx.translationSource.deleteMany({ where: { translationId: translation.id } })
      for (const evidence of entry.sources) {
        const sourceId = sources.get(evidence.url)
        if (sourceId === undefined) throw new Error('Missing source record')
        for (const claim of new Set(evidence.targets)) {
          if (claim === 'USAGE') continue
          await tx.translationSource.create({ data: {
            translationId: translation.id, sourceId, claim, note: evidence.note,
          } })
        }
      }
    }
    await tx.example.deleteMany({ where: { slangId } })
    for (const locale of ['th', 'en'] as const) {
      const example = entry.examples[locale]
      const sourceId = example.kind === 'SOURCED' ? sources.get(example.sourceUrl) : null
      if (sourceId === undefined) throw new Error('Missing example source')
      await tx.example.create({ data: { slangId, locale, text: example.text, kind: example.kind, sourceId } })
    }
    await saveSnapshot(tx, slangId, options.contentHash ? 'SEED_REVIEW' : 'EDITORIAL_REVIEW', options, options.contentHash ?? null)
    return tx.slang.findUniqueOrThrow({ where: { id: slangId } })
  })
}

export async function setPublicationStatus(
  client: PrismaClient, id: number, status: PublicationStatus, options: RevisionOptions
) {
  requireRevisionMetadata(options)
  return client.$transaction(async (tx) => {
    const entry = await tx.slang.findUniqueOrThrow({ where: { id } })
    if (entry.revision !== options.expectedRevision) throw new Error('Revision conflict')
    if (status === 'PUBLISHED' && !entry.reviewedAt) throw new Error('Publication requires source review')
    const updated = await tx.slang.updateMany({
      where: { id, revision: options.expectedRevision }, data: { status, revision: { increment: 1 } },
    })
    if (updated.count !== 1) throw new Error('Revision conflict')
    await saveSnapshot(tx, id, 'PUBLICATION_STATUS', options)
    return tx.slang.findUniqueOrThrow({ where: { id } })
  })
}

export async function seedReviewedEntries(client: PrismaClient, input: unknown, reviewedAt: Date) {
  const entries = parseReviewedEntries(input)
  let applied = 0
  let skipped = 0
  for (const entry of entries) {
    const contentHash = createHash('sha256').update(JSON.stringify(entry)).digest('hex')
    const current = await client.slang.findUnique({ where: { slug: entry.slug } })
    const previous = current && await client.slangRevision.findFirst({ where: { slangId: current.id, contentHash } })
    if (previous) { skipped++; continue }
    if (current && current.revision > 0) throw new Error(`${entry.slug}: seed would overwrite a later editorial revision`)
    await publishReviewedEntry(client, entry, {
      expectedRevision: current?.revision ?? 0, actor: 'milestone-1-editorial',
      note: 'Reviewed pilot: bilingual paraphrases, authored examples, and claim-specific evidence.',
      reviewedAt, contentHash,
    })
    applied++
  }
  return { applied, skipped }
}
