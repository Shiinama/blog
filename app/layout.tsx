import 'styles/tailwind.css'
import 'pliny/search/algolia.css'

import { Space_Grotesk } from 'next/font/google'
import { SearchProvider, SearchConfig } from 'pliny/search'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { SITE } from 'config/const'
import { ThemeProviders } from './theme-providers'
import { Metadata } from 'next'
import { Providers as ChakraProvider } from '@/components/ChakraProvider'
import AnimateBall from '@/components/AnimateBall'

const space_grotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE.website),
  title: {
    default: SITE.title,
    template: `%s | ${SITE.title}`,
  },
  description: SITE.description,
  openGraph: {
    title: SITE.title,
    description: SITE.description,
    url: './',
    siteName: SITE.title,
    images: [SITE.socialBanner],
    locale: 'en_US',
    type: 'website',
  },
  alternates: {
    canonical: './',
    types: {
      'application/rss+xml': `${SITE.website}/feed.xml`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  twitter: {
    title: SITE.title,
    card: 'summary_large_image',
    images: [SITE.socialBanner],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${space_grotesk.variable} scroll-smooth`} suppressHydrationWarning>
      <link rel="apple-touch-icon" sizes="76x76" href="/static/favicons/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/static/favicons/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/static/favicons/favicon-16x16.png" />
      <link rel="manifest" href="/static/favicons/site.webmanifest" />
      <link rel="mask-icon" href="/static/favicons/safari-pinned-tab.svg" color="#5bbad5" />
      <meta name="msapplication-TileColor" content="#000000" />
      <meta name="theme-color" media="(prefers-color-scheme: light)" content="#fff" />
      <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#000" />
      <link rel="alternate" type="application/rss+xml" href="/feed.xml" />
      <body className="bg-white text-gray-700 antialiased dark:bg-gray-950 dark:text-gray-200">
        <ThemeProviders>
          <ChakraProvider>
            <div className="flex h-screen flex-col justify-between font-sans">
              <SearchProvider searchConfig={SITE.search as SearchConfig}>
                <Header />
                <main className="mb-auto flex flex-col items-center">{children}</main>
              </SearchProvider>
              <AnimateBall />
              <Footer />
            </div>
          </ChakraProvider>
        </ThemeProviders>
      </body>
    </html>
  )
}
