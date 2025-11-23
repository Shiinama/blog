import { NextResponse } from 'next/server'

import { DEFAULT_SITE_NAME, getSiteOrigin } from '@/lib/metadata'
import { getPostsForFeed } from '@/lib/posts'

function wrapCdata(value: string) {
  return `<![CDATA[${value.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`
}

export async function GET() {
  const origin = getSiteOrigin()
  const posts = await getPostsForFeed(50)
  const channelLink = `${origin}/`

  const items = posts
    .map((post) => {
      const published = post.publishedAt || post.createdAt || new Date().toISOString()
      const link = `${origin}/content/${post.id}`
      const summary = post.summary || post.content.slice(0, 240)

      return `
        <item>
          <title>${wrapCdata(post.title)}</title>
          <link>${link}</link>
          <guid isPermaLink="false">${post.id}</guid>
          <description>${wrapCdata(summary)}</description>
          <pubDate>${new Date(published).toUTCString()}</pubDate>
        </item>
      `
    })
    .join('')

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>${wrapCdata(DEFAULT_SITE_NAME)}</title>
    <link>${channelLink}</link>
    <description>${wrapCdata('Latest articles from Fish Blog')}</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`

  return new NextResponse(rss, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600'
    }
  })
}
