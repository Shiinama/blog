import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

import Navbar from '@/components/navbar'
import { routing } from '@/i18n/routing'

import type { ReactNode } from 'react'


type LocaleLayoutProps = Readonly<{
  children: ReactNode
  params: Promise<{ locale: string }>
}>

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params

  if (!routing.locales.includes(locale)) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <main>
        <Navbar />
        {children}
      </main>
    </NextIntlClientProvider>
  )
}
