import type { Locale } from '@/constants/i18n'

export function slangPath(locale: Locale, slug: string): string {
  return `/${locale}/slang/${encodeURIComponent(slug)}`
}

export function searchPath(locale: Locale, query: string): string {
  return `/${locale}/search?q=${encodeURIComponent(query)}`
}
