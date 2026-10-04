import type { MetadataRoute } from 'next'
import { dictionary } from '@/lib/public-dictionary'
import { SITE_URL } from '@/lib/site'
import { SUPPORTED_LOCALES } from '@/constants/i18n'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slangs = await dictionary.publishedUrls()

  const homePages = SUPPORTED_LOCALES.map((locale) => ({
    url: new URL(`/${locale}`, SITE_URL).toString(),
    changeFrequency: 'daily' as const,
    priority: 1,
  }))

  const detailPages = slangs.flatMap((slang) =>
    SUPPORTED_LOCALES.map((locale) => ({
      url: new URL(`/${locale}/slang/${slang.slug}`, SITE_URL).toString(),
      lastModified: slang.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  )

  return [...homePages, ...detailPages]
}
