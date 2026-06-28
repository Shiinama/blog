import { PostForm } from '@/components/posts/post-form'
import { getAllCategories } from '@/lib/posts'

export default async function NewPostPage() {
  const categories = await getAllCategories()

  return <PostForm categories={categories} />
}
