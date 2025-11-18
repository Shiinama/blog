'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useFormState } from 'react-dom'

import { deletePostAction, savePostAction } from '@/actions/posts'
import { MarkdownEditor } from '@/components/posts/markdown-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from '@/i18n/navigation'
import { formatCategoryLabel } from '@/lib/categories'
import { PostStatus } from '@/lib/db'

import type { CategorySummary, PostDetails } from '@/lib/posts/types'

import { initialPostFormState } from '@/actions/posts/form-state'

type EditablePost = PostDetails

interface PostFormProps {
  post?: EditablePost
  categories: CategorySummary[]
}

const statusOptions = [
  { label: '草稿', value: PostStatus.DRAFT },
  { label: '已发布', value: PostStatus.PUBLISHED }
]

function formatDateValue(date?: Date | null) {
  if (!date) return ''
  const iso = new Date(date).toISOString()
  return iso.slice(0, 16)
}

export function PostForm({ post, categories }: PostFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [content, setContent] = useState(post?.content ?? '')
  const [tagsValue, setTagsValue] = useState(post?.tags?.join(', ') ?? '')
  const [state, formAction] = useFormState(savePostAction, initialPostFormState)
  const [isDeleting, startDelete] = useTransition()

  useEffect(() => {
    if (state.status === 'success') {
      toast({
        title: '内容已保存',
        description: '文章保存成功'
      })
      if (state.redirectTo) {
        router.replace(state.redirectTo)
      }
    } else if (state.status === 'error' && state.message) {
      toast({
        title: '保存失败',
        description: state.message,
        variant: 'destructive'
      })
    }
  }, [state, router, toast])

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category.id,
        label: formatCategoryLabel(category.key) || category.key
      })),
    [categories]
  )

  const handleDelete = () => {
    if (!post) return
    if (!confirm('确定要删除这篇文章吗？此操作不可恢复。')) {
      return
    }
    startDelete(async () => {
      const result = await deletePostAction(post.id)
      if (result.status === 'success') {
        toast({ title: '文章已删除' })
        router.replace('/admin/posts')
      } else {
        toast({
          title: '删除失败',
          description: result.message ?? '请稍后重试',
          variant: 'destructive'
        })
      }
    })
  }

  const fieldError = (field: string) => state.errors?.[field]?.join(', ')

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="postId" value={post?.id ?? ''} />
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="title">标题</Label>
          <Input id="title" name="title" defaultValue={post?.title} placeholder="请输入标题" required />
          {fieldError('title') && <p className="text-sm text-destructive">{fieldError('title')}</p>}
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" defaultValue={post?.slug} placeholder="app/your-article" required />
          {fieldError('slug') && <p className="text-sm text-destructive">{fieldError('slug')}</p>}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="categoryId">分类</Label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={post?.categoryId}
            className="mt-2 w-full rounded-md border bg-background p-2"
            required
          >
            <option value="">选择文章归属分类</option>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldError('categoryId') && <p className="text-sm text-destructive">{fieldError('categoryId')}</p>}
        </div>
        <div>
          <Label htmlFor="status">状态</Label>
          <select
            id="status"
            name="status"
            defaultValue={post?.status ?? PostStatus.DRAFT}
            className="mt-2 w-full rounded-md border bg-background p-2"
            required
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="coverImageUrl">封面图 URL</Label>
          <Input id="coverImageUrl" name="coverImageUrl" defaultValue={post?.coverImageUrl ?? ''} placeholder="https://..." />
          {fieldError('coverImageUrl') && <p className="text-sm text-destructive">{fieldError('coverImageUrl')}</p>}
        </div>
        <div>
          <Label htmlFor="tags">标签（逗号分隔）</Label>
          <Input id="tags" name="tags" value={tagsValue} onChange={(event) => setTagsValue(event.target.value)} />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <Label htmlFor="sortOrder">排序权重</Label>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            defaultValue={post?.sortOrder ?? 0}
            placeholder="0"
          />
        </div>
        <div>
          <Label htmlFor="language">语言</Label>
          <Input id="language" name="language" defaultValue={post?.language ?? 'zh'} />
        </div>
        <div>
          <Label htmlFor="publishedAt">发布时间</Label>
          <Input id="publishedAt" name="publishedAt" type="datetime-local" defaultValue={formatDateValue(post?.publishedAt)} />
        </div>
      </div>
      <div>
        <Label htmlFor="summary">摘要</Label>
        <Textarea
          id="summary"
          name="summary"
          defaultValue={post?.summary ?? ''}
          placeholder="用于列表展示与 SEO 的简介..."
          rows={4}
        />
      </div>
      <div className="space-y-2">
        <Label>正文内容</Label>
        <MarkdownEditor
          name="content"
          value={content}
          onChange={setContent}
          placeholder="使用 Markdown/MDX 进行写作..."
        />
        {fieldError('content') && <p className="text-sm text-destructive">{fieldError('content')}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={state.status === 'success'}>
          保存文章
        </Button>
        {post && (
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? '删除中...' : '删除文章'}
          </Button>
        )}
      </div>
    </form>
  )
}
