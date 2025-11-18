import { getTranslations } from 'next-intl/server'

import { PostForm } from '@/components/posts/post-form'
import { getAllCategories } from '@/lib/posts'

export default async function NewPostPage() {
  const categories = await getAllCategories()
  const t = await getTranslations('admin')

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground text-sm">{t('posts.new.description')}</p>
        <h2 className="text-3xl font-bold">{t('posts.new.title')}</h2>
      </div>
      <PostForm categories={categories} />
    </div>
  )
}
