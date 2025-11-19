import { Children } from 'react'

import { Link } from '@/i18n/navigation'
import { slugifyHeading } from '@/lib/markdown/slugify'

import type { JSX } from 'react'

interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6
  children: React.ReactNode
}

export function Heading({ level, children }: HeadingProps) {
  const text = Children.toArray(children)
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number') {
        return child.toString()
      }
      return ''
    })
    .join(' ')
    .trim()

  const slug = slugifyHeading(text)
  const Tag = `h${level}` as keyof JSX.IntrinsicElements

  return (
    <Tag id={slug}>
      <Link href={`#${slug}`} className="no-underline hover:underline">
        {children}
      </Link>
    </Tag>
  )
}
