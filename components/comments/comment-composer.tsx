import { getTranslations } from 'next-intl/server'

import { SignInLink } from '@/components/auth/sign-in-link'
import { getViewer } from '@/lib/session'

import { CommentForm } from './comment-form'

export async function CommentComposer({ postId }: { postId: string }) {
  const [viewer, t] = await Promise.all([getViewer(), getTranslations('comments')])

  if (!viewer) {
    return (
      <div className="border-border/60 flex items-center justify-between gap-3 rounded-2xl border border-dashed px-4 py-3">
        <p className="text-muted-foreground text-sm">{t('signInPrompt')}</p>
        <SignInLink label={t('signIn')} />
      </div>
    )
  }
  return <CommentForm postId={postId} />
}
