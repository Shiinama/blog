import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'

import Navbar from '@/components/navbar'
import { routing } from '@/i18n/routing'
import { buildAbsoluteUrl, buildLanguageAlternates, getSiteOrigin } from '@/lib/metadata'

import type { Metadata } from 'next'
import type { ReactNode } from 'react'

type LocaleLayoutProps = Readonly<{
  children: ReactNode
  params: Promise<{ locale: string }>
}>

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

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params

  if (!routing.locales.includes(locale)) {
    notFound()
  }

  const t = await getTranslations({ locale, namespace: 'seo' })
  const siteTitle = t('siteTitle')
  const description = t('siteDescription')

  return {
    metadataBase: new URL(getSiteOrigin()),
    title: {
      default: siteTitle,
      template: `%s | ${siteTitle}`
    },
    description,
    alternates: {
      canonical: locale === routing.defaultLocale ? '/' : `/${locale}`,
      languages: buildLanguageAlternates('/')
    },
    openGraph: {
      title: siteTitle,
      description,
      url: buildAbsoluteUrl('/'),
      siteName: siteTitle,
      type: 'website',
      locale
    },
    twitter: {
      card: 'summary_large_image',
      title: siteTitle,
      description
    }
  }
}
