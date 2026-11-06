import { routing } from '@/i18n/routing'
import { getSitemapPosts } from '@/lib/data/posts'
import { absoluteUrl, postPath } from '@/lib/metadata'

import type { MetadataRoute } from 'next'

function entry(pathname: string, locales: readonly string[], lastModified?: Date): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(locales.map((locale) => [locale, absoluteUrl(pathname, locale)]))
  return locales.map((locale) => ({ url: absoluteUrl(pathname, locale), lastModified, alternates: { languages } }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getSitemapPosts()
  const supported = (locales: string[]) => routing.locales.filter((locale) => locales.includes(locale))

  return [
    ...entry('/', routing.locales),
    ...entry('/about', routing.locales),
    ...posts.flatMap((post) => entry(postPath(post.id), supported(post.locales), post.updatedAt))
  ]
}
