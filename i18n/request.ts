import { notFound } from 'next/navigation'
import * as rootParams from 'next/root-params'
import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'

import { routing } from './routing'

import type { Formats } from 'next-intl'

/** Fixed so server- and client-rendered dates always agree. */
export const timeZone = 'Asia/Shanghai'

export const formats = {
  dateTime: {
    short: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }
  }
} satisfies Formats

export default getRequestConfig(async ({ locale }) => {
  // Server Actions / Route Handlers pass `locale` explicitly; everything else reads the root param.
  if (!locale) {
    const param = await rootParams.locale()
    if (!hasLocale(routing.locales, param)) notFound()
    locale = param
  }

  return {
    locale,
    timeZone,
    formats,
    messages: (await import(`../messages/${locale}.json`)).default
  }
})
