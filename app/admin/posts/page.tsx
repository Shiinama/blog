import { PostTable } from '@/components/posts/post-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link } from '@/i18n/navigation'
import { formatCategoryLabel } from '@/lib/categories'
import { getAllCategories, getPaginatedPosts } from '@/lib/posts'
import { getTranslations } from 'next-intl/server'

import type { PostStatus } from '@/drizzle/schema'

interface AdminPostsPageProps {
  searchParams: Promise<Record<string, string | undefined>>
}

function buildQueryString(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '' || value === 'all') return
    query.set(key, String(value))
  })
  return query.toString()
}

export default async function AdminPostsPage({ searchParams }: AdminPostsPageProps) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? '1') || 1)
  const search = params.search ?? ''
  const statusParam = params.status === 'PUBLISHED' || params.status === 'DRAFT' ? params.status : 'all'
  const categoryParam = params.category && params.category !== 'all' ? params.category : undefined

  const [data, categories] = await Promise.all([
    getPaginatedPosts({
      page,
      pageSize: 20,
      search: search || undefined,
      status: statusParam === 'all' ? 'all' : (statusParam as PostStatus),
      categoryId: categoryParam
    }),
    getAllCategories()
  ])

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize))
  const filterBase = {
    search,
    status: statusParam,
    category: params.category ?? 'all'
  }

  const t = await getTranslations('admin')

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{t('posts.description')}</p>
          <h2 className="text-3xl font-bold">{t('posts.title')}</h2>
        </div>
        <Button asChild>
          <Link href="/admin/posts/new">{t('posts.actions.newPost')}</Link>
        </Button>
      </div>
      <form className="grid gap-4 rounded-lg border bg-card p-4 md:grid-cols-4" method="get">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium">{t('posts.filters.searchLabel')}</label>
          <Input name="search" placeholder={t('posts.filters.searchPlaceholder')} defaultValue={search} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">{t('posts.filters.statusLabel')}</label>
          <select
            name="status"
            defaultValue={statusParam}
            className="w-full rounded-md border bg-background p-2 text-sm"
          >
            <option value="all">{t('posts.filters.statusOptions.all')}</option>
            <option value="PUBLISHED">{t('posts.filters.statusOptions.published')}</option>
            <option value="DRAFT">{t('posts.filters.statusOptions.draft')}</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">{t('posts.filters.categoryLabel')}</label>
          <select
            name="category"
            defaultValue={categoryParam ?? 'all'}
            className="w-full rounded-md border bg-background p-2 text-sm"
          >
            <option value="all">{t('posts.filters.categoryOptions.all')}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {formatCategoryLabel(category.key) || category.key}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-4 flex justify-end">
          <Button type="submit">{t('posts.filters.apply')}</Button>
        </div>
      </form>
      <PostTable posts={data.posts} />
      <div className="flex items-center justify-between text-sm">
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
      </div>
    </div>
  )
}
