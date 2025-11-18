'use client'

import { useEffect, useState, useTransition } from 'react'

import {
  deletePostAction,
  togglePostStatusAction,
  updatePostPublishedAtAction
} from '@/actions/posts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { Link, useRouter } from '@/i18n/navigation'
import { formatCategoryLabel } from '@/lib/categories'
import { useTranslations } from 'next-intl'
import type { PostStatus } from '@/drizzle/schema'

import type { PaginatedPostListItem } from '@/lib/posts/types'

type PostListItem = PaginatedPostListItem
type PostActionType = 'delete' | 'toggle' | 'publishTime'
type PostActionTarget = { type: PostActionType; id: string }

function formatDateTimeForInput(value?: string | Date | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 16)
}

function formatLocaleDate(value?: string | Date | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString()
}

interface PostTableProps {
  posts: PostListItem[]
}

export function PostTable({ posts }: PostTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [actionTarget, setActionTarget] = useState<PostActionTarget | null>(null)
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('admin')
  const statusLabel: Record<PostStatus, string> = {
    DRAFT: t('status.draft'),
    PUBLISHED: t('status.published')
  }

  const handleDelete = (id: string) => {
    if (!confirm(t('posts.deleteConfirmation'))) {
      return
    }
    setActionTarget({ type: 'delete', id })
    startTransition(async () => {
      const result = await deletePostAction(id)
      if (result.status === 'success') {
        toast({ title: t('posts.deleteSuccess') })
        router.refresh()
      } else {
        toast({
          title: t('posts.deleteFailed'),
          description: result.message ?? t('posts.deleteFailedDescription'),
          variant: 'destructive'
        })
      }
      setActionTarget(null)
    })
  }

  const handleToggle = (post: PostListItem) => {
    const nextStatus = post.status === 'PUBLISHED' ? ('DRAFT' as PostStatus) : ('PUBLISHED' as PostStatus)
    setActionTarget({ type: 'toggle', id: post.id })
    startTransition(async () => {
      const result = await togglePostStatusAction(post.id, nextStatus)
      if (result.status === 'success') {
        toast({
          title: t('posts.statusSwitchSuccess', { status: statusLabel[nextStatus] })
        })
        router.refresh()
      } else {
        toast({
          title: t('posts.statusUpdateFailed'),
          description: result.message ?? t('posts.statusUpdateFailedDescription'),
          variant: 'destructive'
        })
      }
      setActionTarget(null)
    })
  }

  const handlePublishTimeUpdate = (post: PostListItem, value: string) => {
    const trimmedValue = value.trim()
    if (trimmedValue) {
      const candidate = new Date(trimmedValue)
      if (Number.isNaN(candidate.getTime())) {
        toast({ title: t('posts.publishTime.invalid'), variant: 'destructive' })
        return
      }
    }

    setActionTarget({ type: 'publishTime', id: post.id })
    startTransition(async () => {
      const result = await updatePostPublishedAtAction(post.id, trimmedValue || null)
      if (result.status === 'success') {
        toast({ title: t('posts.publishTime.updateSuccess') })
        router.refresh()
      } else {
        toast({
          title: t('posts.publishTime.updateFailed'),
          description: result.message,
          variant: 'destructive'
        })
      }
      setActionTarget(null)
    })
  }

  if (posts.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('posts.empty')}</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate text-left text-sm">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <tr>
            <th className="px-4 py-3">{t('posts.table.headers.title')}</th>
            <th className="px-4 py-3">{t('posts.table.headers.category')}</th>
            <th className="px-4 py-3">{t('posts.table.headers.status')}</th>
            <th className="px-4 py-3">{t('posts.table.headers.updated')}</th>
            <th className="px-4 py-3">{t('posts.table.headers.publishedAt')}</th>
            <th className="px-4 py-3 text-right">{t('posts.table.headers.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => {
            const pendingDelete = actionTarget?.type === 'delete' && actionTarget.id === post.id && isPending
            const pendingToggle = actionTarget?.type === 'toggle' && actionTarget.id === post.id && isPending
            const pendingPublishTime =
              actionTarget?.type === 'publishTime' && actionTarget.id === post.id && isPending
            return (
              <tr key={post.id} className="border-t bg-white transition hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <Link href={`/admin/posts/${post.slug}`} className="font-medium text-primary hover:underline">
                      {post.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      <Link href={`/content/${post.id}`} target="_blank" rel="noreferrer">
                        /content/{post.id}
                      </Link>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{formatCategoryLabel(post.category?.key) || t('posts.table.uncategorized')}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                      post.status === 'PUBLISHED'
                        ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200'
                        : 'bg-amber-100 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200'
                    }`}
                  >
                    {statusLabel[post.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {formatLocaleDate(post.updatedAt ?? post.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <PublishTimeField
                    post={post}
                    buttonLabel={t('posts.actions.updatePublishTime')}
                    onSave={handlePublishTimeUpdate}
                    isSaving={pendingPublishTime}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleToggle(post)} disabled={pendingToggle}>
                      {post.status === 'PUBLISHED' ? t('posts.actions.toDraft') : t('posts.actions.publish')}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                      disabled={pendingDelete}
                    >
                      {t('posts.actions.delete')}
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

interface PublishTimeFieldProps {
  post: PostListItem
  buttonLabel: string
  onSave: (post: PostListItem, value: string) => void
  isSaving?: boolean
}

function PublishTimeField({ post, buttonLabel, onSave, isSaving }: PublishTimeFieldProps) {
  const [value, setValue] = useState(() => formatDateTimeForInput(post.publishedAt ?? post.updatedAt ?? post.createdAt))

  useEffect(() => {
    setValue(formatDateTimeForInput(post.publishedAt ?? post.updatedAt ?? post.createdAt))
  }, [post.publishedAt, post.updatedAt, post.createdAt])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input
          type="datetime-local"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="h-8 min-w-[170px] text-xs transition"
        />
        <Button size="sm" variant="outline" onClick={() => onSave(post, value)} disabled={isSaving}>
          {buttonLabel}
        </Button>
      </div>
    </div>
  )
}
