'use client'

import { Languages } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useTransition } from 'react'

import { Button } from '@/components/ui/button'
import useRouter from '@/hooks/use-router'
import { usePathname } from '@/i18n/navigation'
import { DEFAULT_LOCALE, locales } from '@/i18n/routing'

export default function LanguageSwitcher() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const pathname = usePathname()
  const locale = useLocale()
  const params = useParams()

  const currentLocale = locale ?? DEFAULT_LOCALE
  const nextLocale = currentLocale === 'zh' ? 'en' : 'zh'
  const nextLocaleLabel = locales.find((item) => item.code === nextLocale)?.name ?? nextLocale

  const onToggleLocale = () => {
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- TypeScript will validate that only known `params`
        // are used in combination with a given `pathname`. Since the two will
        // always match for the current route, we can skip runtime checks.
        { pathname, params },
        { locale: nextLocale }
      )
    })
  }

  return (
    <Button variant="ghost" size="sm" title={nextLocaleLabel} disabled={isPending} onClick={onToggleLocale}>
      <Languages size={18} />
    </Button>
  )
}
