'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Link, usePathname } from '@/i18n/navigation'

type Props = { page: number; pageCount: number; labels: { prev: string; next: string } }

/** Prev/next links that keep the current filters. */
export function PaginationLinks({ page, pageCount, labels }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const hrefFor = (target: number) => {
    const query = Object.fromEntries(searchParams)
    if (target > 1) query.page = String(target)
    else delete query.page
    return { pathname, query }
  }

  return (
    <nav className="flex items-center justify-center gap-3 pt-2" aria-label="Pagination">
      <Button asChild variant="outline" size="sm" className={page <= 1 ? 'pointer-events-none opacity-50' : ''}>
        <Link href={hrefFor(page - 1)} aria-disabled={page <= 1}>
          <ChevronLeft /> {labels.prev}
        </Link>
      </Button>
      <span className="text-muted-foreground text-sm tabular-nums">
        {page} / {pageCount}
      </span>
      <Button asChild variant="outline" size="sm" className={page >= pageCount ? 'pointer-events-none opacity-50' : ''}>
        <Link href={hrefFor(page + 1)} aria-disabled={page >= pageCount}>
          {labels.next} <ChevronRight />
        </Link>
      </Button>
    </nav>
  )
}
