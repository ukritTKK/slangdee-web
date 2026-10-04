import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { SITE_URL } from '@/lib/site'

const notoSans = localFont({
  src: './fonts/NotoSans-VariableFont_wdth,wght.ttf',
  variable: '--font-noto-sans',
  weight: '100 900',
  display: 'swap',
})

const notoSansThai = localFont({
  src: './fonts/NotoSansThai-VariableFont_wdth,wght.ttf',
  variable: '--font-noto-sans-thai',
  weight: '100 900',
  display: 'swap',
})

const themeInitializer = `
  (function () {
    try {
      var storedTheme = localStorage.getItem('slangdee-theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var scheme = storedTheme === 'light' || storedTheme === 'dark'
        ? storedTheme
        : prefersDark ? 'dark' : 'light';
      document.documentElement.dataset.scheme = scheme;
    } catch (error) {}
  })();
`

export const metadata: Metadata = {
  title: 'Slangdee',
  description: 'A bilingual dictionary of Thai and English slang with meanings, pronunciation, examples, and sources.',
  metadataBase: SITE_URL,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <script dangerouslySetInnerHTML={{ __html: themeInitializer }} />
      </head>
      <body
        className={`${notoSans.variable} ${notoSansThai.variable} antialiased bg-muted/30`}
      >
        <div className="min-h-screen text-foreground">
          <header className="border-b bg-background/90 backdrop-blur">
            <Navbar />
          </header>
          <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>
        </div>
      </body>
    </html>
  )
}
