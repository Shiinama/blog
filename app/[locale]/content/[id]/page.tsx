import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { MarkdownRenderer } from '@/components/markdown/markdown-renderer'
import { siteConfig } from '@/config/site.config'
import { formatCategoryLabel } from '@/lib/categories'
import { getPostById } from '@/lib/posts'


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

// export async function generateMetadata({ params }: { params: Promise<DocPageProps> }): Promise<Metadata> {
//   const post = await getPostFromParams({ params })

//   if (!post) {
//     return {}
//   }

//   const summary = post.summary
//   const slugUrl = `/content/${post.id}`

//   return {
//     title: `${post.title} - ${siteConfig.name}`,
//     description: summary,
//     openGraph: {
//       title: post.title,
//       description: summary,
//       type: 'article',
//       url: absoluteUrl(slugUrl),
//       images: [
//         {
//           url: post.coverImageUrl ?? siteConfig.og,
//           width: 2880,
//           height: 1800,
//           alt: siteConfig.name
//         }
//       ]
//     },
//     twitter: {
//       card: 'summary_large_image',
//       title: post.title,
//       description: summary,
//       images: [post.coverImageUrl ?? siteConfig.og],
//       creator: '@rds_agi'
//     }
//   }
// }

export default async function DocPage({ params }: { params: Promise<DocPageProps> }) {
  const [post, articleT, contentT] = await Promise.all([
    getPostFromParams({ params }),
    getTranslations('article'),
    getTranslations('content')
  ])

  if (!post) {
    notFound()
  }

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
    }
  ]

  return (
    <div className="bg-background">
      <div className="mx-auto min-h-screen w-full max-w-5xl px-4 pt-8 pb-14 sm:px-6 lg:px-8">
        <header className="border-border/60 space-y-5 border-b pb-8">
            <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-[11px] font-semibold tracking-[0.35em] uppercase">
              <span>{categoryLabel}</span>
              {formattedPublishedDate && (
                <time dateTime={publishedDateISO}>{contentT('updated', { date: formattedPublishedDate })}</time>
              )}
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
              {contentT('coverImage')}
            </figcaption>
          </figure>
        )}

        <article className="text-foreground mx-auto max-w-3xl space-y-6 text-[0.95rem] leading-relaxed sm:text-base">
          <MarkdownRenderer content={post.content} />
        </article>

       
      </div>
    </div>
  )
}
