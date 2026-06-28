import { notFound } from 'next/navigation'

import { PostForm } from '@/components/posts/post-form'
import { getAllCategories, getPostById } from '@/lib/posts'

interface EditPostPageProps {
  params: Promise<{ id: string; locale: string }>
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id, locale } = await params
  if (!id) {
    notFound()
  }
  const [post, categories] = await Promise.all([
    getPostById(id, { includeDrafts: true, locale }),
    getAllCategories()
  ])

  if (!post) {
    notFound()
  }

  return <PostForm post={post} categories={categories} locale={locale} />
}
