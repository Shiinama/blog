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

function buildEntry(
  pathname: string,
  locale: string,
  availableLocales: string[]
): MetadataRoute.Sitemap[number] {
  const supportedAlternates = availableLocales.filter((code) => routing.locales.includes(code))
  const defaultUrl = `${origin}${localePath(pathname, locale)}`
  const alternates = supportedAlternates
    .filter((code) => code !== locale)
    .reduce<Record<string, string>>((acc, code) => {
      acc[code] = `${origin}${localePath(pathname, code)}`
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
  const staticEntries = staticPaths.flatMap((path) =>
    routing.locales.map((locale) => buildEntry(path, locale, routing.locales))
  )

  const postEntries = posts.flatMap((post) => {
    const locales = (post.locales || []).filter((locale) => routing.locales.includes(locale))
    return locales.map((locale) => buildEntry(`/content/${post.id}`, locale, locales))
  })

  const uniqueByUrl = new Map<string, MetadataRoute.Sitemap[number]>()
  for (const entry of [...staticEntries, ...postEntries]) {
    uniqueByUrl.set(entry.url, entry)
  }

  return Array.from(uniqueByUrl.values())
}
