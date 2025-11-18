import { getTranslations } from 'next-intl/server'

import { PostExplorer } from '@/components/posts/post-explorer'
import { formatCategoryLabel } from '@/lib/categories'
import { getVisibleCategoriesWithPosts } from '@/lib/posts'

export const metadata = {
  title: 'Documentation',
  description: 'Manage and view all documentation'
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

  const totalPosts = explorerPosts.length

  return (
    <>
      <div className="mx-auto w-full max-w-5xl px-4 pt-8 pb-14 sm:px-6 lg:px-8 lg:pt-12">
        <header className="space-y-3.5">
          <p className="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.45em] uppercase">
            {homeT('heroBadge')}
          </p>
          <div className="space-y-2">
            <h1 className="text-foreground text-2xl leading-tight font-semibold sm:text-3xl">
              {homeT('heroTitle')}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-[0.95rem]">{homeT('heroDescription')}</p>
          </div>
          <dl className="text-muted-foreground flex flex-wrap gap-5 text-[0.7rem]">
            <div>
              <dt className="tracking-[0.35em] uppercase">{homeT('stats.articlesLabel')}</dt>
              <dd className="text-foreground mt-1 text-xl font-semibold">{totalPosts}</dd>
            </div>
            <div>
              <dt className="tracking-[0.35em] uppercase">{homeT('stats.categoriesLabel')}</dt>
              <dd className="text-foreground mt-1 text-xl font-semibold">{explorerCategories.length}</dd>
            </div>
          </dl>
        </header>

        <PostExplorer initialPosts={explorerPosts} categories={explorerCategories} />
      </div>
    </>
  )
}
