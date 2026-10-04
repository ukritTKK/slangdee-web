import { dictionary } from '@/lib/public-dictionary'
import Link from 'next/link'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { type Locale } from '@/constants/i18n'
import { normalizeLocale } from '@/utils/locale.util'
import { Tag } from '@/components/Tag'
import { SlangCard } from '@/components/SlangCard'
import { getCopy } from '@/constants/copy'

function pickLocale<T extends { locale: string }>(
  items: T[],
  locale: Locale
): T | undefined {
  return items.find((i) => i.locale === locale) ?? items[0]
}

interface LocaleHomePageProps {
  params: Promise<{ locale: string }>
}

export default async function LocaleHomePage({ params }: LocaleHomePageProps) {
  const { locale } = await params
  const currentLocale = normalizeLocale(locale)
  const copy = getCopy(currentLocale)


  const { totalSlangs, wordOfTheDay, trendingSlangs, trendingTags } =
    await dictionary.getHome()

  return (
    <main className="mx-auto py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Slangdee</h1>
        <p className="text-base text-muted-foreground">
          {currentLocale === 'th'
            ? 'พจนานุกรมคำสแลงไทยและอังกฤษแบบสองภาษา ค้นหาได้และเติบโตไปพร้อมกัน'
            : 'A growing bilingual dictionary of Thai and English slang.'}
        </p>
      </header>

      {totalSlangs === 0 && (
        <section className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          {copy.noEntries}
        </section>
      )}

      {wordOfTheDay && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{copy.wordOfTheDay}</h2>
          <Card className="border-secondary bg-secondary/35">
            <CardHeader>
              {(() => {
                const primary = pickLocale(
                  wordOfTheDay!.translations,
                  currentLocale
                )
                const headword =
                  wordOfTheDay!.headword ?? primary?.word ?? wordOfTheDay!.slug

                return (
                  <>
                    <CardTitle
                      lang={wordOfTheDay!.originalLanguage ?? undefined}
                      className="text-2xl font-bold"
                    >
                      <Link
                        href={`/${currentLocale}/slang/${wordOfTheDay!.slug}`}
                        className="hover:underline"
                      >
                        {headword}
                      </Link>
                    </CardTitle>
                    {(wordOfTheDay!.romanization ||
                      wordOfTheDay!.originalLanguage) && (
                      <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        {wordOfTheDay!.romanization && (
                          <span>{wordOfTheDay!.romanization}</span>
                        )}
                        {wordOfTheDay!.originalLanguage && (
                          <span className="text-xs font-medium">
                            {wordOfTheDay!.originalLanguage.toUpperCase()}
                          </span>
                        )}
                      </p>
                    )}
                    {primary?.meaning && (
                      <p className="mt-2 text-base text-foreground">
                        {primary.meaning}
                      </p>
                    )}
                    {!wordOfTheDay.reviewedAt && <p className="text-sm text-muted-foreground">{copy.pendingReviewShort}</p>}
                  </>
                )
              })()}
            </CardHeader>
            <CardContent className="space-y-2">
              {wordOfTheDay.examples.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    {copy.example}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {wordOfTheDay.examples.find((example) => example.locale === currentLocale)?.kind === 'SOURCED'
                      ? copy.sourcedExample : copy.editorialExample}
                  </p>
                  <p className="text-base italic">
                    {wordOfTheDay.examples.find((e) => e.locale === currentLocale)
                      ?.text ?? wordOfTheDay.examples[0]?.text}
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              {wordOfTheDay.slangTags.map((st) => (
                <Tag
                  key={st.tagId}
                  locale={currentLocale}
                  name={st.tag.name}
                  variant="outline"
                />
              ))}
            </CardFooter>
          </Card>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{copy.popularSlangs}</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:md:grid-cols-4">
          {trendingSlangs.map((slang) => (
            <SlangCard key={slang.id} locale={currentLocale} slang={slang} />
          ))}
        </div>
      </section>

      {trendingTags.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{copy.trendingTags}</h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {trendingTags.map((tag) => (
              <Link
                key={tag.id}
                href={`/${currentLocale}/search?q=${encodeURIComponent(
                  tag.name.startsWith('#') ? tag.name : `#${tag.name}`
                )}`}
                className="flex items-center justify-between rounded-lg border border-secondary/70 bg-secondary/30 px-3 py-2 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Tag
                  locale={currentLocale}
                  name={tag.name}
                  variant="outline"
                  link={false}
                />
                <span className="text-xs text-muted-foreground">
                  {tag._count.slangTags}{' '}
                  {tag._count.slangTags === 1 ? copy.entry : copy.entries}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
