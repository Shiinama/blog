'use client'

import { Languages } from 'lucide-react'
import { useLocale } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Link, usePathname } from '@/i18n/navigation'
import { localeNames, routing, type Locale } from '@/i18n/routing'

export function LanguageSwitcher() {
  const locale = useLocale() as Locale
  const pathname = usePathname()
  const next = routing.locales.find((l) => l !== locale) ?? routing.defaultLocale

  return (
    <Button asChild variant="ghost" size="icon">
      <Link href={pathname} locale={next} title={localeNames[next]} aria-label={localeNames[next]}>
        <Languages className="size-4" />
      </Link>
    </Button>
  )
}
