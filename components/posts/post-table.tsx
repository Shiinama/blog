'use client'

import { useTranslations } from 'next-intl'
import { useRef, useState, useTransition } from 'react'

import {
  deletePostAction,
  togglePostStatusAction,
  updatePostPublishedAtAction,
  updatePostSubscriptionAction
} from '@/actions/posts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import useRouter from '@/hooks/use-router'
import { Link } from '@/i18n/navigation'

import type { PostStatus } from '@/drizzle/schema'
import type { PaginatedPostListItem } from '@/lib/posts/types'

type PostListItem = PaginatedPostListItem
type PostActionType = 'delete' | 'toggle' | 'publishTime' | 'access'
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
      try {
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
      } catch (error) {
        toast({
          title: t('posts.deleteFailed'),
          description: error instanceof Error ? error.message : t('posts.deleteFailedDescription'),
          variant: 'destructive'
        })
      } finally {
        setActionTarget(null)
      }
    })
  }

  const handleToggle = (post: PostListItem) => {
    const nextStatus = post.status === 'PUBLISHED' ? ('DRAFT' as PostStatus) : ('PUBLISHED' as PostStatus)
    setActionTarget({ type: 'toggle', id: post.id })
    startTransition(async () => {
      try {
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
      } catch (error) {
        toast({
          title: t('posts.statusUpdateFailed'),
          description: error instanceof Error ? error.message : t('posts.statusUpdateFailedDescription'),
          variant: 'destructive'
        })
      } finally {
        setActionTarget(null)
      }
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
      try {
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
      } catch (error) {
        toast({
          title: t('posts.publishTime.updateFailed'),
          description: error instanceof Error ? error.message : t('posts.publishTime.updateFailed'),
          variant: 'destructive'
        })
      } finally {
        setActionTarget(null)
      }
    })
  }

  const handleAccessToggle = (post: PostListItem, isSubscriptionOnly: boolean) => {
    setActionTarget({ type: 'access', id: post.id })
    startTransition(async () => {
      try {
        const result = await updatePostSubscriptionAction(post.id, isSubscriptionOnly)
        if (result.status === 'success') {
          const label = isSubscriptionOnly ? t('posts.access.subscriptionOnly') : t('posts.access.public')
          toast({ title: t('posts.access.updateSuccess', { label }) })
          router.refresh()
        } else {
          toast({
            title: t('posts.access.updateFailed'),
            description: result.message ?? t('posts.access.updateFailedDescription'),
            variant: 'destructive'
          })
        }
      } catch (error) {
        toast({
          title: t('posts.access.updateFailed'),
          description: error instanceof Error ? error.message : t('posts.access.updateFailedDescription'),
          variant: 'destructive'
        })
      } finally {
        setActionTarget(null)
      }
    })
  }

  if (posts.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('posts.empty')}</p>
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm shadow-slate-900/10">
      <Table className="bg-white/90">
        <TableHeader className="bg-slate-50/70 text-[12px] tracking-[0.18em] text-slate-500 uppercase">
          <TableRow className="[&_th]:px-4 [&_th]:py-3">
            <TableHead>{t('posts.table.headers.title')}</TableHead>
            <TableHead className="w-[180px]">{t('posts.table.headers.access')}</TableHead>
            <TableHead className="w-[200px]">{t('posts.table.headers.publishedAt')}</TableHead>
            <TableHead className="w-[150px]">{t('posts.table.headers.status')}</TableHead>
            <TableHead className="text-right">{t('posts.table.headers.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => {
            const pendingDelete = actionTarget?.type === 'delete' && actionTarget.id === post.id && isPending
            const pendingToggle = actionTarget?.type === 'toggle' && actionTarget.id === post.id && isPending
            const pendingPublishTime = actionTarget?.type === 'publishTime' && actionTarget.id === post.id && isPending
            const pendingAccess = actionTarget?.type === 'access' && actionTarget.id === post.id && isPending
            return (
              <TableRow key={post.id} className="bg-white/70 transition hover:bg-slate-50/80">
                <TableCell className="align-top">
                  <div className="flex flex-col gap-1">
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="text-foreground hover:text-primary text-base font-semibold"
                    >
                      {post.title}
                    </Link>
                    <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-slate-500">
                        {t('posts.table.headers.updated')}: {formatLocaleDate(post.updatedAt ?? post.createdAt)}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="align-top">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={post.isSubscriptionOnly ? 'secondary' : 'outline'}
                      className={
                        post.isSubscriptionOnly
                          ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100'
                      }
                    >
                      {post.isSubscriptionOnly ? t('posts.access.subscriptionOnly') : t('posts.access.public')}
                    </Badge>
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                      <Switch
                        checked={post.isSubscriptionOnly}
                        onCheckedChange={(checked) => handleAccessToggle(post, checked)}
                        disabled={pendingAccess}
                      />
                      <span>{t('posts.access.switchLabel')}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="align-top">
                  <PublishTimeField
                    post={post}
                    buttonLabel={t('posts.actions.updatePublishTime')}
                    onSave={handlePublishTimeUpdate}
                    isSaving={pendingPublishTime}
                  />
                </TableCell>
                <TableCell className="align-top">
                  <div className="flex flex-col gap-2">
                    <span
                      className={`inline-flex w-fit rounded-full px-2 py-1 text-xs font-semibold ${
                        post.status === 'PUBLISHED'
                          ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200'
                          : 'bg-amber-100 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200'
                      }`}
                    >
                      {statusLabel[post.status]}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle(post)}
                      disabled={pendingToggle}
                      className="w-fit"
                    >
                      {post.status === 'PUBLISHED' ? t('posts.actions.toDraft') : t('posts.actions.publish')}
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="align-top">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/content/${post.id}`} target="_blank" rel="noopener noreferrer">
                        {t('posts.actions.preview')}
                      </Link>
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
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
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
  const inputRef = useRef<HTMLInputElement>(null)
  const initialValue = formatDateTimeForInput(post.publishedAt ?? post.updatedAt ?? post.createdAt)

  const handleSave = () => {
    const nextValue = inputRef.current?.value ?? initialValue
    onSave(post, nextValue)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          key={post.id}
          type="datetime-local"
          defaultValue={initialValue}
          className="h-8 min-w-[170px] text-xs transition"
        />
        <Button size="sm" variant="outline" onClick={handleSave} disabled={isSaving}>
          {buttonLabel}
        </Button>
      </div>
    </div>
  )
}
