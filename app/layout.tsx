import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

import Navbar from '@/components/navbar'
import NextAuthProvider from '@/components/session-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import NextTopLoader from '@/components/ui/top-loader'
import { cn } from '@/lib/utils'

import type { Metadata, Viewport } from 'next'

import '../styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans'
})

export const metadata: Metadata = {
  title: '鱼的手记',
  description: 'An OpenAI based chat system',
  keywords: [
    '鱼的手记',
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
  children,
  params
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params

  const messages = await getMessages()
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <NextAuthProvider>
        <html lang={locale ?? 'en'} className={cn(inter.variable)} suppressHydrationWarning>
          <body className={cn('bg-background min-h-screen font-sans antialiased')} suppressHydrationWarning>
            <NextTopLoader />
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
              <Navbar />
              <Toaster />
              <main>{children}</main>
            </ThemeProvider>
          </body>
        </html>
      </NextAuthProvider>
    </NextIntlClientProvider>
  )
}
