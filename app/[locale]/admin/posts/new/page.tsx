import { getLocale, getTranslations } from 'next-intl/server'

import { PostForm } from '@/components/posts/post-form'
import { categoryLabel } from '@/i18n/categories'
import { listAllCategories } from '@/lib/data/posts'
import { isLocale } from '@/lib/metadata'
import { requireAdminPage } from '@/lib/session'

export default async function NewPostPage() {
  await requireAdminPage()
  const [categories, t, locale] = await Promise.all([listAllCategories(), getTranslations('categories'), getLocale()])

  return (
    <PostForm
      post={null}
      locale={isLocale(locale) ? locale : 'zh'}
      categories={categories.map((c) => ({ id: c.id, key: c.key, label: categoryLabel(t, c.key) }))}
    />
  )
}
