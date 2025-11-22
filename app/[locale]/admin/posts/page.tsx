import { getTranslations } from 'next-intl/server'

import { AdminFilters } from '@/components/posts/admin-filters'
import { PostTable } from '@/components/posts/post-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/i18n/navigation'
import { getAllCategories, getPaginatedPosts } from '@/lib/posts'

import type { PostStatus } from '@/drizzle/schema'

interface AdminPostsPageProps {
  searchParams: Promise<Record<string, string | undefined>>
  params: Promise<{ locale: string }>
}

function buildQueryString(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '' || value === 'all') return
    query.set(key, String(value))
  })
  return query.toString()
}

export default async function AdminPostsPage({ searchParams, params }: AdminPostsPageProps) {
  const localeParams = await params
  const paramsObj = await searchParams
  const locale = localeParams.locale
  const page = Math.max(1, Number(paramsObj.page ?? '1') || 1)
  const search = paramsObj.search ?? ''
  const statusParam = paramsObj.status === 'PUBLISHED' || paramsObj.status === 'DRAFT' ? paramsObj.status : 'all'
  const categoryParam = paramsObj.category && paramsObj.category !== 'all' ? paramsObj.category : undefined

  const [data, categories] = await Promise.all([
    getPaginatedPosts({
      page,
      pageSize: 20,
      search: search || undefined,
      status: statusParam === 'all' ? 'all' : (statusParam as PostStatus),
      categoryId: categoryParam,
      locale
    }),
    getAllCategories()
  ])

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize))
  const filterBase = {
    search,
    status: statusParam,
    category: paramsObj.category ?? 'all'
  }

  const t = await getTranslations('admin')

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-col gap-3 pt-6 pb-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardDescription>{t('posts.description')}</CardDescription>
            <CardTitle>{t('posts.title')}</CardTitle>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" size="lg">
              <Link href="/admin/subscriptions">{t('subscriptions.actions.open')}</Link>
            </Button>
            <Button asChild size="lg">
              <Link href="/admin/posts/new">{t('posts.actions.newPost')}</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-6">
          <AdminFilters
            initialSearch={search}
            initialStatus={statusParam}
            initialCategory={categoryParam ?? 'all'}
            categories={categories}
            locale={locale}
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <PostTable posts={data.posts} />
        </CardContent>
        <CardFooter>
          <span>{t('posts.pagination.caption', { page, totalPages, total: data.total })}</span>
          <div className="flex gap-2">
            <Button asChild variant="outline" disabled={page <= 1}>
              <Link href={`/admin/posts?${buildQueryString({ ...filterBase, page: page - 1 })}`}>
                {t('posts.pagination.prev')}
              </Link>
            </Button>
            <Button asChild variant="outline" disabled={page >= totalPages}>
              <Link href={`/admin/posts?${buildQueryString({ ...filterBase, page: page + 1 })}`}>
                {t('posts.pagination.next')}
              </Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
