import { getTranslations } from 'next-intl/server'

import { getFeedPosts } from '@/lib/data/posts'
import { absoluteUrl, isLocale, postUrl, SITE_NAME } from '@/lib/metadata'

const cdata = (value: string) => `<![CDATA[${value.replaceAll(']]>', ']]]]><![CDATA[>')}]]>`

export async function GET(_request: Request, { params }: RouteContext<'/[locale]/rss.xml'>) {
  const { locale } = await params
  if (!isLocale(locale)) return new Response('Not found', { status: 404 })

  const [posts, t] = await Promise.all([getFeedPosts(locale), getTranslations({ locale, namespace: 'seo' })])
  const items = posts
    .map(
      (post) => `
    <item>
      <title>${cdata(post.title)}</title>
      <link>${postUrl(post.id, locale)}</link>
      <guid isPermaLink="false">${post.id}</guid>
      <description>${cdata(post.summary)}</description>
      <category>${cdata(post.categoryKey)}</category>${post.tags.map((tag) => `\n      <category>${cdata(tag)}</category>`).join('')}
      ${post.publishedAt ? `<pubDate>${post.publishedAt.toUTCString()}</pubDate>` : ''}
    </item>`
    )
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${cdata(SITE_NAME)}</title>
    <link>${absoluteUrl('/', locale)}</link>
    <atom:link href="${absoluteUrl('/rss.xml', locale)}" rel="self" type="application/rss+xml" />
    <description>${cdata(t('siteDescription'))}</description>
    <language>${locale}</language>${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600'
    }
  })
}
