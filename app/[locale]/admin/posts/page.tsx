import Form from 'next/form'
import { getTranslations } from 'next-intl/server'
import { z } from 'zod'

import { PostTable } from '@/components/posts/post-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { postStatuses } from '@/drizzle/schema'
import { categoryLabel } from '@/i18n/categories'
import { Link } from '@/i18n/navigation'
import { listAllCategories, listPostsForAdmin } from '@/lib/data/posts'
import { requireAdminPage } from '@/lib/session'

const filtersSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  status: z.enum(postStatuses).optional().catch(undefined),
  category: z.string().max(64).optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1)
})

export default async function AdminPostsPage({ searchParams }: PageProps<'/[locale]/admin/posts'>) {
  await requireAdminPage()
  const filters = filtersSchema.parse(await searchParams)
  const [{ items, total, pageCount }, categories, t, tCategories] = await Promise.all([
    listPostsForAdmin({ query: filters.q, status: filters.status, categoryId: filters.category, page: filters.page }),
    listAllCategories(),
    getTranslations('admin.posts'),
    getTranslations('categories')
  ])
  const label = (key: string) => categoryLabel(tCategories, key)
  const pageHref = (page: number) => ({
    pathname: '/admin/posts',
    query: {
      ...(filters.q && { q: filters.q }),
      ...(filters.status && { status: filters.status }),
      ...(filters.category && { category: filters.category }),
      page: String(page)
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <Button asChild>
          <Link href="/admin/posts/new">{t('new')}</Link>
        </Button>
      </div>

      <Form action="" className="flex flex-wrap gap-2">
        <Input name="q" defaultValue={filters.q} placeholder={t('search')} className="max-w-xs" />
        <select
          name="status"
          defaultValue={filters.status ?? ''}
          className="bg-background rounded-md border px-2 text-sm"
        >
          <option value="">{t('allStatuses')}</option>
          {postStatuses.map((status) => (
            <option key={status} value={status}>
              {t(`status.${status}`)}
            </option>
          ))}
        </select>
        <select
          name="category"
          defaultValue={filters.category ?? ''}
          className="bg-background rounded-md border px-2 text-sm"
        >
          <option value="">{t('allCategories')}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {label(category.key)}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          {t('filter')}
        </Button>
      </Form>

      <Card>
        <CardContent className="p-0">
          <PostTable posts={items} categoryLabels={Object.fromEntries(categories.map((c) => [c.key, label(c.key)]))} />
        </CardContent>
        <CardFooter className="justify-between text-sm">
          <span className="text-muted-foreground">{t('pagination', { page: filters.page, pageCount, total })}</span>
          <div className="flex gap-2">
            {filters.page > 1 && (
              <Button asChild variant="outline" size="sm">
                <Link href={pageHref(filters.page - 1)}>{t('prev')}</Link>
              </Button>
            )}
            {filters.page < pageCount && (
              <Button asChild variant="outline" size="sm">
                <Link href={pageHref(filters.page + 1)}>{t('next')}</Link>
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
