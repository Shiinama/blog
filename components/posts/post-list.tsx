import Image from 'next/image'
import { getFormatter, getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import { postPath } from '@/lib/metadata'

import { PaginationLinks } from './pagination-links'

import type { PostCard } from '@/lib/data/posts'

type Props = {
  posts: PostCard[]
  total: number
  page: number
  pageCount: number
  categoryLabels: Record<string, string>
}

export async function PostList({ posts, total, page, pageCount, categoryLabels }: Props) {
  const [t, format] = await Promise.all([getTranslations('explorer'), getFormatter()])

  if (posts.length === 0) {
    return (
      <div className="text-muted-foreground py-12 text-center text-sm">
        <p className="text-foreground text-base font-medium">{t('empty.title')}</p>
        <p className="mt-2">{t('empty.description')}</p>
      </div>
    )
  }

  return (
    <section className="space-y-8">
      <p className="text-muted-foreground/70 text-[13px]">{t('stats', { count: total })}</p>
      <div className="divide-border/40 flex flex-col divide-y">
        {posts.map((post) => (
          <article key={post.id} className="group py-6 first:pt-0 sm:py-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
              {post.coverImageUrl && (
                <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden rounded-2xl sm:w-52">
                  <Image
                    src={post.coverImageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 208px"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2.5 text-[13px]">
                  <span className="text-primary font-medium">
                    {categoryLabels[post.categoryKey] ?? post.categoryKey}
                  </span>
                  {post.publishedAt && (
                    <>
                      <span className="bg-border/70 size-1 rounded-full" aria-hidden />
                      <time dateTime={post.publishedAt.toISOString()} className="text-muted-foreground/60 tabular-nums">
                        {format.dateTime(post.publishedAt, 'short')}
                      </time>
                    </>
                  )}
                </div>
                <h2>
                  <Link
                    href={postPath(post.id)}
                    className="text-foreground hover:text-primary text-lg leading-snug font-semibold transition sm:text-xl"
                  >
                    {post.title}
                  </Link>
                </h2>
                <p className="text-muted-foreground/90 line-clamp-2 text-sm leading-relaxed sm:text-base">
                  {post.summary}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
      {pageCount > 1 && (
        <PaginationLinks page={page} pageCount={pageCount} labels={{ prev: t('prev'), next: t('next') }} />
      )}
    </section>
  )
}

export function PostListSkeleton() {
  return (
    <div className="divide-border/40 flex flex-col divide-y" aria-busy>
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="space-y-3 py-8">
          <div className="bg-muted h-3 w-32 animate-pulse rounded" />
          <div className="bg-muted h-5 w-3/4 animate-pulse rounded" />
          <div className="bg-muted h-4 w-full animate-pulse rounded" />
        </div>
      ))}
    </div>
  )
}
