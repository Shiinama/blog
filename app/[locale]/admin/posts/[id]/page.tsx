import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { PostForm } from '@/components/posts/post-form'
import { categoryLabel } from '@/i18n/categories'
import { getPostForEditing, listAllCategories } from '@/lib/data/posts'
import { isLocale } from '@/lib/metadata'
import { requireAdminPage } from '@/lib/session'

export default async function EditPostPage({ params, searchParams }: PageProps<'/[locale]/admin/posts/[id]'>) {
  await requireAdminPage()
  const [{ id }, { locale: requested }] = await Promise.all([params, searchParams])
  const [post, categories, t] = await Promise.all([
    getPostForEditing(id),
    listAllCategories(),
    getTranslations('categories')
  ])
  if (!post) notFound()

  const locale = typeof requested === 'string' && isLocale(requested) ? requested : post.locale
  if (!isLocale(locale)) notFound()

  return (
    <PostForm
      post={post}
      locale={locale}
      categories={categories.map((c) => ({ id: c.id, key: c.key, label: categoryLabel(t, c.key) }))}
    />
  )
}
