export const SUPPORTED_LOCALES = ["th", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "th";

export const LOCALE_LABELS: Record<Locale, string> = {
  th: "ไทย",
  en: "English",
};
