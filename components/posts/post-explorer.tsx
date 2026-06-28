'use client'

import { useDebounce, useUpdateEffect } from 'ahooks'
import { Loader2, RotateCcw, Search } from 'lucide-react'
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
    <section className={cn('space-y-8 pb-12', className)}>
      <div className="border-border/50 space-y-4 border-b pb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative flex-1">
            <Search
              className="text-muted-foreground/50 pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchLabel')}
              className="bg-muted/40 focus-visible:bg-muted/60 placeholder:text-muted-foreground/70 h-11 w-full rounded-lg border-0 pr-4 pl-10 text-base shadow-none transition-colors focus-visible:ring-0"
            />
          </div>
          <div className="flex items-center gap-1">
            <Select value={selectedCategoryId} onValueChange={(value) => setSelectedCategoryId(value)}>
              <SelectTrigger
                aria-label={t('categoryLabel')}
                className="text-foreground/80 hover:text-foreground hover:bg-muted/50 data-[state=open]:bg-muted/50 h-9 w-auto gap-1.5 rounded-md border-0 bg-transparent px-2.5 text-[13px] font-medium shadow-none transition-colors focus:ring-0 focus:ring-offset-0 focus-visible:ring-0"
              >
                <SelectValue className="truncate text-left" placeholder={t('categoryAll')} />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">{t('categoryAll')}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.label} ({category.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="bg-border/60 h-4 w-px" aria-hidden />
            <Select value={sortBy} onValueChange={(value: ExplorerSortOption) => setSortBy(value)}>
              <SelectTrigger
                aria-label={t('sortLabel')}
                className="text-foreground/80 hover:text-foreground hover:bg-muted/50 data-[state=open]:bg-muted/50 h-9 w-auto gap-1.5 rounded-md border-0 bg-transparent px-2.5 text-[13px] font-medium shadow-none transition-colors focus:ring-0 focus:ring-offset-0 focus-visible:ring-0"
              >
                <SelectValue className="truncate text-left" placeholder={t('sortPlaceholder')} />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="newest">{t('sortOptions.newest')}</SelectItem>
                <SelectItem value="oldest">{t('sortOptions.oldest')}</SelectItem>
                <SelectItem value="alphabetical">{t('sortOptions.alphabetical')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground/70 text-[13px]">{t('stats', { count: total })}</span>
          <div className="flex items-center gap-3">
            {isPending && (
              <span className="text-muted-foreground/70 inline-flex items-center gap-2 text-[0.65rem] font-semibold tracking-[0.25em] uppercase">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t('updating')}
              </span>
            )}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground h-7 gap-1.5 px-2 text-[12px]"
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
          </div>
        </div>
      </div>

      <div className="divide-border/40 flex flex-col divide-y">
        {posts.map((post) => (
          <article key={post.id} className="group py-6 first:pt-0 sm:py-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
              {post.coverImageUrl && (
                <div className="from-primary/10 via-primary/5 relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-linear-to-br to-transparent sm:w-52">
                  <Image
                    src={post.coverImageUrl}
                    alt={post.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 220px"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2.5 text-[13px]">
                  <span className="text-primary font-medium">{post.categoryLabel}</span>
                  {post.publishedAt && (
                    <>
                      <span className="bg-border/70 size-1 rounded-full" aria-hidden />
                      <time dateTime={post.publishedAt} className="text-muted-foreground/60 tabular-nums">
                        {formatDate(post.publishedAt, locale)}
                      </time>
                    </>
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
          <div className="text-muted-foreground px-6 py-12 text-center text-sm">
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

function formatDate(date?: string | null, locale?: string) {
  if (!date) {
    return ''
  }

  try {
    return new Date(date).toLocaleDateString(locale, {
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
