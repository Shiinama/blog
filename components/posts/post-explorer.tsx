'use client'

import { ArrowUpRight, Loader2, RotateCcw } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'

import { fetchExplorerPostsAction } from '@/actions/posts'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCategoryLabel } from '@/lib/categories'


import type { ExplorerPostRecord, ExplorerSortOption } from '@/lib/posts'

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
  sortTimestamp: number
}

export interface ExplorerCategory {
  id: string
  label: string
  count: number
}

interface PostExplorerProps {
  initialPosts: ExplorerPost[]
  categories: ExplorerCategory[]
}

export function PostExplorer({ initialPosts, categories }: PostExplorerProps) {
  const [posts, setPosts] = useState<ExplorerPost[]>(initialPosts)
  const [search, setSearch] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [sortBy, setSortBy] = useState<ExplorerSortOption>('newest')
  const [isPending, startTransition] = useTransition()
  const hasInitialized = useRef(false)

  const labelLookup = useMemo(() => {
    return categories.reduce<Record<string, string>>((acc, category) => {
      acc[category.id] = category.label
      return acc
    }, {})
  }, [categories])

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      return
    }

    const timeout = setTimeout(() => {
      startTransition(async () => {
        const response = await fetchExplorerPostsAction({
          search: search.trim() || undefined,
          categoryId: selectedCategoryId === 'all' ? undefined : selectedCategoryId,
          sortBy
        })
        setPosts(mapServerPostsToDisplay(response, labelLookup))
      })
    }, 250)

    return () => clearTimeout(timeout)
  }, [search, selectedCategoryId, sortBy, labelLookup, startTransition])

  const hasActiveFilters = selectedCategoryId !== 'all' || Boolean(search.trim()) || sortBy !== 'newest'

  return (
    <section className="mt-8 space-y-8">
      <div className="border-border/60 border-t pt-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
          <label className="text-muted-foreground flex flex-1 flex-col gap-2 text-[0.65rem] font-semibold tracking-[0.4em] uppercase">
            Search
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Find by title, summary, or keyword"
              className="border-border/70 text-foreground h-10 rounded-none border-0 border-b bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </label>
          <div className="flex flex-col gap-4 sm:flex-row md:flex-none md:gap-6">
            <label className="text-muted-foreground flex flex-1 flex-col gap-2 text-[0.65rem] font-semibold tracking-[0.4em] uppercase">
              Category
              <Select value={selectedCategoryId} onValueChange={(value) => setSelectedCategoryId(value)}>
                <SelectTrigger className="border-border/70 text-foreground h-10 min-w-[180px] rounded-none border-0 border-b bg-transparent px-0 text-sm font-medium focus:ring-0">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.label} ({category.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="text-muted-foreground flex flex-1 flex-col gap-2 text-[0.65rem] font-semibold tracking-[0.4em] uppercase">
              Sort
              <Select value={sortBy} onValueChange={(value: ExplorerSortOption) => setSortBy(value)}>
                <SelectTrigger className="border-border/70 text-foreground h-10 min-w-40 rounded-none border-0 border-b bg-transparent px-0 text-sm font-medium focus:ring-0">
                  <SelectValue placeholder="Newest first" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="alphabetical">A → Z</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>
        </div>
        <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-4 text-[0.65rem] tracking-[0.35em] uppercase">
          <span>
            Showing {posts.length} article{posts.length === 1 ? '' : 's'}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition"
              onClick={() => {
                setSearch('')
                setSelectedCategoryId('all')
                setSortBy('newest')
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
          {isPending && (
            <span className="text-muted-foreground inline-flex items-center gap-2 text-[0.6rem] tracking-[0.4em] uppercase">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Updating
            </span>
          )}
        </div>
      </div>

      <div className="divide-border/60 divide-y">
        {posts.map((post) => (
          <article key={post.id} className="grid gap-5 py-6 md:grid-cols-[minmax(0,1fr)_220px] md:items-start">
            <div className="space-y-3">
              <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-[11px] font-semibold tracking-[0.35em] uppercase">
                <span>{post.categoryLabel}</span>
                {post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>}
              </div>
              <header className="space-y-3">
                <Link
                  href={`/content/${post.slug}`}
                  className="text-foreground hover:text-primary block text-lg leading-snug font-semibold transition sm:text-xl"
                >
                  {post.title}
                </Link>
                {post.summary && <p className="text-muted-foreground text-sm sm:text-base">{post.summary}</p>}
              </header>
              <Link
                href={`/content/${post.slug}`}
                className="text-primary hover:text-foreground inline-flex items-center gap-2 text-xs font-semibold transition"
              >
                <ArrowUpRight className="h-4 w-4" />
                <span>Read article</span>
              </Link>
            </div>
            {post.coverImageUrl && (
              <div className="relative hidden h-32 w-full overflow-hidden rounded-xl sm:block md:h-36">
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
            <p className="text-foreground font-medium">Nothing matches yet.</p>
            <p className="mt-2">Adjust the filters or clear the search.</p>
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

function mapServerPostsToDisplay(records: ExplorerPostRecord[], labels: Record<string, string>): ExplorerPost[] {
  return records.map((record) => {
    const derivedLabel =
      (record.categoryId ? labels[record.categoryId] : undefined) ||
      formatCategoryLabel(record.categoryKey ?? undefined) ||
      'Uncategorized'
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
