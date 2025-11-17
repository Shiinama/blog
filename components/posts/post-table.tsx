'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { deletePostAction, togglePostStatusAction } from '@/actions/posts'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

import { PostStatus } from '@/lib/db'
import type { PostStatus as PostStatusType } from '@/lib/db'
import type { getPaginatedPosts } from '@/lib/posts'
import { formatCategoryLabel } from '@/lib/categories'

type PostListItem = Awaited<ReturnType<typeof getPaginatedPosts>>['posts'][number]

interface PostTableProps {
  posts: PostListItem[]
}

const statusLabel: Record<PostStatusType, string> = {
  [PostStatus.DRAFT]: '草稿',
  [PostStatus.PUBLISHED]: '已发布'
}

export function PostTable({ posts }: PostTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [actionTarget, setActionTarget] = useState<{ type: 'delete' | 'toggle'; id: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    if (!confirm('确定要删除这篇文章吗？')) {
      return
    }
    setActionTarget({ type: 'delete', id })
    startTransition(async () => {
      const result = await deletePostAction(id)
      if (result.status === 'success') {
        toast({ title: '文章已删除' })
        router.refresh()
      } else {
        toast({
          title: '删除失败',
          description: result.message ?? '请稍后再试',
          variant: 'destructive'
        })
      }
      setActionTarget(null)
    })
  }

  const handleToggle = (post: PostListItem) => {
    const nextStatus = post.status === PostStatus.PUBLISHED ? PostStatus.DRAFT : PostStatus.PUBLISHED
    setActionTarget({ type: 'toggle', id: post.id })
    startTransition(async () => {
      const result = await togglePostStatusAction(post.id, nextStatus)
      if (result.status === 'success') {
        toast({ title: `已切换为${statusLabel[nextStatus]}` })
        router.refresh()
      } else {
        toast({
          title: '状态更新失败',
          description: result.message ?? '请稍后重试',
          variant: 'destructive'
        })
      }
      setActionTarget(null)
    })
  }

  if (posts.length === 0) {
    return <p className="text-sm text-muted-foreground">暂无文章</p>
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">标题</th>
            <th className="px-4 py-3">分类</th>
            <th className="px-4 py-3">状态</th>
            <th className="px-4 py-3">更新时间</th>
            <th className="px-4 py-3 text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => {
            const pendingDelete = actionTarget?.type === 'delete' && actionTarget.id === post.id && isPending
            const pendingToggle = actionTarget?.type === 'toggle' && actionTarget.id === post.id && isPending
            return (
              <tr key={post.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <Link href={`/admin/posts/${post.slug}`} className="font-medium text-primary hover:underline">
                      {post.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      <Link href={`/content/${post.slug}`} target="_blank" rel="noreferrer">
                        /content/{post.slug}
                      </Link>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{formatCategoryLabel(post.category?.key) || '未分类'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                      post.status === PostStatus.PUBLISHED ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200' : 'bg-amber-100 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200'
                    }`}
                  >
                    {statusLabel[post.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(post.updatedAt ?? post.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle(post)}
                      disabled={pendingToggle}
                    >
                      {post.status === PostStatus.PUBLISHED ? '转为草稿' : '发布'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                      disabled={pendingDelete}
                    >
                      删除
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
