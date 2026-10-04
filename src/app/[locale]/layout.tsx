export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params

  return <div lang={locale === 'th' ? 'th' : 'en'}>{children}</div>
}
