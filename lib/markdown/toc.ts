import { remark } from 'remark'
import { visit } from 'unist-util-visit'

import { slugifyHeading } from './slugify'

import type { Heading } from 'mdast'

export interface TocEntry {
  title: string
  url: string
  items: TocEntry[]
}

const headingDepthRange = new Set([2, 3, 4])

export function buildToc(markdown: string): TocEntry[] {
  const tree = remark().parse(markdown)
  const toc: TocEntry[] = []
  let lastH2: TocEntry | null = null
  let lastH3: TocEntry | null = null

  visit(tree, 'heading', (node: Heading) => {
    if (!headingDepthRange.has(node.depth)) {
      return
    }

    const title = node.children
      .filter((child) => 'value' in child)
      .map((child) => String((child as any).value))
      .join('')
      .trim()

    if (!title) return

    const slug = slugifyHeading(title)
    const entry: TocEntry = {
      title,
      url: `#${slug}`,
      items: []
    }

    if (node.depth === 2) {
      toc.push(entry)
      lastH2 = entry
      lastH3 = null
      return
    }

    if (node.depth === 3) {
      if (lastH2) {
        lastH2.items.push(entry)
        lastH3 = entry
      } else {
        toc.push(entry)
      }
      return
    }

    if (node.depth === 4) {
      if (lastH3) {
        lastH3.items.push(entry)
      } else if (lastH2) {
        lastH2.items.push(entry)
      } else {
        toc.push(entry)
      }
    }
  })

  return toc
}
