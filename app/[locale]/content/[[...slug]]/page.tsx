import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { MarkdownRenderer } from '@/components/markdown/markdown-renderer'
import { DashboardTableOfContents } from '@/components/mdx/toc'
import { siteConfig } from '@/config/site.config'
import { formatCategoryLabel } from '@/lib/categories'
import { buildToc } from '@/lib/markdown/toc'
import { getPostBySlug } from '@/lib/posts'
import { absoluteUrl } from '@/lib/utils'

import type { Metadata } from 'next'

type DocPageProps = {
  slug: string[]
}

async function getPostFromParams({ params }: { params: Promise<DocPageProps> }) {
  const parameters = await params
  console.log(parameters)
  const slugPath = parameters.slug?.join('/') ?? ''

  console.log(slugPath)

  return getPostBySlug(slugPath)
}

export async function generateMetadata({ params }: { params: Promise<DocPageProps> }): Promise<Metadata> {
  const post = await getPostFromParams({ params })

  if (!post) {
    return {}
  }

  const summary = post.summary
  const slugUrl = `/content/${post.slug}`

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
  const [post, t] = await Promise.all([getPostFromParams({ params }), getTranslations('article')])

  if (!post) {
    notFound()
  }

  const readingTime = Math.max(1, post.readingTime || 0)
  const fallbackCategoryLabel = formatCategoryLabel(post.category.key) || 'Uncategorized'
  let categoryLabel = fallbackCategoryLabel
  if (post.category.key) {
    try {
      categoryLabel = t(post.category.key as any)
    } catch {
      categoryLabel = fallbackCategoryLabel
    }
  }

  const toc = await buildToc(post.content)
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
      label: 'Published',
      value: formattedPublishedDate ?? '—'
    },
    {
      label: 'Reading Time',
      value: `${readingTime} min read`
    },
    {
      label: 'Author',
      value: authorName
    }
  ]

  return (
    <div className="bg-background">
      <div className="mx-auto min-h-screen w-full max-w-5xl px-4 pt-8 pb-14 sm:px-6 lg:px-8">
        <header className="border-border/60 space-y-5 border-b pb-8">
          <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-[11px] font-semibold tracking-[0.35em] uppercase">
            <span>{categoryLabel}</span>
            {formattedPublishedDate && <time dateTime={publishedDateISO}>Updated {formattedPublishedDate}</time>}
          </div>
          <div className="space-y-4">
            <h1 className="text-foreground text-3xl leading-tight font-semibold sm:text-4xl">{post.title}</h1>
            {post.summary && <p className="text-muted-foreground text-base sm:text-lg">{post.summary}</p>}
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
            <div className="relative h-56 w-full overflow-hidden rounded-2xl sm:h-72">
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
              Cover image
            </figcaption>
          </figure>
        )}

        <article className="text-foreground mx-auto max-w-3xl space-y-6 text-[0.95rem] leading-relaxed sm:text-base">
          <MarkdownRenderer content={post.content} />
        </article>

        <section className="border-border/60 mx-auto max-w-3xl border-t pt-8">
          <p className="text-muted-foreground text-xs font-semibold tracking-[0.35em] uppercase">On this page</p>
          {toc.length > 0 ? (
            <div className="text-muted-foreground mt-4 space-y-3 text-sm">
              <DashboardTableOfContents toc={toc} />
            </div>
          ) : (
            <p className="text-muted-foreground mt-4 text-sm">No headings yet for this article.</p>
          )}
        </section>
      </div>
    </div>
  )
}
