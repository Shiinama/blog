import { DEFAULT_LOCALE, routing } from '@/i18n/routing'

export const DEFAULT_SITE_NAME = 'Fish Blog'

function normalizePathname(pathname: string) {
  if (!pathname) return '/'
  const prefixed = pathname.startsWith('/') ? pathname : `/${pathname}`
  if (prefixed === '/') return prefixed
  return prefixed.endsWith('/') ? prefixed.slice(0, -1) : prefixed
}

export function buildLanguageAlternates(pathname: string) {
  const normalized = normalizePathname(pathname)

  return routing.locales.reduce<Record<string, string>>(
    (acc, locale) => {
      const href = locale === DEFAULT_LOCALE ? normalized : `/${locale}${normalized}`
      acc[locale] = href
      return acc
    },
    {
      'x-default': normalized
    }
  )
}

export function getSiteOrigin() {
  const envOrigin =
    process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || 'https://xibaoyu.xyz'
  let origin = envOrigin.trim()

  if (!origin) {
    origin = 'https://xibaoyu.xyz'
  }

  if (!/^https?:\/\//i.test(origin)) {
    origin = `https://${origin}`
  }

  return origin.replace(/\/+$/, '')
}

export function getOgImageUrl() {
  return `${getSiteOrigin()}/og.png`
}

export function buildAbsoluteUrl(pathname: string) {
  return new URL(normalizePathname(pathname), getSiteOrigin()).toString()
}
