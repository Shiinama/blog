import { getFormatter, getTranslations } from 'next-intl/server'

import { getComments } from '@/lib/data/comments'

export async function CommentList({ postId }: { postId: string }) {
  const [comments, t, format] = await Promise.all([getComments(postId), getTranslations('comments'), getFormatter()])

  if (comments.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('empty')}</p>
  }

  return (
    <ol className="space-y-3">
      {comments.map((comment) => {
        const name = comment.authorName?.trim() || t('anonymous')
        return (
          <li key={comment.id} className="bg-card/70 ring-border/20 rounded-2xl px-4 py-3 ring-1">
            <div className="flex items-center gap-3">
              <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-full text-sm font-semibold uppercase">
                {name.slice(0, 1)}
              </span>
              <div>
                <p className="text-sm font-semibold">{name}</p>
                <time dateTime={comment.createdAt.toISOString()} className="text-muted-foreground text-xs">
                  {format.dateTime(comment.createdAt, 'long')}
                </time>
              </div>
            </div>
            <p className="text-foreground/90 mt-2 text-sm leading-relaxed whitespace-pre-line">{comment.content}</p>
          </li>
        )
      })}
    </ol>
  )
}
