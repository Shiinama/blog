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
  slug: string
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
    <section className={cn('mt-8 space-y-8 pb-10', className)}>
      <div className="space-y-4">
        <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs font-semibold tracking-[0.45em] uppercase">
          <span>{t('stats', { count: total })}</span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchInput('')
                setSelectedCategoryId('all')
                setSortBy('newest')
              }}
            >
              <RotateCcw className="h-3 w-3" />
              {t('reset')}
            </Button>
          )}
          {isPending && (
            <span className="text-muted-foreground inline-flex items-center gap-2 text-[0.6rem] font-semibold tracking-[0.4em] uppercase">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t('updating')}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchLabel')}
          />
          <div className="flex flex-1 flex-col gap-3 sm:flex-row md:flex-none md:gap-5">
            <Select value={selectedCategoryId} onValueChange={(value) => setSelectedCategoryId(value)}>
              <SelectTrigger aria-label={t('categoryLabel')}>
                <SelectValue className="truncate text-left" placeholder={t('categoryAll')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('categoryAll')}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.label} ({category.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: ExplorerSortOption) => setSortBy(value)}>
              <SelectTrigger aria-label={t('sortLabel')}>
                <SelectValue className="truncate text-left" placeholder={t('sortPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t('sortOptions.newest')}</SelectItem>
                <SelectItem value="oldest">{t('sortOptions.oldest')}</SelectItem>
                <SelectItem value="alphabetical">{t('sortOptions.alphabetical')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="divide-border/60 space-y-0">
        {posts.map((post) => (
          <article key={post.id} className="grid gap-5 pb-6">
            <div className="space-y-3">
              <div className="text-muted-foreground/80 flex flex-wrap items-center gap-3 text-[11px] font-semibold tracking-[0.35em] uppercase">
                <span>{post.categoryLabel}</span>
                {post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>}
              </div>
              <header className="space-y-2">
                <Link
                  href={`/content/${post.id}`}
                  className="text-foreground hover:text-primary block text-lg leading-snug font-semibold transition sm:text-xl"
                >
                  {post.title}
                </Link>
                {post.summary && <p className="text-muted-foreground/90 text-sm sm:text-base">{post.summary}</p>}
              </header>
            </div>
            {post.coverImageUrl && (
              <div className="relative hidden h-32 w-full overflow-hidden rounded-2xl sm:block md:h-36">
                <Image
                  src={post.coverImageUrl}
                  alt={post.title}
                  fill
                  sizes="(min-width: 768px) 220px, 100vw"
                  className="object-cover"
                />
              </div>
            )}
          </article>
        ))}
        {posts.length === 0 && (
          <div className="text-muted-foreground py-16 text-center text-sm">
            <p className="text-foreground font-medium">{t('empty.title')}</p>
            <p className="mt-2">{t('empty.description')}</p>
          </div>
        )}
        {posts.length < total && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
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
                  setPosts((prev) => [...prev, ...mapServerPostsToDisplay(response.posts, labelLookup, uncategorizedLabel)])
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
      slug: record.slug,
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
