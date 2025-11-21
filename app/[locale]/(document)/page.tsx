import { getTranslations } from 'next-intl/server'

import { PostExplorer } from '@/components/posts/post-explorer'
import { routing } from '@/i18n/routing'
import { formatCategoryLabel } from '@/lib/categories'
import { buildAbsoluteUrl, buildLanguageAlternates } from '@/lib/metadata'
import { getVisibleCategoriesWithPosts } from '@/lib/posts'

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

export default async function ContentPage() {
  const [articleT, homeT] = await Promise.all([getTranslations('article'), getTranslations('home')])
  const categories = await getVisibleCategoriesWithPosts()

  const localizedCategories = categories.map((category) => {
    const fallbackLabel = formatCategoryLabel(category.key) || 'Uncategorized'
    let label = fallbackLabel
    if (category.key) {
      try {
        label = articleT(category.key as any)
      } catch {
        label = fallbackLabel
      }
    }

    return {
      id: category.id,
      label,
      posts: category.posts
    }
  })

  const explorerPosts = localizedCategories
    .flatMap((category) =>
      category.posts.map((post) => {
        const publishedAt = post.publishedAt ? new Date(post.publishedAt).toISOString() : null
        const createdAt = post.createdAt ? new Date(post.createdAt).toISOString() : null
        const sortTimestamp = new Date(post.publishedAt ?? post.createdAt ?? new Date()).getTime()
        return {
          id: post.id,
          slug: post.slug,
          title: post.title,
          summary: post.summary,
          coverImageUrl: post.coverImageUrl,
          categoryId: category.id,
          categoryLabel: category.label,
          publishedAt,
          createdAt,
          sortTimestamp
        }
      })
    )
    .sort((a, b) => b.sortTimestamp - a.sortTimestamp)

  const explorerCategories = localizedCategories
    .filter((category) => category.posts.length > 0)
    .map((category) => ({
      id: category.id,
      label: category.label,
      count: category.posts.length
    }))

  return (
    <>
      <div className="mx-auto w-full max-w-4xl px-4 pt-8 pb-14 sm:px-6 lg:px-8 lg:pt-12">
        <header className="space-y-3.5">
          <div className="space-y-2">
            <h2 className="text-foreground text-2xl leading-tight font-semibold sm:text-3xl">{homeT('heroTitle')}</h2>
            <p className="text-muted-foreground text-sm sm:text-[0.95rem]">{homeT('heroDescription')}</p>
          </div>
        </header>

        <PostExplorer initialPosts={explorerPosts} categories={explorerCategories} />
      </div>
    </>
  )
}
