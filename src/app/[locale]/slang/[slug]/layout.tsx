import { dictionary } from '@/lib/public-dictionary'
import { type Locale } from '@/constants/i18n'
import type { Metadata } from 'next'
import { normalizeLocale } from '@/utils/locale.util'

function pickLocale<T extends { locale: string }>(
  items: T[],
  locale: Locale
): T | undefined {
  return items.find((i) => i.locale === locale) ?? items[0]
}

interface SlangLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata(
  props: SlangLayoutProps
): Promise<Metadata> {
  const { locale, slug } = await props.params
  const currentLocale = normalizeLocale(locale)
  const decodedSlug = decodeURIComponent(slug)

  const slang = await dictionary.findPublished(decodedSlug)

  if (!slang) {
    return {
      title: 'Slang not found | Slangdee',
      robots: { index: false, follow: false },
    }
  }

  const primary = pickLocale(slang.translations, currentLocale)
  const th = slang.translations.find((t) => t.locale === 'th')
  const en = slang.translations.find((t) => t.locale === 'en')

  const baseTitleWord =
    slang.headword ?? primary?.word ?? th?.word ?? en?.word ?? slug
  const title = `${baseTitleWord} | ${
    currentLocale === 'th' ? 'ความหมายคำสแลง' : 'Slang meaning'
  } | Slangdee`

  const description =
    primary?.meaning ??
    th?.meaning ??
    en?.meaning ??
    `Definition of slang "${baseTitleWord}"`

  const urlPath = `/${currentLocale}/slang/${slang.slug}`

  return {
    title,
    description,
    alternates: {
      canonical: urlPath,
      languages: {
        'th-TH': `/th/slang/${slang.slug}`,
        'en-US': `/en/slang/${slang.slug}`,
        'x-default': `/th/slang/${slang.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: urlPath,
      type: 'article',
    },
  }
}

export default async function SlangLayout({ children }: SlangLayoutProps) {
  return <>{children}</>
}
