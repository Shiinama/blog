import { getTranslations } from 'next-intl/server'

import { SignInLink } from '@/components/auth/sign-in-link'
import { MarkdownRenderer } from '@/components/markdown/markdown-renderer'
import { getViewerMembership } from '@/lib/data/memberships'
import { buildSafePreviewContent } from '@/lib/markdown/preview'
import { getViewer } from '@/lib/session'

/** Full article for active members; preview + call to action for everyone else. */
export async function MembersOnlyContent({ content }: { content: string }) {
  const [viewer, membership] = await Promise.all([getViewer(), getViewerMembership()])
  if (membership.status === 'active') return <MarkdownRenderer content={content} />

  const t = await getTranslations('post.locked')
  return (
    <>
      <LockedPreview content={buildSafePreviewContent(content)} />
      <div className="mx-auto mt-8 flex max-w-xl flex-col items-center gap-4 text-center">
        <h2 className="font-serif text-2xl sm:text-3xl">{t('title')}</h2>
        <p className="text-muted-foreground">{viewer ? t('memberDescription') : t('description')}</p>
        {!viewer && <SignInLink label={t('signIn')} variant="default" />}
      </div>
    </>
  )
}

export async function LockedPreview({ content }: { content: string }) {
  const t = await getTranslations('post.locked')
  return (
    <div className="relative">
      <p className="text-primary mb-4 text-xs font-semibold tracking-[0.28em] uppercase">{t('preview')}</p>
      <div className="mask-b-from-40% mask-b-to-100%">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  )
}
