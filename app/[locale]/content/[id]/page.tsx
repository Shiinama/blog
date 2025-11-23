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
import { formatCategoryLabel } from '@/lib/categories'
import { getCommentsForPost } from '@/lib/comments'
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
      languages: buildLanguageAlternates(`/content/${post.id}`)
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
  const [post, articleT, contentT, initialComments] = await Promise.all([
    getPostById(parameters.id, { locale: parameters.locale }),
    getTranslations('article'),
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

  const previewContent = canViewFullContent ? post.content : buildPreviewContent(post.content)

  const readingTime = Math.max(1, post.readingTime || 0)
  const fallbackCategoryLabel = formatCategoryLabel(post.category?.key) || 'Uncategorized'
  let categoryLabel = fallbackCategoryLabel
  if (post.category?.key) {
    try {
      categoryLabel = articleT(post.category.key)
    } catch {
      categoryLabel = fallbackCategoryLabel
    }
  }

  const publishedDate = post.publishedAt ? new Date(post.publishedAt) : null
  const formattedPublishedDate = publishedDate
    ? publishedDate.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : null
  const publishedDateISO = publishedDate?.toISOString()
  const authorName = post.author?.name
  const metadataHighlights = [
    {
      label: contentT('metadata.published'),
      value: formattedPublishedDate ?? '—'
    },
    {
      label: contentT('metadata.readingTime'),
      value: `${readingTime} min read`
    },
    {
      label: contentT('metadata.author'),
      value: authorName
    },
    {
      label: contentT('metadata.access'),
      value: post.isSubscriptionOnly ? contentT('metadata.subscriptionOnly') : contentT('metadata.free')
    }
  ]

  return (
    <div className="bg-background">
      <div className="mx-auto min-h-screen w-full max-w-4xl px-4 pt-6 pb-14 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 pb-4">
          <Link
            href="/"
            className="text-muted-foreground inline-flex items-center gap-2 text-sm font-medium transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {contentT('backToList')}
          </Link>
        </div>

        <header className="rounded-3xl bg-card/85 px-5 py-6 shadow-[0_18px_60px_rgba(0,0,0,0.09)] ring-1 ring-border/30 backdrop-blur-sm sm:px-7 dark:ring-white/10">
          <div className="flex flex-wrap items-center gap-3 text-[12px] uppercase tracking-[0.22em] text-muted-foreground">
            <span className="text-primary/90 rounded-full bg-primary/10 px-3 py-1 font-semibold">{categoryLabel}</span>
            {formattedPublishedDate && (
              <time dateTime={publishedDateISO}>{contentT('updated', { date: formattedPublishedDate })}</time>
            )}
          </div>
          <div className="space-y-3 pt-4">
            <h1 className="text-foreground text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
              {post.title}
            </h1>
            {post.isSubscriptionOnly && (
              <p className="text-muted-foreground text-sm sm:text-base">
                {contentT('metadata.subscriptionOnly')} · {contentT('locked.previewDescription')}
              </p>
            )}
          </div>
          <dl className="text-muted-foreground mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            {metadataHighlights.map((item) => (
              <div key={item.label} className="space-y-1">
                <dt className="text-[11px] font-semibold tracking-[0.25em] uppercase">{item.label}</dt>
                <dd className="text-foreground text-base font-semibold">{item.value}</dd>
              </div>
            ))}
          </dl>
        </header>

        {post.coverImageUrl && (
          <figure className="my-8">
            <div className="relative h-56 w-full overflow-hidden rounded-3xl shadow-[0_22px_70px_rgba(0,0,0,0.14)] sm:h-80">
              <Image
                src={post.coverImageUrl}
                alt={post.title}
                fill
                sizes="(max-width: 640px) 100vw, 768px"
                className="object-cover"
                priority
              />
            </div>
            <figcaption className="text-muted-foreground mt-3 text-xs tracking-[0.3em] uppercase">
              {contentT('coverImage')}
            </figcaption>
          </figure>
        )}

        <div className="space-y-6">
          {canViewFullContent ? (
            <article className="prose prose-base dark:prose-invert max-w-none rounded-3xl bg-card/80 px-5 py-6 shadow-[0_16px_50px_rgba(0,0,0,0.08)] ring-1 ring-border/30 backdrop-blur-sm sm:px-7 sm:prose-lg dark:ring-white/10">
              <MarkdownRenderer content={post.content} />
            </article>
          ) : (
            <div className="relative rounded-3xl bg-card/80 px-5 py-6 shadow-[0_16px_50px_rgba(0,0,0,0.08)] ring-1 ring-border/30 backdrop-blur-sm sm:px-7 dark:ring-white/10">
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

function buildPreviewContent(content: string, ratio = 0.3) {
  const trimmed = content.trim()
  const words = trimmed.split(/\s+/)
  const visibleCount = Math.max(1, Math.floor(words.length * ratio))

  const tokens = trimmed.match(/\S+|\s+/g) ?? []
  const previewTokens: string[] = []
  let seenWords = 0

  for (const token of tokens) {
    if (token.trim().length > 0) {
      seenWords += 1
    }
    previewTokens.push(token)
    if (seenWords >= visibleCount) {
      break
    }
  }

  let preview = previewTokens.join('')
  const fenceCount = (preview.match(/```/g) || []).length

  if (fenceCount % 2 !== 0) {
    preview += '\n```'
  }

  return preview
}
