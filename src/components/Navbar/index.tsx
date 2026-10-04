'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Moon, Search, Settings2, Sun } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  type Locale,
} from '@/constants/i18n'
import { useEffect, useMemo, useState } from 'react'
import debounce from 'lodash/debounce'

const LOCALE_LABELS: Record<Locale, string> = {
  th: 'ไทย',
  en: 'English',
}

const NAV_COPY: Record<Locale, { search: string; settings: string; language: string; appearance: string; darkMode: string }> = {
  th: {
    search: 'ค้นหาคำสแลง',
    settings: 'การตั้งค่า',
    language: 'ภาษา',
    appearance: 'การแสดงผล',
    darkMode: 'โหมดมืด',
  },
  en: {
    search: 'Search slang',
    settings: 'Settings',
    language: 'Language',
    appearance: 'Appearance',
    darkMode: 'Dark mode',
  },
}

const THEME_STORAGE_KEY = 'slangdee-theme'

interface Suggestion {
  slug: string
  word: string
  language: string | null
  romanization: string | null
  meaning: string
}

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  const segments = pathname.split('/').filter(Boolean)
  const maybeLocale = segments[0] as Locale | undefined

  const currentLocale: Locale = (
    SUPPORTED_LOCALES as readonly string[]
  ).includes(maybeLocale ?? '')
    ? (maybeLocale as Locale)
    : DEFAULT_LOCALE
  const navCopy = NAV_COPY[currentLocale]

  const handleLocaleChange = (nextLocale: string) => {
    if (!SUPPORTED_LOCALES.includes(nextLocale as Locale)) return

    const segs = pathname.split('/')

    if (SUPPORTED_LOCALES.includes(segs[1] as Locale)) {
      segs[1] = nextLocale
    } else {
      segs.splice(1, 0, nextLocale)
    }

    router.push(segs.join('/') || '/')
  }

  // --- Search state ---
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState(-1)

  useEffect(() => {
    const root = document.documentElement
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')

    const syncTheme = () => {
      let storedTheme: string | null = null

      try {
        storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
      } catch {}

      const dark = storedTheme ? storedTheme === 'dark' : systemTheme.matches

      root.dataset.scheme = dark ? 'dark' : 'light'
      setIsDarkMode(dark)
    }

    syncTheme()
    systemTheme.addEventListener('change', syncTheme)

    return () => systemTheme.removeEventListener('change', syncTheme)
  }, [])

  const handleDarkModeChange = (enabled: boolean) => {
    document.documentElement.dataset.scheme = enabled ? 'dark' : 'light'

    try {
      localStorage.setItem(THEME_STORAGE_KEY, enabled ? 'dark' : 'light')
    } catch {}

    setIsDarkMode(enabled)
  }

  // Debounced fetch suggestions (300ms)
  const debouncedFetchSuggestions = useMemo(
    () =>
      debounce(async (trimmed: string, locale: Locale) => {
        try {
          const res = await fetch(
            `/api/search?q=${encodeURIComponent(trimmed)}&locale=${locale}`
          )
          if (!res.ok) throw new Error('Failed to fetch suggestions')
          const data = (await res.json()) as { suggestions: Suggestion[] }
          setSuggestions(data.suggestions)
          setActiveSuggestion(-1)
          setShowDropdown(true)
        } catch {
          setSuggestions([])
          setShowDropdown(true)
        } finally {
          setIsLoading(false)
        }
      }, 300),
    []
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedFetchSuggestions.cancel()
    }
  }, [debouncedFetchSuggestions])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    const trimmed = value.trim()
    // Clear when empty
    if (!trimmed) {
      debouncedFetchSuggestions.cancel()
      setSuggestions([])
      setActiveSuggestion(-1)
      setShowDropdown(false)
      setIsLoading(false)
      return
    }

    if (trimmed.startsWith('#')) {
      debouncedFetchSuggestions.cancel()
      setSuggestions([])
      setActiveSuggestion(-1)
      setShowDropdown(false)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    debouncedFetchSuggestions(trimmed, currentLocale)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    setShowDropdown(false)
    router.push(`/${currentLocale}/search?q=${encodeURIComponent(trimmed)}`)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowDropdown(false)
      setActiveSuggestion(-1)
      return
    }

    if (!showDropdown || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveSuggestion((current) => (current + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveSuggestion(
        (current) => (current <= 0 ? suggestions.length - 1 : current - 1)
      )
    } else if (e.key === 'Enter' && activeSuggestion >= 0) {
      e.preventDefault()
      handleSuggestionClick(suggestions[activeSuggestion].slug)
    }
  }

  const handleSuggestionClick = (slug: string) => {
    setShowDropdown(false)
    setQuery('')
    router.push(`/${currentLocale}/slang/${slug}`)
  }

  const handleBlur = () => {
    // allow click to register first
    setTimeout(() => setShowDropdown(false), 150)
  }

  return (
    <nav lang={currentLocale} className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 gap-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/${currentLocale}`}
            className="text-xl font-bold text-primary"
          >
            Slangdee
          </Link>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end">
          {/* Search + autocomplete */}
          <div className="relative w-full max-w-sm">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={
                    currentLocale === 'th'
                      ? 'ค้นหาคำสแลง...'
                      : 'Search slang...'
                  }
                  aria-label={navCopy.search}
                  role="combobox"
                  aria-autocomplete="list"
                  aria-controls="slang-search-suggestions"
                  aria-expanded={showDropdown}
                  aria-activedescendant={
                    activeSuggestion >= 0
                      ? `slang-suggestion-${activeSuggestion}`
                      : undefined
                  }
                  className="pl-9 placeholder:text-muted-foreground/80"
                />
              </div>
            </form>

            {showDropdown && (
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
                {isLoading ? (
                  <div className="px-3 py-2 text-base text-muted-foreground">
                    {currentLocale === 'th' ? 'กำลังค้นหา...' : 'Searching...'}
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="px-3 py-2 text-base text-muted-foreground">
                    {currentLocale === 'th' ? 'ไม่พบคำสแลง' : 'No results'}
                  </div>
                ) : (
                  <ul
                    id="slang-search-suggestions"
                    role="listbox"
                    className="max-h-64 overflow-auto py-1"
                  >
                    {suggestions.map((s) => (
                      <li
                        key={s.slug}
                        id={`slang-suggestion-${suggestions.indexOf(s)}`}
                        role="option"
                        aria-selected={
                          activeSuggestion === suggestions.indexOf(s)
                        }
                        className={`cursor-pointer px-3 py-2 text-base hover:bg-accent ${
                          activeSuggestion === suggestions.indexOf(s)
                            ? 'bg-accent'
                            : ''
                        }`}
                        onMouseDown={(e) => {
                          e.preventDefault() // prevent blur from killing click
                          handleSuggestionClick(s.slug)
                        }}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <div
                            lang={s.language ?? undefined}
                            className="font-medium"
                          >
                            {s.word}
                          </div>
                          {s.language && (
                            <span className="text-xs font-medium text-muted-foreground">
                              {s.language.toUpperCase()}
                            </span>
                          )}
                        </div>
                        {s.romanization && (
                          <div className="text-sm text-muted-foreground">
                            {s.romanization}
                          </div>
                        )}
                        {s.meaning && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {s.meaning}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Settings / locale switch */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={navCopy.settings}>
                <Settings2 className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{navCopy.language}</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={currentLocale}
                onValueChange={handleLocaleChange}
              >
                {SUPPORTED_LOCALES.map((locale) => (
                  <DropdownMenuRadioItem key={locale} value={locale}>
                    {LOCALE_LABELS[locale]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>{navCopy.appearance}</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={isDarkMode}
                onCheckedChange={handleDarkModeChange}
                className="cursor-pointer"
              >
                {isDarkMode ? <Moon /> : <Sun />}
                {navCopy.darkMode}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
