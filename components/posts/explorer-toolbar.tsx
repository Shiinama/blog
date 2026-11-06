'use client'

import { Loader2, RotateCcw, Search } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePathname, useRouter } from '@/i18n/navigation'

type CategoryOption = { key: string; label: string; count: number }

const triggerClass =
  'text-foreground/80 hover:bg-muted/50 h-9 w-auto gap-1.5 rounded-md border-0 bg-transparent px-2.5 text-[13px] font-medium shadow-none'

/** Filters are URL state: shareable, back/forward friendly, rendered on the server. */
export function ExplorerToolbar({ categories }: { categories: CategoryOption[] }) {
  const t = useTranslations('explorer')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(debounce.current), [])

  const update = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    next.delete('page')
    const search = next.toString()
    startTransition(() => router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false }))
  }

  const onQueryChange = (value: string) => {
    setQuery(value)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => update({ q: value.trim() || undefined }), 300)
  }

  const category = searchParams.get('category') ?? 'all'
  const sort = searchParams.get('sort') ?? 'newest'
  const hasFilters = category !== 'all' || sort !== 'newest' || Boolean(searchParams.get('q'))

  return (
    <div className="border-border/50 mb-8 space-y-4 border-b pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative flex-1">
          <Search className="text-muted-foreground/50 pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
          <Input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchLabel')}
            className="bg-muted/40 h-11 rounded-lg border-0 pl-10 text-base shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="flex items-center gap-1">
          <Select value={category} onValueChange={(value) => update({ category: value === 'all' ? undefined : value })}>
            <SelectTrigger aria-label={t('categoryLabel')} className={triggerClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">{t('categoryAll')}</SelectItem>
              {categories.map((option) => (
                <SelectItem key={option.key} value={option.key}>
                  {option.label} ({option.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="bg-border/60 h-4 w-px" aria-hidden />
          <Select value={sort} onValueChange={(value) => update({ sort: value === 'newest' ? undefined : value })}>
            <SelectTrigger aria-label={t('sortLabel')} className={triggerClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="newest">{t('sort.newest')}</SelectItem>
              <SelectItem value="oldest">{t('sort.oldest')}</SelectItem>
              <SelectItem value="title">{t('sort.title')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex h-7 items-center justify-end gap-3">
        {isPending && <Loader2 className="text-muted-foreground size-4 animate-spin" aria-label={t('updating')} />}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-7 gap-1.5 px-2 text-xs"
            onClick={() => {
              clearTimeout(debounce.current)
              setQuery('')
              startTransition(() => router.replace(pathname, { scroll: false }))
            }}
          >
            <RotateCcw className="size-3.5" />
            {t('reset')}
          </Button>
        )}
      </div>
    </div>
  )
}
