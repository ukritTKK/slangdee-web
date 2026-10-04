import { NextResponse } from 'next/server'
import { dictionary } from '@/lib/public-dictionary'
import { normalizeLocale } from '@/utils/locale.util'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  const localeParam = searchParams.get('locale') || ''
  const currentLocale = normalizeLocale(localeParam)

  if (!q) {
    return NextResponse.json({ suggestions: [] })
  }

  const slangs = await dictionary.searchPublished(q, 5)

  const suggestions = slangs.map((slang) => {
    const primary =
      slang.translations.find((t) => t.locale === currentLocale) ??
      slang.translations[0]

    return {
      slug: slang.slug,
      word: slang.headword ?? primary?.word ?? slang.slug,
      language: slang.originalLanguage,
      romanization: slang.romanization,
      meaning: primary?.meaning ?? '',
    }
  })

  return NextResponse.json({ suggestions })
}
