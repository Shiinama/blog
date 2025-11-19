import { notFound } from 'next/navigation'

import { PostForm } from '@/components/posts/post-form'
import { getAllCategories, getPostById } from '@/lib/posts'

interface EditPostPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params
  if (!id) {
    notFound()
  }
  const [post, categories] = await Promise.all([getPostById(id, { includeDrafts: true }), getAllCategories()])

  if (!post) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">{post.title}</h2>
      <PostForm post={post} categories={categories} />
    </div>
  )
}
