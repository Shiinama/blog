'use server'

import { NextResponse } from 'next/server'

import { DEFAULT_LOCALE } from '@/i18n/routing'
import { DEFAULT_SITE_NAME, getSiteOrigin } from '@/lib/metadata'
import { getPostsForFeed } from '@/lib/posts'

function wrapCdata(value: string) {
  return `<![CDATA[${value.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`
}

function resolveLocale(locale?: string) {
  if (!locale) return DEFAULT_LOCALE
  const normalized = locale.trim().toLowerCase()
  return normalized || DEFAULT_LOCALE
}

function buildPostLink(origin: string, locale: string, postId: string) {
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`
  return `${origin}${prefix}/content/${postId}`
}

export async function buildRssResponse(locale?: string) {
  const targetLocale = resolveLocale(locale)
  const origin = getSiteOrigin()
  const posts = await getPostsForFeed(50, targetLocale)
  const channelLink = targetLocale === DEFAULT_LOCALE ? `${origin}/` : `${origin}/${targetLocale}/`
  const channelDescription = targetLocale === 'zh' ? 'Fish Blog 最新文章' : 'Latest articles from Fish Blog'

  const items = posts
    .map((post) => {
      const published = post.publishedAt || post.createdAt || new Date().toISOString()
      const link = buildPostLink(origin, targetLocale, post.id)
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
    <description>${wrapCdata(channelDescription)}</description>
    <language>${targetLocale}</language>
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
