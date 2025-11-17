import { PostForm } from '@/components/posts/post-form'
import { getAllCategories } from '@/lib/posts'

export default async function NewPostPage() {
  const categories = await getAllCategories()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">创建新文章</p>
        <h2 className="text-3xl font-bold">撰写内容</h2>
      </div>
      <PostForm categories={categories} />
    </div>
  )
}
