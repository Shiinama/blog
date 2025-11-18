import { getTranslations } from 'next-intl/server'

import { PostTable } from '@/components/posts/post-table'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Link } from '@/i18n/navigation'
import { formatCategoryLabel } from '@/lib/categories'
import { getAllCategories, getPaginatedPosts } from '@/lib/posts'

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
      <Card className="overflow-hidden border border-slate-200 bg-gradient-to-br from-white/80 to-slate-50/60 shadow-sm shadow-slate-900/10">
        <CardHeader className="flex flex-col gap-3 pb-3 pt-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardDescription className="text-sm text-muted-foreground">{t('posts.description')}</CardDescription>
            <CardTitle className="text-3xl font-semibold text-slate-900">{t('posts.title')}</CardTitle>
          </div>
          <Button asChild size="lg">
            <Link href="/admin/posts/new">{t('posts.actions.newPost')}</Link>
          </Button>
        </CardHeader>
        <CardContent className="pt-0 pb-6">
          <form
            className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-inner shadow-slate-900/5 md:grid-cols-4"
            method="get"
          >
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">{t('posts.filters.searchLabel')}</label>
              <Input
                name="search"
                placeholder={t('posts.filters.searchPlaceholder')}
                defaultValue={search}
                className="bg-white"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">{t('posts.filters.statusLabel')}</label>
              <select
                name="status"
                defaultValue={statusParam}
                className="bg-white w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-primary"
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
                className="bg-white w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:border-primary"
              >
                <option value="all">{t('posts.filters.categoryOptions.all')}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {formatCategoryLabel(category.key) || category.key}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end md:col-span-4">
              <Button type="submit">{t('posts.filters.apply')}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card className="overflow-hidden border border-slate-200 bg-white/90 shadow-sm">
        <CardContent className="p-0">
          <PostTable posts={data.posts} />
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4 text-sm text-muted-foreground">
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
