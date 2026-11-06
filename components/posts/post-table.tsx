'use client'

import { ExternalLink } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { toast } from 'sonner'

import { updatePostFlags } from '@/actions/posts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Link } from '@/i18n/navigation'
import { postPath } from '@/lib/metadata'

import type { AdminPostRow } from '@/lib/data/posts'

export function PostTable({
  posts,
  categoryLabels
}: {
  posts: AdminPostRow[]
  categoryLabels: Record<string, string>
}) {
  const t = useTranslations('admin.posts')
  const format = useFormatter()

  if (posts.length === 0) {
    return <p className="text-muted-foreground p-6 text-center text-sm">{t('empty')}</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('columns.title')}</TableHead>
          <TableHead>{t('columns.status')}</TableHead>
          <TableHead>{t('columns.membersOnly')}</TableHead>
          <TableHead>{t('columns.signal')}</TableHead>
          <TableHead>{t('columns.publishedAt')}</TableHead>
          <TableHead className="text-right" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {posts.map((post) => (
          <TableRow key={post.id}>
            <TableCell className="max-w-md">
              <Link href={`/admin/posts/${post.id}`} className="line-clamp-2 font-medium hover:underline">
                {post.title}
              </Link>
              <span className="text-muted-foreground text-xs">
                {categoryLabels[post.categoryKey] ?? post.categoryKey} · {post.locale}
              </span>
            </TableCell>
            <TableCell>
              <FlagToggle
                id={post.id}
                checked={post.status === 'PUBLISHED'}
                flags={(checked) => ({ status: checked ? 'PUBLISHED' : 'DRAFT' })}
                label={
                  <Badge variant={post.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                    {t(`status.${post.status}`)}
                  </Badge>
                }
              />
            </TableCell>
            <TableCell>
              <FlagToggle id={post.id} checked={post.isMembersOnly} flags={(checked) => ({ isMembersOnly: checked })} />
            </TableCell>
            <TableCell>
              <FlagToggle
                id={post.id}
                checked={Boolean(post.signalClaimedAt)}
                flags={(checked) => ({ signalClaimed: checked })}
                label={
                  post.signalClaimedAt && (
                    <span className="text-muted-foreground text-xs">
                      {format.dateTime(post.signalClaimedAt, 'short')}
                    </span>
                  )
                }
              />
            </TableCell>
            <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
              {post.publishedAt ? format.dateTime(post.publishedAt, 'short') : '—'}
            </TableCell>
            <TableCell className="text-right">
              {post.status === 'PUBLISHED' && (
                <Button asChild variant="ghost" size="icon" aria-label={t('view')}>
                  <Link href={postPath(post.id)} locale={post.locale as 'en' | 'zh'} target="_blank">
                    <ExternalLink />
                  </Link>
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function FlagToggle({
  id,
  checked,
  flags,
  label
}: {
  id: string
  checked: boolean
  flags: (checked: boolean) => Parameters<typeof updatePostFlags>[1]
  label?: React.ReactNode
}) {
  const tErrors = useTranslations('actions.errors')
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={checked}
        disabled={isPending}
        onCheckedChange={(next) =>
          startTransition(async () => {
            const result = await updatePostFlags(id, flags(next))
            if (result && !result.ok) toast.error(tErrors(result.error))
          })
        }
      />
      {label}
    </div>
  )
}
