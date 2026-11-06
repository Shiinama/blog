'use client'

import { Loader2, Send } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useActionState } from 'react'

import { createComment } from '@/actions/comments'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export function CommentForm({ postId }: { postId: string }) {
  const t = useTranslations('comments')
  const tErrors = useTranslations('actions.errors')
  // React resets the form after every action; a failed one hands back what was typed.
  const [state, formAction, isPending] = useActionState(createComment, null)

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="postId" value={postId} />
      <Textarea
        name="content"
        defaultValue={state?.ok === false ? state.values?.content : undefined}
        required
        minLength={3}
        maxLength={1200}
        placeholder={t('placeholder')}
        disabled={isPending}
        className="border-border/60 bg-muted/30 min-h-28 rounded-2xl"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-destructive text-xs" aria-live="polite">
          {state?.ok === false && tErrors(state.error)}
        </p>
        <Button type="submit" variant="secondary" size="sm" className="rounded-full px-4" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <Send />}
          {t('submit')}
        </Button>
      </div>
    </form>
  )
}
