import { getTranslations } from 'next-intl/server'

import { PostExplorer } from '@/components/posts/post-explorer'
import { routing } from '@/i18n/routing'
import { formatCategoryLabel, getCategoryTranslationKey } from '@/lib/categories'
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
  const articleT = await getTranslations('article')
  const [{ posts: explorerPosts, total }, categories] = await Promise.all([
    getExplorerPosts({ locale, page: 1, pageSize: 20 }),
    getVisibleCategoriesWithCounts(locale)
  ])

  const categoryLabels = new Map<string, string>()
  const explorerCategories = categories.map((category) => {
    const translationKey = getCategoryTranslationKey(category.key)
    const fallbackLabel = category.key
      ? (articleT(translationKey as any) ?? formatCategoryLabel(category.key))
      : 'Uncategorized'
    categoryLabels.set(category.id, fallbackLabel)
    return {
      id: category.id,
      label: fallbackLabel,
      count: category.postCount ?? 0
    }
  })
  const localizedExplorerPosts = explorerPosts.map((post) => ({
    ...post,
    categoryLabel: post.categoryId ? (categoryLabels.get(post.categoryId) ?? post.categoryLabel) : post.categoryLabel
  }))

  return (
    <div className="relative isolate overflow-hidden">
      <div className="from-primary/5 pointer-events-none absolute inset-0 -z-10 bg-linear-to-b via-transparent to-transparent blur-3xl" />
      <div className="mx-auto w-full max-w-5xl px-4 pt-8 pb-16 sm:px-6 lg:px-8 lg:pt-12">
        <PostExplorer
          initialPosts={localizedExplorerPosts}
          initialTotal={total}
          categories={explorerCategories}
          locale={locale}
        />
      </div>
    </div>
  )
}
