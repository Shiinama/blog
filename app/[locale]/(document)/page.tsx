import { Rss } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { PostExplorer } from '@/components/posts/post-explorer'
import { Link } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { buildAbsoluteUrl, buildLanguageAlternates } from '@/lib/metadata'
import { getExplorerPosts, getVisibleCategoriesWithCounts } from '@/lib/posts'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'seo' })
  const pageTitle = t('homeTitle')
  const description = t('homeDescription')
  const canonicalPath = routing.defaultLocale === locale ? '/' : `/${locale}`

  return {
    title: pageTitle,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: buildLanguageAlternates('/')
    },
    openGraph: {
      title: pageTitle,
      description,
      url: buildAbsoluteUrl(canonicalPath),
      siteName: t('siteTitle'),
      locale
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description
    }
  }
}

export default async function ContentPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const [articleT, homeT] = await Promise.all([getTranslations('article'), getTranslations('home')])
  const [{ posts: explorerPosts, total }, categories] = await Promise.all([
    getExplorerPosts({ locale, page: 1, pageSize: 20 }),
    getVisibleCategoriesWithCounts()
  ])

  const explorerCategories = categories.map((category) => {
    const fallbackLabel = category.key ? (articleT(category.key as any) ?? category.key) : 'Uncategorized'
    return {
      id: category.id,
      label: fallbackLabel,
      count: category.postCount ?? 0
    }
  })

  return (
    <div className="relative isolate overflow-hidden">
      <div className="from-primary/5 pointer-events-none absolute inset-0 -z-10 bg-linear-to-b via-transparent to-transparent blur-3xl" />
      <div className="mx-auto w-full max-w-4xl px-4 pt-8 pb-16 sm:px-6 lg:px-8 lg:pt-12">
        <header className="bg-card/75 ring-border/30 rounded-3xl px-5 py-6 shadow-[0_16px_50px_rgba(0,0,0,0.08)] ring-1 backdrop-blur-sm sm:px-7 dark:ring-white/10">
          <div className="space-y-3">
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.35em] uppercase">
              {homeT('heroKicker')}
            </p>
            <div className="space-y-2">
              <h2 className="text-foreground text-3xl leading-tight font-semibold sm:text-4xl">{homeT('heroTitle')}</h2>
              <p className="text-muted-foreground text-base leading-relaxed sm:text-lg">{homeT('heroDescription')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-sm">
              <Link
                href="/rss.xml"
                className="text-foreground hover:text-primary inline-flex items-center gap-2 font-semibold"
              >
                <Rss className="h-4 w-4" />
                {homeT('rssCta')}
              </Link>
              <span className="text-muted-foreground text-xs sm:text-sm">{homeT('rssHint')}</span>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm">{homeT('pwaHint')}</p>
          </div>
        </header>

        <PostExplorer
          initialPosts={explorerPosts}
          initialTotal={total}
          categories={explorerCategories}
          locale={locale}
        />
      </div>
    </div>
  )
}
