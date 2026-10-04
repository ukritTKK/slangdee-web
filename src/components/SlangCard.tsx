import Link from 'next/link'
import type { Locale } from '@/constants/i18n'
import { Card, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import type { Prisma } from '@prisma/client'
import { cn } from '@/lib/utils'
import { Tag } from '@/components/Tag'
import { slangPath } from '@/utils/route.util'
import { getCopy } from '@/constants/copy'

type SlangWithRelations = Pick<
  Prisma.SlangGetPayload<{
    include: {
      translations: true
      slangTags: { include: { tag: true } }
    }
  }>,
  | 'slug'
  | 'headword'
  | 'originalLanguage'
  | 'romanization'
  | 'reviewedAt'
  | 'translations'
  | 'slangTags'
>

interface SlangCardProps {
  locale: Locale
  slang: SlangWithRelations
  className?: string
}

function pickLocale<T extends { locale: string }>(
  items: T[],
  locale: Locale
): T | undefined {
  return items.find((i) => i.locale === locale) ?? items[0]
}

export function SlangCard({ locale, slang, className }: SlangCardProps) {
  const primary = pickLocale(slang.translations, locale)
  const headword = slang.headword ?? primary?.word ?? slang.slug
  const languageCode = slang.originalLanguage?.toUpperCase()

  return (
    <Card
      className={cn(
        'group relative flex cursor-pointer flex-col transition-colors hover:border-secondary hover:bg-secondary/20 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-baseline justify-between gap-3">
          <CardTitle
            lang={slang.originalLanguage ?? undefined}
            className="text-xl"
          >
            <Link
              href={slangPath(locale, slang.slug)}
              className="after:absolute after:inset-0 after:rounded-xl group-hover:underline focus-visible:outline-none"
            >
              {headword}
            </Link>
          </CardTitle>
          {languageCode && (
            <span className="text-xs font-medium text-muted-foreground">
              {languageCode}
            </span>
          )}
        </div>
        {slang.romanization && (
          <p className="text-sm text-muted-foreground">{slang.romanization}</p>
        )}
        {primary?.meaning && (
          <p className="mt-1 text-base text-muted-foreground line-clamp-2">
            {primary.meaning}
          </p>
        )}
        {!slang.reviewedAt && <p className="text-xs text-muted-foreground">{getCopy(locale).pendingReviewShort}</p>}
      </CardHeader>
      {slang.slangTags.length > 0 && (
        <CardFooter className="relative z-10 mt-auto flex flex-wrap gap-2 px-4 pt-0 pb-3">
          {slang.slangTags.map((st) => (
            <Tag
              key={st.tagId}
              locale={locale}
              name={st.tag.name}
              variant="secondary"
            />
          ))}
        </CardFooter>
      )}
    </Card>
  )
}
