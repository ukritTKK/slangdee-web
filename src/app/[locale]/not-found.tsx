import Link from 'next/link'

export default function LocaleNotFound() {
  return (
    <main className="mx-auto max-w-xl py-16 text-center">
      <h1 className="text-2xl font-bold">ไม่พบคำสแลง / Slang not found</h1>
      <p className="mt-2 text-muted-foreground">
        The entry may have moved or is not available yet.
      </p>
      <Link className="mt-6 inline-block text-primary underline" href="/th">
        Back to Slangdee
      </Link>
    </main>
  )
}
