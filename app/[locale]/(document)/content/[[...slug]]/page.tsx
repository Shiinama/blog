import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { ContentSidebar } from '@/components/content-sidebar'
import { MarkdownRenderer } from '@/components/markdown/markdown-renderer'
import { DashboardTableOfContents } from '@/components/mdx/toc'
import { siteConfig } from '@/config/site.config'
import { formatCategoryLabel } from '@/lib/categories'
import { buildToc } from '@/lib/markdown/toc'
import { getPostBySlug, getSidebarPosts } from '@/lib/posts'
import { absoluteUrl } from '@/lib/utils'

import type { Metadata } from 'next'

type DocPageProps = {
  slug: string[]
}

async function getPostFromParams({ params }: { params: Promise<DocPageProps> }) {
  const parameters = await params
  const slugPath = parameters.slug?.join('/') ?? ''

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

  const [sidebarItems, toc] = await Promise.all([getSidebarPosts(post.categoryId), buildToc(post.content)])

  return (
    <div className="flex w-full">
      <ContentSidebar
        categoryKey={post.category.key}
        items={sidebarItems.map((item) => ({
          id: item.id,
          title: item.title,
          href: `/content/${item.slug}`
        }))}
      />
      <div className="relative overflow-hidden pt-4 md:overflow-visible md:px-10 md:py-4">
        <article className="relative flex flex-1 px-4">
          <div className="mx-auto w-full min-w-0">
            <header className="mb-8 space-y-3 border-b pb-6">
              <p className="text-muted-foreground text-sm tracking-wide uppercase">{categoryLabel}</p>
              <h1 className="font-heading text-3xl font-bold md:text-4xl">{post.title}</h1>
              <div className="text-muted-foreground flex flex-col gap-2 text-sm md:flex-row md:items-center md:gap-4">
                {post.publishedAt && <span>{new Date(post.publishedAt).toLocaleDateString()}</span>}
                <span>{readingTime} min read</span>
              </div>
              {post.summary && <p className="text-muted-foreground">{post.summary}</p>}
            </header>
            {post.coverImageUrl && (
              <div className="relative mb-10 aspect-video overflow-hidden rounded-lg border">
                <Image src={post.coverImageUrl} alt={post.title} fill sizes="100vw" className="object-cover" />
              </div>
            )}
            <MarkdownRenderer content={post.content} />
          </div>
          <div className="ml-10 hidden text-sm xl:block">
            <div className="sticky top-4 -mt-10 h-[calc(100vh-3.5rem)] overflow-scroll px-4 pt-4">
              {toc.length > 0 && <DashboardTableOfContents toc={toc} />}
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
