import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'
import { ThemeProvider } from 'next-themes'

import { Navbar } from '@/components/layout/navbar'
import { PwaPrompt } from '@/components/pwa/pwa-prompt'
import { Toaster } from '@/components/ui/sonner'
import { routing } from '@/i18n/routing'
import { alternates, siteOrigin } from '@/lib/metadata'

import type { Metadata, Viewport } from 'next'

import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations('seo')
  const siteTitle = t('siteTitle')

  return {
    metadataBase: new URL(siteOrigin),
    title: { default: siteTitle, template: `%s | ${siteTitle}` },
    description: t('siteDescription'),
    alternates: {
      ...alternates('/', locale),
      types: { 'application/rss+xml': [{ url: locale === routing.defaultLocale ? '/rss.xml' : `/${locale}/rss.xml` }] }
    },
    openGraph: { siteName: siteTitle, type: 'website', locale },
    twitter: { card: 'summary_large_image' }
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' }
  ]
}

export default async function RootLayout({ children }: LayoutProps<'/[locale]'>) {
  const locale = await getLocale()

  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <body className="bg-background min-h-screen font-sans antialiased">
        <NextIntlClientProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <Navbar />
            <main>{children}</main>
            <PwaPrompt />
            <Toaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
