import Link from 'next/link'
import type { Locale } from '@/constants/i18n'
import { Badge, badgeVariants } from '@/components/ui/badge'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { searchPath } from '@/utils/route.util'

type BadgeVariant = VariantProps<typeof badgeVariants>['variant']

interface TagProps {
  locale: Locale
  name: string
  variant?: BadgeVariant
  className?: string
  link?: boolean
}

export function Tag({
  locale,
  name,
  variant = 'secondary',
  className,
  link = true,
}: TagProps) {
  const displayName = name.startsWith('#') ? name : `#${name}`
  const href = searchPath(locale, displayName)
  const badgeClassName = cn('text-sm', className)

  if (!link) {
    return <Badge variant={variant} className={badgeClassName}>{displayName}</Badge>
  }

  return (
    <Badge
      asChild
      variant={variant}
      className={badgeClassName}
    >
      <Link href={href} className="hover:underline">
        {displayName}
      </Link>
    </Badge>
  )
}
