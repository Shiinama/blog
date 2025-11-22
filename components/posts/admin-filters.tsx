'use client'

import { useDebounce } from 'ahooks'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import useRouter from '@/hooks/use-router'
import { formatCategoryLabel } from '@/lib/categories'

import type { CategorySummary } from '@/lib/posts/types'

function buildQueryString(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '' || value === 'all') return
    query.set(key, String(value))
  })
  return query.toString()
}

interface AdminFiltersProps {
  initialSearch: string
  initialStatus: string
  initialCategory: string
  categories: CategorySummary[]
  locale: string
}

export function AdminFilters({ initialSearch, initialStatus, initialCategory, categories, locale }: AdminFiltersProps) {
  const t = useTranslations('admin')
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)
  const [status, setStatus] = useState(initialStatus)
  const [category, setCategory] = useState(initialCategory)
  const debouncedSearch = useDebounce(search, { wait: 400 })

  useEffect(() => {
    const query = buildQueryString({
      search: debouncedSearch || undefined,
      status,
      category,
      page: 1
    })
    router.replace(`/admin/posts${query ? `?${query}` : ''}`)
  }, [debouncedSearch, status, category, router, locale])

  return (
    <div className="grid gap-4 p-5 md:grid-cols-4">
      <div className="md:col-span-2">
        <Label className="mb-2 block text-sm font-medium">{t('posts.filters.searchLabel')}</Label>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('posts.filters.searchPlaceholder')}
        />
      </div>
      <div>
        <Label className="mb-2 block text-sm font-medium">{t('posts.filters.statusLabel')}</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder={t('posts.filters.statusLabel')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('posts.filters.statusOptions.all')}</SelectItem>
            <SelectItem value="PUBLISHED">{t('posts.filters.statusOptions.published')}</SelectItem>
            <SelectItem value="DRAFT">{t('posts.filters.statusOptions.draft')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="mb-2 block text-sm font-medium">{t('posts.filters.categoryLabel')}</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder={t('posts.filters.categoryLabel')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('posts.filters.categoryOptions.all')}</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {formatCategoryLabel(category.key) || category.key}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
