'use client'

import { useTranslations } from 'next-intl'
import * as React from 'react'

import { useMounted } from '@/hooks/use-mounted'
import { cn } from '@/lib/utils'

interface TocEntry {
  items?: TocEntry[]
  url: string
  title: string
}

interface TocProps {
  toc: TocEntry[]
}

export function DashboardTableOfContents({ toc }: TocProps) {
  const t = useTranslations('article')
  const itemIds = React.useMemo(() => {
    const extractIds = (items: TocEntry[]): string[] => {
      return items.flatMap((item) => [item.url.split('#')[1], ...(item.items ? extractIds(item.items) : [])])
    }
    return toc ? extractIds(toc) : []
  }, [toc])
  const activeHeading = useActiveItem(itemIds)

  const mounted = useMounted()

  return mounted ? (
    <div className="space-y-2 whitespace-nowrap">
      <p className="font-medium">{t('onPage')}</p>
      <Tree tree={toc} activeItem={activeHeading} />
    </div>
  ) : null
}

function useActiveItem(itemIds: (string | undefined)[]) {
  const [activeId, setActiveId] = React.useState<string>('')

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: `0% 0% -60% 0%` }
    )

    itemIds?.forEach((id) => {
      if (!id) {
        return
      }

      const element = document.getElementById(id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      itemIds?.forEach((id) => {
        if (!id) {
          return
        }

        const element = document.getElementById(id)
        if (element) {
          observer.unobserve(element)
        }
      })
    }
  }, [itemIds])

  return activeId
}

interface TreeProps {
  tree: TocEntry[]
  level?: number
  activeItem?: string | null
}

function Tree({ tree, level = 1, activeItem }: TreeProps) {
  return tree.length && level < 5 ? (
    <ul className={cn('m-0 list-none text-sm', { 'pl-4': level !== 1 })}>
      {tree.map((item, index) => {
        return (
          <li key={index} className={cn('mt-0 pt-2')}>
            <a
              href={item.url}
              className={cn(
                'inline-block rounded px-1 py-0.5 no-underline',
                item.url === `#${activeItem}` ? 'bg-secondary font-medium text-primary' : 'text-muted-foreground'
              )}
            >
              {item.title}
            </a>
            {item.items?.length ? <Tree tree={item.items} level={level + 1} activeItem={activeItem} /> : null}
          </li>
        )
      })}
    </ul>
  ) : null
}
