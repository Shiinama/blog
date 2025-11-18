import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { cookies } from 'next/headers'

import { Link } from '@/i18n/navigation'
import { requireAdmin } from '@/lib/authz'
import { DEFAULT_LOCALE } from '@/i18n/routing'

import type { PropsWithChildren } from 'react'

export default async function AdminLayout({ children }: PropsWithChildren) {
  const user = await requireAdmin({ redirectTo: '/admin/posts' })
  const cookiesStore = await cookies()
  const locale = cookiesStore.get('NEXT_LOCALE')?.value ?? DEFAULT_LOCALE
  setRequestLocale(locale)
  const messages = await getMessages({ locale })
  const t = await getTranslations('admin')

  const name = user?.name ?? user?.email ?? ''

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="min-h-screen bg-muted/10">
        <header className="border-b bg-background">
          <div className="container flex items-center justify-between py-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('layout.welcome', { name })}</p>
              <h1 className="text-2xl font-bold">{t('layout.title')}</h1>
            </div>
            <Link href="/" className="text-sm text-primary hover:underline">
              {t('layout.backHome')}
            </Link>
          </div>
        </header>
        <main className="container py-8">{children}</main>
      </div>
    </NextIntlClientProvider>
  )
}
