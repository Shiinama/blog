import { type MetadataRoute } from 'next'
import { connection } from 'next/server'

import { DEFAULT_LOCALE, routing } from '@/i18n/routing'
import { getSiteOrigin } from '@/lib/metadata'
import { getVisibleCategoriesWithPosts } from '@/lib/posts'

const origin = getSiteOrigin()

function localePath(pathname: string, locale: string) {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`
  return locale === DEFAULT_LOCALE ? normalized : `/${locale}${normalized}`
}

function buildEntry(pathname: string, lastModified: string | Date): MetadataRoute.Sitemap[number] {
  const defaultUrl = `${origin}${localePath(pathname, DEFAULT_LOCALE)}`
  const alternates = routing.locales.reduce<Record<string, string>>(
    (acc, locale) => {
      acc[locale] = `${origin}${localePath(pathname, locale)}`
      return acc
    },
    {
      'x-default': defaultUrl
    }
  )

  return {
    url: defaultUrl,
    lastModified,
    alternates: {
      languages: alternates
    }
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection()
  const categories = await getVisibleCategoriesWithPosts()
  const posts = categories.flatMap((category) => category.posts)

  const staticPaths = ['/', '/about']
  const staticEntries = staticPaths.map((path) => buildEntry(path, new Date()))

  const postEntries = posts.map((post) => {
    const lastModified = post.publishedAt ?? post.createdAt ?? new Date().toISOString()
    return buildEntry(`/content/${post.id}`, lastModified)
  })

  // Deduplicate in case posts are shared across categories
  const uniqueByUrl = new Map<string, MetadataRoute.Sitemap[number]>()
  for (const entry of [...staticEntries, ...postEntries]) {
    uniqueByUrl.set(entry.url, entry)
  }

  return Array.from(uniqueByUrl.values())
}
