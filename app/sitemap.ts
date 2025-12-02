import { type MetadataRoute } from 'next'
import { connection } from 'next/server'

import { DEFAULT_LOCALE, routing } from '@/i18n/routing'
import { getSiteOrigin } from '@/lib/metadata'
import { getPublishedPostsForSitemap } from '@/lib/posts'

const origin = getSiteOrigin()

function localePath(pathname: string, locale: string) {
  if (pathname === '') {
    return locale === DEFAULT_LOCALE ? '' : `/${locale}`
  }

  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`
  return locale === DEFAULT_LOCALE ? normalized : `/${locale}${normalized}`
}

function buildEntry(pathname: string): MetadataRoute.Sitemap[number] {
  const defaultUrl = `${origin}${localePath(pathname, DEFAULT_LOCALE)}`
  const alternates = routing.locales
    .filter((i) => i !== 'en')
    .reduce<Record<string, string>>((acc, locale) => {
      acc[locale] = `${origin}${localePath(pathname, locale)}`
      return acc
    }, {})

  return {
    url: defaultUrl,
    alternates: {
      languages: alternates
    }
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection()
  const posts = await getPublishedPostsForSitemap()

  const staticPaths = ['', '/about']
  const staticEntries = staticPaths.map((path) => buildEntry(path))

  const postEntries = posts.map((post) => {
    return buildEntry(`/content/${post.id}`)
  })

  const uniqueByUrl = new Map<string, MetadataRoute.Sitemap[number]>()
  for (const entry of [...staticEntries, ...postEntries]) {
    uniqueByUrl.set(entry.url, entry)
  }

  return Array.from(uniqueByUrl.values())
}
