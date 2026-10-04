import Link from 'next/link'
import { dictionary } from '@/lib/public-dictionary'
import { normalizeLocale } from '@/utils/locale.util'
import { Metadata } from 'next'
import { Tag } from '@/components/Tag'
import { getCopy } from '@/constants/copy'

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
  params: Promise<{ locale: string }>
}

export async function generateMetadata({
  searchParams,
  params,
}: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams
  const { locale } = await params
  const currentLocale = normalizeLocale(locale)

  const baseTitle =
    currentLocale === 'th' ? 'ค้นหาสแลงไทยและอังกฤษ' : 'Search Thai and English slang'

  if (!q || !q.trim()) {
    return {
      title: `${baseTitle} | Slangdee`,
      robots: { index: false, follow: true },
      description:
        currentLocale === 'th'
          ? 'ค้นหาคำสแลงไทยและอังกฤษ พร้อมความหมายสองภาษาใน Slangdee'
          : 'Search Thai and English slang with bilingual meanings on Slangdee.',
    }
  }

  const query = q.trim()

  return {
    title: `${baseTitle}: ${query} | Slangdee`,
    robots: { index: false, follow: true },
    description:
      currentLocale === 'th'
        ? `ผลการค้นหาคำสแลง "${query}" ใน Slangdee`
        : `Search results for slang "${query}" on Slangdee.`,
  }
}

export default async function SearchPage({
  searchParams,
  params,
}: SearchPageProps) {
  const { locale } = await params
  const { q } = await searchParams
  const currentLocale = normalizeLocale(locale)
  const copy = getCopy(currentLocale)

  const rawQuery = q?.trim() ?? ''
  const queries = rawQuery
  const isTagQuery = rawQuery.startsWith('#')
  const tagTerm = isTagQuery ? rawQuery.slice(1).trim() : ''
  const normalizedQuery = isTagQuery ? tagTerm : rawQuery
  const hasQuery = normalizedQuery.length > 0

  const results = hasQuery ? await dictionary.searchPublished(rawQuery) : []

  return (
    <main className="mx-auto py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold">
          {copy.searchTitle}
        </h1>
        {hasQuery && (
          <p className="text-base text-muted-foreground">
            {copy.query}
            <span className="font-medium text-primary">{queries}</span>
          </p>
        )}
      </header>

      {!hasQuery && (
        <p className="text-base text-muted-foreground">
          {copy.searchPrompt}
        </p>
      )}

      {hasQuery && results.length === 0 && (
        <p className="text-base text-muted-foreground">
          {copy.noSearchResults}
        </p>
      )}

      {results.length > 0 && (
        <ul className="space-y-3">
          {results.map((slang) => {
            const primary =
              slang.translations.find((t) => t.locale === currentLocale) ??
              slang.translations[0]
            const headword = slang.headword ?? primary?.word ?? slang.slug

            return (
              <li
                key={slang.id}
                className="rounded-lg border border-secondary/70 px-4 py-3 transition-colors hover:border-accent hover:bg-accent/50"
              >
                <Link
                  href={`/${currentLocale}/slang/${slang.slug}`}
                  className="block"
                >
                  <div className="flex items-baseline gap-2">
                    <span
                      lang={slang.originalLanguage ?? undefined}
                      className="text-lg font-semibold"
                    >
                      {headword}
                    </span>
                    {slang.originalLanguage && (
                      <span className="text-xs font-medium text-muted-foreground">
                        {slang.originalLanguage.toUpperCase()}
                      </span>
                    )}
                  </div>
                  {slang.romanization && (
                    <p className="text-sm text-muted-foreground">
                      {slang.romanization}
                    </p>
                  )}
                  {primary?.meaning && (
                    <p className="mt-1 text-base text-muted-foreground line-clamp-2">
                      {primary.meaning}
                    </p>
                  )}
                  {!slang.reviewedAt && <p className="mt-1 text-xs text-muted-foreground">{copy.pendingReviewShort}</p>}
                </Link>
                {slang.slangTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {slang.slangTags.map((st) => (
                      <Tag
                        key={st.tagId}
                        locale={currentLocale}
                        name={st.tag.name}
                        variant="outline"
                      />
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
