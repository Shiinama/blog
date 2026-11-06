import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getFormatter, getLocale, getTranslations } from 'next-intl/server'
import { Suspense } from 'react'

import { CommentComposer } from '@/components/comments/comment-composer'
import { CommentList } from '@/components/comments/comment-list'
import { MarkdownRenderer } from '@/components/markdown/markdown-renderer'
import { MembersOnlyContent, LockedPreview } from '@/components/posts/members-only'
import { Link } from '@/i18n/navigation'
import { getPublishedPost } from '@/lib/data/posts'
import { buildSafePreviewContent } from '@/lib/markdown/preview'
import { alternates, postPath, postUrl, SITE_AUTHOR } from '@/lib/metadata'

import type { Metadata } from 'next'

export async function generateMetadata({ params }: PageProps<'/[locale]/content/[id]'>): Promise<Metadata> {
  const [{ id }, locale] = await Promise.all([params, getLocale()])
  const post = await getPublishedPost(id, locale)
  if (!post) return {}

  return {
    title: post.title,
    description: post.summary,
    keywords: post.tags,
    alternates: alternates(postPath(post.id), locale, post.locales),
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.summary,
      url: postUrl(post.id, locale),
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      tags: post.tags,
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined
    }
  }
}

export default async function PostPage({ params }: PageProps<'/[locale]/content/[id]'>) {
  const [{ id }, locale] = await Promise.all([params, getLocale()])
  const post = await getPublishedPost(id, locale)
  if (!post) notFound()

  const [t, format] = await Promise.all([getTranslations('post'), getFormatter()])
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.summary,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    inLanguage: locale,
    image: post.coverImageUrl ?? undefined,
    author: { '@type': 'Person', name: SITE_AUTHOR },
    mainEntityOfPage: postUrl(post.id, locale)
  }

  return (
    <article className="mx-auto w-full max-w-3xl px-4 pt-6 pb-16 sm:px-6 lg:pt-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium transition"
      >
        <ArrowLeft className="size-4" />
        {t('back')}
      </Link>

      <header className="mt-6 space-y-3">
        <h1 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">{post.title}</h1>
        {post.publishedAt && (
          <p className="text-muted-foreground text-sm">
            <time dateTime={post.publishedAt.toISOString()}>{format.dateTime(post.publishedAt, 'short')}</time>
            {post.isMembersOnly && <span> · {t('membersOnly')}</span>}
          </p>
        )}
      </header>

      {post.coverImageUrl && (
        <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-2xl">
          <Image
            src={post.coverImageUrl}
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>
      )}

      <div className="mt-10">
        {post.isMembersOnly ? (
          // Only the preview is in the initial HTML; the full text streams in for members.
          <Suspense fallback={<LockedPreview content={buildSafePreviewContent(post.content)} />}>
            <MembersOnlyContent content={post.content} />
          </Suspense>
        ) : (
          <MarkdownRenderer content={post.content} />
        )}
      </div>

      <section className="bg-card/80 ring-border/30 mt-14 space-y-5 rounded-3xl px-4 py-5 ring-1 sm:px-6">
        <h2 className="text-lg font-semibold">{t('comments')}</h2>
        <Suspense fallback={<div className="bg-muted/40 h-32 animate-pulse rounded-2xl" />}>
          <CommentComposer postId={post.id} />
        </Suspense>
        <CommentList postId={post.id} />
      </section>
    </article>
  )
}
