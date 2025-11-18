import { PostTable } from '@/components/posts/post-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link } from '@/i18n/navigation'
import { formatCategoryLabel } from '@/lib/categories'
import { getAllCategories, getPaginatedPosts } from '@/lib/posts'

import type { PostStatus } from '@/lib/db'

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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">集中管理所有文章，支持搜索与筛选。</p>
          <h2 className="text-3xl font-bold">文章列表</h2>
        </div>
        <Button asChild>
          <Link href="/admin/posts/new">撰写新文章</Link>
        </Button>
      </div>
      <form className="grid gap-4 rounded-lg border bg-card p-4 md:grid-cols-4" method="get">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium">搜索</label>
          <Input name="search" placeholder="标题或摘要关键字" defaultValue={search} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">状态</label>
          <select
            name="status"
            defaultValue={statusParam}
            className="w-full rounded-md border bg-background p-2 text-sm"
          >
            <option value="all">全部</option>
            <option value="PUBLISHED">已发布</option>
            <option value="DRAFT">草稿</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">分类</label>
          <select
            name="category"
            defaultValue={categoryParam ?? 'all'}
            className="w-full rounded-md border bg-background p-2 text-sm"
          >
            <option value="all">全部</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {formatCategoryLabel(category.key) || category.key}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-4 flex justify-end">
          <Button type="submit">应用筛选</Button>
        </div>
      </form>
      <PostTable posts={data.posts} />
      <div className="flex items-center justify-between text-sm">
        <span>
          第 {page} / {totalPages} 页（共 {data.total} 篇文章）
        </span>
        <div className="flex gap-2">
          <Button asChild variant="outline" disabled={page <= 1}>
            <Link href={`/admin/posts?${buildQueryString({ ...filterBase, page: page - 1 })}`}>上一页</Link>
          </Button>
          <Button asChild variant="outline" disabled={page >= totalPages}>
            <Link href={`/admin/posts?${buildQueryString({ ...filterBase, page: page + 1 })}`}>下一页</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
