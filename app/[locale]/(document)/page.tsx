import { getTranslations } from 'next-intl/server'

import { PostExplorer } from '@/components/posts/post-explorer'
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
    <>
      <div className="mx-auto w-full max-w-4xl px-4 pt-8 pb-14 sm:px-6 lg:px-8 lg:pt-12">
        <header className="space-y-3.5">
          <div className="space-y-2">
            <h2 className="text-foreground text-2xl leading-tight font-semibold sm:text-3xl">{homeT('heroTitle')}</h2>
            <p className="text-muted-foreground text-sm sm:text-[0.95rem]">{homeT('heroDescription')}</p>
          </div>
        </header>

        <PostExplorer
          initialPosts={explorerPosts}
          initialTotal={total}
          categories={explorerCategories}
          locale={locale}
        />
      </div>
    </>
  )
}
