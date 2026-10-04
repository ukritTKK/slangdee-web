'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') console.error(error)
  }, [error])

  const isThai = typeof window !== 'undefined' && window.location.pathname.startsWith('/th')

  return (
    <main className="mx-auto max-w-xl py-16 text-center">
      <h1 className="text-2xl font-bold">{isThai ? 'เกิดข้อผิดพลาด' : 'Something went wrong'}</h1>
      <p className="mt-2 text-muted-foreground">
        {isThai ? 'ลองโหลดหน้านี้อีกครั้ง' : 'Try loading this page again.'}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button onClick={reset}>{isThai ? 'ลองอีกครั้ง' : 'Try again'}</Button>
        <Button asChild variant="outline">
          <Link href={isThai ? '/th' : '/en'}>{isThai ? 'กลับหน้าหลัก' : 'Go home'}</Link>
        </Button>
      </div>
    </main>
  )
}
