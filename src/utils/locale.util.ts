import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from '@/constants/i18n'

export function mapTranslationsByLocale<T extends { locale: string }>(
  translations: T[]
): Record<Locale, T | undefined> {
  return SUPPORTED_LOCALES.reduce((acc, locale) => {
    acc[locale] = translations.find((t) => t.locale === locale);
    return acc
  }, {} as Record<Locale, T | undefined>)
}

export function mapExamplesByLocale(
  examples: { locale: string; text: string }[]
): Record<Locale, string[]> {
  return SUPPORTED_LOCALES.reduce((acc, locale) => {
    acc[locale] = examples
      .filter((ex) => ex.locale === locale)
      .map((ex) => ex.text);
    return acc;
  }, {} as Record<Locale, string[]>)
}

export function normalizeLocale(locale: string): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(locale)
    ? (locale as Locale)
    : DEFAULT_LOCALE
}
