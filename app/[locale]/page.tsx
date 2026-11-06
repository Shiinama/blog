import { getLocale, getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import { z } from 'zod'

import { ExplorerToolbar } from '@/components/posts/explorer-toolbar'
import { PostList, PostListSkeleton } from '@/components/posts/post-list'
import { categoryLabel } from '@/i18n/categories'
import { getVisibleCategories, listPublishedPosts, postSorts } from '@/lib/data/posts'
import { alternates } from '@/lib/metadata'

import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations('seo')])
  return {
    title: t('homeTitle'),
    description: t('homeDescription'),
    alternates: alternates('/', locale)
  }
}

const searchSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  category: z.string().max(64).optional().catch(undefined),
  sort: z.enum(postSorts).catch('newest'),
  page: z.coerce.number().int().min(1).max(1000).catch(1)
})

export default async function HomePage({ searchParams }: PageProps<'/[locale]'>) {
  const locale = await getLocale()
  const [categories, t] = await Promise.all([getVisibleCategories(locale), getTranslations('categories')])
  const categoryOptions = categories.map((category) => ({
    key: category.key,
    label: categoryLabel(t, category.key),
    count: category.postCount
  }))

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-8 pb-16 sm:px-6 lg:px-8 lg:pt-12">
      {/* Results depend on the URL; the toolbar reads it on the client. */}
      <Suspense>
        <ExplorerToolbar categories={categoryOptions} />
      </Suspense>
      <Suspense fallback={<PostListSkeleton />}>
        <Results
          locale={locale}
          searchParams={searchParams}
          labels={Object.fromEntries(categoryOptions.map((c) => [c.key, c.label]))}
        />
      </Suspense>
    </div>
  )
}

async function Results({
  locale,
  searchParams,
  labels
}: {
  locale: string
  searchParams: PageProps<'/[locale]'>['searchParams']
  labels: Record<string, string>
}) {
  const filters = searchSchema.parse(await searchParams)
  const { items, total, pageCount } = await listPublishedPosts({
    locale,
    query: filters.q || undefined,
    categoryKey: filters.category,
    sort: filters.sort,
    page: filters.page
  })
  return <PostList posts={items} total={total} page={filters.page} pageCount={pageCount} categoryLabels={labels} />
}
