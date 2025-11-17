import { notFound } from 'next/navigation'

import { PostForm } from '@/components/posts/post-form'
import { getAllCategories, getPostBySlug } from '@/lib/posts'

interface EditPostPageProps {
  params: Promise<{ slug: string[] }>
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { slug } = await params
  if (!slug.length) {
    notFound()
  }
  const slugPath = slug.join('/')
  const [post, categories] = await Promise.all([
    getPostBySlug(slugPath, { includeDrafts: true }),
    getAllCategories()
  ])

  if (!post) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">编辑文章</p>
        <h2 className="text-3xl font-bold">{post.title}</h2>
      </div>
      <PostForm post={post} categories={categories} />
    </div>
  )
}
