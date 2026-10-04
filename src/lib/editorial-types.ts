export type ContentLocale = 'th' | 'en'
export type EvidenceTarget = 'MEANING' | 'PRONUNCIATION' | 'ORIGIN' | 'USAGE'
export type Origin =
  | { status: 'UNKNOWN'; th: null; en: null }
  | { status: 'UNCERTAIN' | 'DOCUMENTED'; th: string; en: string }

export interface EvidenceSource {
  url: string
  title: string
  publisher: string
  kind: 'DICTIONARY' | 'ARTICLE' | 'POST'
  targets: EvidenceTarget[]
  note: string | null
}

export type ReviewedExample =
  | { text: string; kind: 'EDITORIAL'; sourceUrl: null }
  | { text: string; kind: 'SOURCED'; sourceUrl: string }

export interface ReviewedEntry {
  slug: string
  headword: string
  originalLanguage: ContentLocale
  romanization: string | null
  ipa: string
  meanings: Record<ContentLocale, string>
  examples: Record<ContentLocale, ReviewedExample>
  aliases: string[]
  tags: string[]
  origin: Origin
  sources: EvidenceSource[]
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Expected an editorial record')
  }
  return value as Record<string, unknown>
}

function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Expected non-empty text')
  return value.trim()
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) throw new Error('Expected a text list')
  return value.map(text)
}

function evidenceTarget(value: unknown): EvidenceTarget {
  switch (value) {
    case 'MEANING': case 'PRONUNCIATION': case 'ORIGIN': case 'USAGE': return value
    default: throw new Error('Invalid evidence target')
  }
}

function sourceKind(value: unknown): EvidenceSource['kind'] {
  switch (value) {
    case 'DICTIONARY': case 'ARTICLE': case 'POST': return value
    default: throw new Error('Invalid source kind')
  }
}

function source(value: unknown): EvidenceSource {
  const record = object(value)
  const url = text(record.url)
  if (new URL(url).protocol !== 'https:') throw new Error('Sources require HTTPS URLs')
  return {
    url, title: text(record.title), publisher: text(record.publisher),
    kind: sourceKind(record.kind), targets: strings(record.targets).map(evidenceTarget),
    note: record.note == null ? null : text(record.note),
  }
}

function origin(value: unknown): Origin {
  const record = object(value)
  if (record.status === 'UNKNOWN' && record.th == null && record.en == null) {
    return { status: 'UNKNOWN', th: null, en: null }
  }
  if (record.status === 'DOCUMENTED' || record.status === 'UNCERTAIN') {
    return { status: record.status, th: text(record.th), en: text(record.en) }
  }
  throw new Error('Invalid origin status or unsupported origin text')
}

function example(value: unknown): ReviewedExample {
  const record = object(value)
  if (record.kind === 'EDITORIAL' && record.sourceUrl == null) {
    return { text: text(record.text), kind: 'EDITORIAL', sourceUrl: null }
  }
  if (record.kind === 'SOURCED') {
    return { text: text(record.text), kind: 'SOURCED', sourceUrl: text(record.sourceUrl) }
  }
  throw new Error('Examples must distinguish editorial text from sourced text')
}

export function parseReviewedEntries(input: unknown): ReviewedEntry[] {
  if (!Array.isArray(input)) throw new Error('Expected reviewed entries')
  const entries = input.map((item): ReviewedEntry => {
    const record = object(item)
    if (record.originalLanguage !== 'th' && record.originalLanguage !== 'en') {
      throw new Error('Unsupported original language')
    }
    if (!Array.isArray(record.sources)) throw new Error('Missing source records')
    const meanings = object(record.meanings)
    const examples = object(record.examples)
    const entry: ReviewedEntry = {
      slug: text(record.slug), headword: text(record.headword),
      originalLanguage: record.originalLanguage,
      romanization: record.romanization == null ? null : text(record.romanization),
      ipa: text(text(record.ipa).replace(/^\/+|\/+$/g, '')),
      aliases: strings(record.aliases), tags: strings(record.tags),
      meanings: { th: text(meanings.th), en: text(meanings.en) },
      examples: { th: example(examples.th), en: example(examples.en) },
      origin: origin(record.origin), sources: record.sources.map(source),
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug)) throw new Error('Invalid canonical slug')
    const targets = new Set(entry.sources.flatMap((item) => item.targets))
    for (const claim of ['MEANING', 'PRONUNCIATION', 'USAGE']) {
      if (!targets.has(evidenceTarget(claim))) throw new Error(`${entry.slug}: missing ${claim} evidence`)
    }
    if (entry.origin.status !== 'UNKNOWN' && !targets.has('ORIGIN')) {
      throw new Error(`${entry.slug}: origin needs evidence`)
    }
    for (const item of Object.values(entry.examples)) {
      if (item.kind === 'SOURCED' && !entry.sources.some((source) => source.url === item.sourceUrl)) {
        throw new Error(`${entry.slug}: example source is not recorded`)
      }
    }
    return entry
  })
  if (new Set(entries.map((item) => item.slug)).size !== entries.length) {
    throw new Error('Duplicate canonical slugs')
  }
  return entries
}
