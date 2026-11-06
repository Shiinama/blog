import { routing, type Locale } from '@/i18n/routing'

export const SITE_NAME = 'Fish Blog'
export const SITE_AUTHOR = 'Felix'

export const siteOrigin = (process.env.NEXT_PUBLIC_BASE_URL || 'https://xibaoyu.xyz').replace(/\/+$/, '')

/** Path for `pathname` in `locale`, following the `as-needed` prefix strategy. */
export function localePath(pathname: string, locale: string) {
  const path = pathname === '/' ? '' : pathname
  return locale === routing.defaultLocale ? path || '/' : `/${locale}${path}`
}

export function absoluteUrl(pathname: string, locale: string = routing.defaultLocale) {
  return new URL(localePath(pathname, locale), siteOrigin).toString()
}

export const postPath = (id: string) => `/content/${id}`
export const postUrl = (id: string, locale: string) => absoluteUrl(postPath(id), locale)

/** `alternates` for Metadata: canonical for `locale` plus hreflang links for every available locale. */
export function alternates(pathname: string, locale: string, available: readonly string[] = routing.locales) {
  const locales = routing.locales.filter((l) => available.includes(l))
  return {
    canonical: localePath(pathname, locale),
    languages: {
      ...Object.fromEntries(locales.map((l) => [l, localePath(pathname, l)])),
      'x-default': localePath(pathname, locales.includes(routing.defaultLocale) ? routing.defaultLocale : locales[0]!)
    }
  }
}

export const isLocale = (value: string): value is Locale => (routing.locales as readonly string[]).includes(value)
