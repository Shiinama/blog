import { Rss } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'
import { Suspense } from 'react'

import { UserMenu } from '@/components/auth/user-menu'
import { NamedLogoWithLink } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { localePath } from '@/lib/metadata'

import { LanguageSwitcher } from './language-switcher'
import { ThemeToggle } from './theme-toggle'

export async function Navbar() {
  const [t, locale] = await Promise.all([getTranslations('nav'), getLocale()])

  return (
    <header className="bg-background/85 sticky top-0 z-50 w-full px-4 py-2 shadow-[0_1px_12px_rgba(0,0,0,0.05)] backdrop-blur dark:shadow-[0_1px_12px_rgba(0,0,0,0.35)]">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-2">
        <NamedLogoWithLink brandTitle={t('brand')} />
        <nav className="ml-auto flex items-center gap-1 text-sm">
          <Button asChild variant="link" size="sm">
            <Link href="/about">{t('about')}</Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex">
            {/* A route handler, not a page: skip client-side navigation. */}
            <a href={localePath('/rss.xml', locale)} aria-label="RSS" title="RSS">
              <Rss className="size-4" />
            </a>
          </Button>
          <Suspense fallback={<div className="size-9" aria-hidden />}>
            <LanguageSwitcher />
          </Suspense>
          <ThemeToggle label={t('toggleTheme')} />
          {/* Reads the session: streams in without blocking the page. */}
          <Suspense fallback={<div className="size-9" aria-hidden />}>
            <UserMenu />
          </Suspense>
        </nav>
      </div>
    </header>
  )
}
