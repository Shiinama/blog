import { Inter } from 'next/font/google'

import NextAuthProvider from '@/components/session-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import NextTopLoader from '@/components/ui/top-loader'
import { getSiteOrigin } from '@/lib/metadata'
import { cn } from '@/lib/utils'

import type { Metadata, Viewport } from 'next'

import '../styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans'
})

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  title: 'Fish Notes',
  description: 'A quiet reading list of long-form notes, engineering guides, and applied AI/SEO growth playbooks.'
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <NextAuthProvider>
      <html className={cn(inter.variable)} suppressHydrationWarning>
        <body className={cn('bg-background min-h-screen font-sans antialiased')} suppressHydrationWarning>
          <NextTopLoader />
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <Toaster />
            {children}
          </ThemeProvider>
        </body>
      </html>
    </NextAuthProvider>
  )
}
