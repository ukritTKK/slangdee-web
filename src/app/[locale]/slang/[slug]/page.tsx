import { dictionary } from '@/lib/public-dictionary'
import { notFound, redirect } from 'next/navigation'
import { type Locale } from '@/constants/i18n'
import { normalizeLocale } from '@/utils/locale.util'
import { Tag } from '@/components/Tag'
import { SlangCard } from '@/components/SlangCard'
import { getCopy } from '@/constants/copy'

function pickLocale<T extends { locale: string }>(items: T[], locale: Locale): T | undefined {
  return items.find((item) => item.locale === locale) ?? items[0]
}

interface Reference {
  source: { id: number; url: string; title: string; publisher: string }
}

function References({ references, label }: { references: Reference[]; label: string }) {
  if (!references.length) return null
  return (
    <div className="space-y-1 text-sm text-muted-foreground">
      <p>{label}</p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {references.map(({ source }) => (
          <li key={source.id}>
            <a href={source.url} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">
              {source.publisher}: {source.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

interface SlangPageProps {
  params: Promise<{ locale: string; slug: string }>
}

export default async function SlangPage({ params }: SlangPageProps) {
  const { locale, slug } = await params
  const currentLocale = normalizeLocale(locale)
  const decodedSlug = decodeURIComponent(slug)
  const slang = await dictionary.findPublished(decodedSlug)
  if (!slang) return notFound()
  if (slang.slug !== decodedSlug) redirect(`/${currentLocale}/slang/${slang.slug}`)

  const translation = pickLocale(slang.translations, currentLocale)
  const headword = slang.headword ?? translation?.word ?? slang.slug
  const copy = getCopy(currentLocale)
  const languageName = slang.originalLanguage === 'th'
    ? currentLocale === 'th' ? 'ไทย' : 'Thai'
    : slang.originalLanguage === 'en'
      ? currentLocale === 'th' ? 'อังกฤษ' : 'English'
      : slang.originalLanguage
  const pronunciation = slang.reviewedAt ? translation?.ipa : null
  const examples = slang.examples.filter((example) => example.locale === currentLocale)
  const allTags = slang.slangTags.map((item) => item.tag)
  const relatedSlangs = await dictionary.getRelated(slang.id, allTags.map((tag) => tag.id))
  const dateFormatter = new Intl.DateTimeFormat(currentLocale === 'th' ? 'th-TH' : 'en-US', {
    dateStyle: 'medium', timeZone: 'UTC',
  })
  const allReferences = [
    ...slang.sources,
    ...(translation?.sources ?? []),
    ...examples.flatMap((example) => example.source ? [{ source: example.source }] : []),
  ]
  const sources = [...new Map(allReferences.map(({ source }) => [source.id, source])).values()]

  return (
    <main className="mx-auto py-8 space-y-8">
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 lang={slang.originalLanguage ?? undefined} className="text-4xl font-extrabold tracking-tight">
            {headword}
          </h1>
          {pronunciation && (
            <span className="text-base text-muted-foreground" aria-label="IPA pronunciation">
              /{pronunciation}/
            </span>
          )}
          {languageName && <span className="text-sm font-medium text-muted-foreground">{languageName}</span>}
        </div>
        {slang.romanization && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">{currentLocale === 'th' ? 'คำอ่าน' : 'Romanization'}:</span>{' '}
            {slang.romanization}
          </p>
        )}
        {pronunciation && (
          <References references={translation?.sources.filter((item) => item.claim === 'PRONUNCIATION') ?? []} label={copy.pronunciationSources} />
        )}
        <p className="rounded-md border bg-secondary/30 px-3 py-2 text-sm text-muted-foreground">
          {slang.reviewedAt ? (
            <>{copy.reviewed}{' '}<time dateTime={slang.reviewedAt.toISOString()}>{dateFormatter.format(slang.reviewedAt)}</time>
              {' · '}{copy.revision} {slang.revision}</>
          ) : copy.pendingReview}
        </p>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => <Tag key={tag.id} locale={currentLocale} name={tag.name} variant="secondary" />)}
          </div>
        )}
      </section>

      {translation && (
        <section className="space-y-6">
          <div className="space-y-2 border-b pb-4">
            <h2 className="text-lg font-semibold">{copy.meaning}</h2>
            <p className="text-base leading-relaxed">{translation.meaning}</p>
            <References references={translation.sources.filter((item) => item.claim === 'MEANING')} label={copy.meaningSources} />
          </div>
          <div className="space-y-2 border-b pb-4">
            <h2 className="text-lg font-semibold">{copy.origin}</h2>
            {translation.originStatus === 'UNKNOWN' ? (
              <p className="text-base text-muted-foreground">{copy.originUnknown}</p>
            ) : (
              <>
                {translation.originStatus === 'UNCERTAIN' && <p className="text-base text-muted-foreground">{copy.originUncertain}</p>}
                {slang.reviewedAt && translation.origin && <p className="whitespace-pre-line text-base">{translation.origin}</p>}
                <References references={translation.sources.filter((item) => item.claim === 'ORIGIN')} label={copy.originSources} />
              </>
            )}
          </div>
          {examples.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">{copy.example}</h2>
              <ul className="space-y-3">
                {examples.map((example) => (
                  <li key={example.id} className="space-y-1 border-l-2 border-accent pl-4">
                    <p className="text-base">{example.text}</p>
                    <p className="text-sm text-muted-foreground">
                      {example.kind === 'EDITORIAL' ? copy.editorialExample : copy.sourcedExample}
                    </p>
                    {example.source && <References references={[{ source: example.source }]} label={copy.sources} />}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {sources.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{copy.sources}</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {sources.map((source) => (
              <li key={source.id}>
                <a href={source.url} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">
                  {source.publisher}: {source.title}
                </a>
                {slang.sources.some((item) => item.sourceId === source.id) && <p>{copy.usageSources}</p>}
                <p>{copy.accessed}{' '}<time dateTime={source.accessedAt.toISOString()}>{dateFormatter.format(source.accessedAt)}</time></p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {relatedSlangs.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{copy.relatedWords}</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {relatedSlangs.map((related) => <SlangCard key={related.id} locale={currentLocale} slang={related} />)}
          </div>
        </section>
      )}
    </main>
  )
}
