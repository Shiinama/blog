'use client'

import { useDebounce, useUpdateEffect } from 'ahooks'
import { Loader2, RotateCcw } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useMemo, useState, useTransition } from 'react'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Link } from '@/i18n/navigation'
import { formatCategoryLabel } from '@/lib/categories'
import { getExplorerPosts } from '@/lib/posts'
import { cn } from '@/lib/utils'

import { Button } from '../ui/button'

import type { ExplorerPostRecord, ExplorerSortOption } from '@/lib/posts/types'

export type ExplorerPost = {
  id: string
  title: string
  summary: string | null
  coverImageUrl?: string | null
  categoryId?: string | null
  categoryLabel: string
  publishedAt?: string | null
  createdAt?: string | null
}

export interface ExplorerCategory {
  id: string
  label: string
  count: number
}

interface PostExplorerProps {
  initialPosts: ExplorerPost[]
  initialTotal: number
  categories: ExplorerCategory[]
  className?: string
  locale?: string
}

export function PostExplorer({ initialPosts, initialTotal, categories, className, locale }: PostExplorerProps) {
  const [posts, setPosts] = useState<ExplorerPost[]>(initialPosts)
  const [total, setTotal] = useState(initialTotal)
  const [searchInput, setSearchInput] = useState('')
  const throttledSearch = useDebounce(searchInput, { wait: 250 })
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [sortBy, setSortBy] = useState<ExplorerSortOption>('newest')
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [isPending, startTransition] = useTransition()
  const [isLoadingMore, startLoadMore] = useTransition()
  const t = useTranslations('explorer')
  const common = useTranslations('common')
  const uncategorizedLabel = common('uncategorized')

  const labelLookup = useMemo(() => {
    return categories.reduce<Record<string, string>>((acc, category) => {
      acc[category.id] = category.label
      return acc
    }, {})
  }, [categories])

  useUpdateEffect(() => {
    startTransition(async () => {
      const trimmedSearch = throttledSearch.trim()
      const response = await getExplorerPosts({
        search: trimmedSearch || undefined,
        categoryId: selectedCategoryId === 'all' ? undefined : selectedCategoryId,
        sortBy,
        locale,
        page: 1,
        pageSize
      })
      setPosts(mapServerPostsToDisplay(response.posts, labelLookup, uncategorizedLabel))
      setTotal(response.total)
      setPage(1)
    })
  }, [throttledSearch, selectedCategoryId, sortBy, labelLookup, startTransition, uncategorizedLabel])

  const hasActiveFilters = selectedCategoryId !== 'all' || Boolean(searchInput.trim()) || sortBy !== 'newest'

  return (
    <section className={cn('mt-6 space-y-6 pb-12 sm:space-y-8', className)}>
      <div className="bg-card/80 ring-border/40 rounded-3xl px-4 py-5 shadow-[0_16px_50px_rgba(0,0,0,0.08)] ring-1 backdrop-blur-sm sm:px-6 dark:ring-white/10">
        <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs font-semibold tracking-[0.28em] uppercase">
          <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.2em]">
            {t('stats', { count: total })}
          </span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 rounded-full px-3 text-[12px]"
              onClick={() => {
                setSearchInput('')
                setSelectedCategoryId('all')
                setSortBy('newest')
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t('reset')}
            </Button>
          )}
          {isPending && (
            <span className="text-muted-foreground inline-flex items-center gap-2 text-[0.65rem] font-semibold tracking-[0.25em] uppercase">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t('updating')}
            </span>
          )}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1.1fr_1fr] sm:items-end sm:gap-4">
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchLabel')}
            className="border-border/70 bg-muted/40 min-h-11 rounded-2xl px-4 text-base shadow-inner shadow-black/5 focus-visible:ring-2"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select value={selectedCategoryId} onValueChange={(value) => setSelectedCategoryId(value)}>
              <SelectTrigger aria-label={t('categoryLabel')} className="rounded-2xl px-4 shadow-sm">
                <SelectValue className="truncate text-left" placeholder={t('categoryAll')} />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="all">{t('categoryAll')}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.label} ({category.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: ExplorerSortOption) => setSortBy(value)}>
              <SelectTrigger aria-label={t('sortLabel')} className="rounded-2xl px-4 shadow-sm">
                <SelectValue className="truncate text-left" placeholder={t('sortPlaceholder')} />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="newest">{t('sortOptions.newest')}</SelectItem>
                <SelectItem value="oldest">{t('sortOptions.oldest')}</SelectItem>
                <SelectItem value="alphabetical">{t('sortOptions.alphabetical')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-5">
        {posts.map((post) => (
          <article
            key={post.id}
            className="bg-card/85 ring-border/30 hover:ring-border/50 rounded-3xl p-4 shadow-[0_16px_50px_rgba(0,0,0,0.08)] ring-1 backdrop-blur-sm transition hover:-translate-y-0.5 sm:p-5 dark:ring-white/10"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
              {post.coverImageUrl && (
                <div className="from-primary/10 via-primary/5 relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-linear-to-br to-transparent sm:w-52">
                  <Image
                    src={post.coverImageUrl}
                    alt={post.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 220px"
                    className="object-cover transition duration-500 hover:scale-[1.03]"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col gap-3">
                <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-[12px]">
                  <span className="text-primary/90 bg-primary/10 rounded-full px-3 py-1 font-semibold tracking-[0.15em] uppercase">
                    {post.categoryLabel}
                  </span>
                  {post.publishedAt && (
                    <time dateTime={post.publishedAt} className="text-muted-foreground/80">
                      {formatDate(post.publishedAt)}
                    </time>
                  )}
                </div>
                <header className="space-y-2">
                  <Link
                    href={`/content/${post.id}`}
                    className="text-foreground hover:text-primary block text-lg leading-snug font-semibold transition sm:text-xl"
                  >
                    {post.title}
                  </Link>
                  <p className="text-muted-foreground/90 line-clamp-2 text-sm leading-relaxed sm:text-base">
                    {post.summary}
                  </p>
                </header>
              </div>
            </div>
          </article>
        ))}
        {posts.length === 0 && (
          <div className="text-muted-foreground bg-card/70 rounded-3xl px-6 py-12 text-center text-sm shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
            <p className="text-foreground text-base font-medium">{t('empty.title')}</p>
            <p className="mt-2 leading-relaxed">{t('empty.description')}</p>
          </div>
        )}
        {posts.length < total && (
          <div className="flex justify-center pt-2">
            <Button
              variant="secondary"
              className="rounded-full px-6"
              onClick={() =>
                startLoadMore(async () => {
                  const nextPage = page + 1
                  const trimmedSearch = throttledSearch.trim()
                  const response = await getExplorerPosts({
                    search: trimmedSearch || undefined,
                    categoryId: selectedCategoryId === 'all' ? undefined : selectedCategoryId,
                    sortBy,
                    locale,
                    page: nextPage,
                    pageSize
                  })
                  setPosts((prev) => [
                    ...prev,
                    ...mapServerPostsToDisplay(response.posts, labelLookup, uncategorizedLabel)
                  ])
                  setTotal(response.total)
                  setPage(nextPage)
                })
              }
              disabled={isLoadingMore}
            >
              {isLoadingMore ? t('loadingMore') : t('loadMore')}
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}

function formatDate(date?: string | null) {
  if (!date) {
    return ''
  }

  try {
    return new Date(date).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return date
  }
}

function mapServerPostsToDisplay(
  records: ExplorerPostRecord[],
  labels: Record<string, string>,
  fallbackLabel: string
): ExplorerPost[] {
  return records.map((record) => {
    const derivedLabel =
      (record.categoryId ? labels[record.categoryId] : undefined) ||
      formatCategoryLabel(record.categoryKey ?? undefined) ||
      fallbackLabel
    return {
      id: record.id,
      title: record.title,
      summary: record.summary,
      coverImageUrl: record.coverImageUrl ?? undefined,
      categoryId: record.categoryId ?? undefined,
      categoryLabel: derivedLabel,
      publishedAt: record.publishedAt ?? undefined,
      createdAt: record.createdAt ?? undefined,
      sortTimestamp: record.sortTimestamp
    }
  })
}
