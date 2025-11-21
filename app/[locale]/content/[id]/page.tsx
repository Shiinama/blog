import { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { LockedPaywall } from '@/components/content/locked-paywall'
import { LockedPreview } from '@/components/content/locked-preview'
import { MarkdownRenderer } from '@/components/markdown/markdown-renderer'
import { siteConfig } from '@/config/site.config'
import { auth } from '@/lib/auth'
import { formatCategoryLabel } from '@/lib/categories'
import { getPostById } from '@/lib/posts'
import { hasActiveSubscription } from '@/lib/subscriptions'
import { absoluteUrl } from '@/lib/utils'

type DocPageProps = {
  id: string
}

async function getPostFromParams({ params }: { params: Promise<DocPageProps> }) {
  const parameters = await params

  if (!parameters.id) {
    return null
  }

  return getPostById(parameters.id)
}

export async function generateMetadata({ params }: { params: Promise<DocPageProps> }): Promise<Metadata> {
  const post = await getPostFromParams({ params })

  if (!post) {
    return {}
  }

  const summary = post.summary
  const slugUrl = `/content/${post.id}`

  return {
    title: `${post.title} - ${siteConfig.name}`,
    description: summary,
    openGraph: {
      title: post.title,
      description: summary,
      type: 'article',
      url: absoluteUrl(slugUrl),
      images: [
        {
          url: post.coverImageUrl ?? siteConfig.og,
          width: 2880,
          height: 1800,
          alt: siteConfig.name
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: summary,
      images: [post.coverImageUrl ?? siteConfig.og],
      creator: '@rds_agi'
    }
  }
}

export default async function DocPage({ params }: { params: Promise<DocPageProps> }) {
  const [post, articleT, contentT] = await Promise.all([
    getPostFromParams({ params }),
    getTranslations('article'),
    getTranslations('content')
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
  const authorName = post.author?.name ?? siteConfig.name
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
      <div className="mx-auto min-h-screen w-full max-w-5xl px-4 pt-8 pb-14 sm:px-6 lg:px-8">
        <header className="space-y-6 pb-10">
          <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-[11px] font-semibold tracking-[0.35em] uppercase">
            <span>{categoryLabel}</span>
            {formattedPublishedDate && (
              <time dateTime={publishedDateISO}>{contentT('updated', { date: formattedPublishedDate })}</time>
            )}
          </div>
          <div className="space-y-3">
            <h1 className="text-foreground text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
              {post.title}
            </h1>
            {post.isSubscriptionOnly && (
              <p className="text-muted-foreground text-sm">
                {contentT('metadata.subscriptionOnly')} · {contentT('locked.previewDescription')}
              </p>
            )}
          </div>
          <dl className="text-muted-foreground flex flex-wrap gap-8 text-sm">
            {metadataHighlights.map((item) => (
              <div key={item.label}>
                <dt className="text-[11px] font-semibold tracking-[0.4em] uppercase">{item.label}</dt>
                <dd className="text-foreground mt-1 text-lg font-semibold">{item.value}</dd>
              </div>
            ))}
          </dl>
        </header>

        {post.coverImageUrl && (
          <figure className="my-8">
            <div className="relative h-56 w-full overflow-hidden rounded-[32px] sm:h-80">
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

        {canViewFullContent ? (
          <article className="prose prose-lg dark:prose-invert max-w-none">
            <MarkdownRenderer content={post.content} />
          </article>
        ) : (
          <div className="relative pb-2">
            <LockedPreview
              content={previewContent}
              label={contentT('locked.previewTitle')}
              description={contentT('locked.previewDescription')}
            />
            <LockedPaywall
              title={contentT('locked.title')}
              description={contentT('locked.description')}
              bullets={['fullAccess', 'updates', 'support'].map((key) => contentT(`locked.${key}`))}
              authorLine={`${authorName} · ${contentT('metadata.subscriptionOnly')}`}
              badgeLabel={contentT('metadata.subscriptionOnly')}
            />
          </div>
        )}
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
