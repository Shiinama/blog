import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'

import NextAuthProvider from '@/components/session-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'

import type { Metadata, Viewport } from 'next'

import '../styles/globals.css'
import '../styles/code.css'

export const metadata: Metadata = {
  title: '鱼的杂记',
  description: 'An OpenAI based chat system',
  keywords: [
    '鱼的杂记',
    'business AI',
    'AI chatbot',
    'chatbot templates',
    'AI-powered communication',
    'business automation',
    'customer service AI',
    'AI templates',
    'conversational AI',
    'business intelligence',
    'AI solutions',
    'custom chatbots'
  ]
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()
  return (
    <NextAuthProvider>
      <html lang={locale} suppressHydrationWarning>
        <body className={cn('min-h-screen bg-background')} suppressHydrationWarning>
          <NextIntlClientProvider messages={messages}>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
              {children}
              <Toaster />
            </ThemeProvider>
          </NextIntlClientProvider>
        </body>
      </html>
    </NextAuthProvider>
  )
}
