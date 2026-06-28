import { ArrowLeft } from 'lucide-react'
import { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { CommentSection } from '@/components/comments/comment-section'
import { LockedPaywall } from '@/components/content/locked-paywall'
import { LockedPreview } from '@/components/content/locked-preview'
import { MarkdownRenderer } from '@/components/markdown/markdown-renderer'
import { Link } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { auth } from '@/lib/auth'
import { getCommentsForPost } from '@/lib/comments'
import { buildSafePreviewContent } from '@/lib/markdown/preview'
import { buildLanguageAlternates } from '@/lib/metadata'
import { getPostById } from '@/lib/posts'
import { hasActiveSubscription } from '@/lib/subscriptions'
import { absoluteUrl } from '@/lib/utils'

type DocPageProps = {
  id: string
  locale: string
}

export async function generateMetadata({ params }: { params: Promise<DocPageProps> }): Promise<Metadata> {
  const parameters = await params
  const post = await getPostById(parameters.id, { locale: parameters.locale })

  if (!post) {
    return {}
  }

  const seoT = await getTranslations({ locale: parameters.locale, namespace: 'seo' })

  const summary = post.summary
  const slugUrl = `/content/${post.id}`
  const siteTitle = seoT('siteTitle')
  const canonical =
    parameters.locale === routing.defaultLocale ? `/content/${post.id}` : `/${parameters.locale}/content/${post.id}`

  return {
    title: `${post.title} | ${siteTitle}`,
    description: summary,
    alternates: {
      canonical,
      languages: buildLanguageAlternates(`/content/${post.id}`, post.availableLocales)
    },
    openGraph: {
      title: post.title,
      description: summary,
      type: 'article',
      url: absoluteUrl(slugUrl),
      locale: parameters.locale,
      siteName: siteTitle
    }
  }
}

export default async function DocPage({ params }: { params: Promise<DocPageProps> }) {
  const parameters = await params
  const [post, contentT, initialComments] = await Promise.all([
    getPostById(parameters.id, { locale: parameters.locale }),
    getTranslations('content'),
    getCommentsForPost(parameters.id)
  ])
  const session = await auth()

  if (!post) {
    notFound()
  }

  const viewerId = session?.user?.id

  const isSubscriber = viewerId ? await hasActiveSubscription(viewerId) : false
  const canViewFullContent = !post.isSubscriptionOnly || isSubscriber

  const previewContent = canViewFullContent ? post.content : buildSafePreviewContent(post.content)
  const authorName = post.author?.name

  return (
    <div className="bg-background px-4 sm:px-6 lg:px-8">
      <div className="mx-auto min-h-screen w-full max-w-5xl px-4 m:px-6 lg:px-8 pt-6 lg:pt-12 pb-14">
        <div className="flex items-center gap-3 pb-6">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium transition"
          >
            <ArrowLeft className="h-4 w-4" />
            {contentT('backToList')}
          </Link>
        </div>

        <h1 className="text-foreground text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
          {post.title}
        </h1>

        {post.coverImageUrl && (
          <figure className="mt-8">
            <div className="relative h-56 w-full overflow-hidden rounded-2xl sm:h-80">
              <Image
                src={post.coverImageUrl}
                alt={post.title}
                fill
                sizes="(max-width: 640px) 100vw, 768px"
                className="object-cover"
                priority
              />
            </div>
          </figure>
        )}

        <div className="mt-8 space-y-10">
          {canViewFullContent ? (
            <article className="max-w-none">
              <MarkdownRenderer content={post.content} />
            </article>
          ) : (
            <div className="relative">
              <LockedPreview
                content={previewContent}
                label={contentT('locked.previewTitle')}
                description={contentT('locked.previewDescription')}
              />
              <div className="pt-6">
                <LockedPaywall
                  title={contentT('locked.title')}
                  description={contentT('locked.description')}
                  authorLine={`${authorName} · ${contentT('metadata.subscriptionOnly')}`}
                  badgeLabel={contentT('metadata.subscriptionOnly')}
                />
              </div>
            </div>
          )}

          <CommentSection postId={post.id} viewerId={viewerId} initialComments={initialComments} />
        </div>
      </div>
    </div>
  )
}
