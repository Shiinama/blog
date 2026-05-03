import { and, desc, eq, gte, isNotNull, like, or, type SQL } from 'drizzle-orm'

import { categories, postTranslations, posts } from '@/drizzle/schema'
import { DEFAULT_LOCALE } from '@/i18n/routing'
import { createDb } from '@/lib/db'
import { buildAbsoluteUrl } from '@/lib/metadata'

export type ContentSignalPost = {
  id: string
  title: string
  summary: string
  content?: string
  url: string
  publishedAt: string | null
  updatedAt: string | null
}

export type ContentSignalsOptions = {
  limit?: number
  locale?: string
  days?: number
  category?: string
  tag?: string
  includeContent?: boolean
}

function resolveLocale(locale?: string) {
  const normalized = locale?.trim().toLowerCase()
  return normalized?.length ? normalized : DEFAULT_LOCALE
}

function buildLocaleAvailabilityCondition(targetLocale: string): SQL<unknown> {
  return or(eq(posts.language, targetLocale), isNotNull(postTranslations.id)) as SQL<unknown>
}

function clampLimit(limit?: number) {
  if (!Number.isFinite(limit)) return 10
  return Math.min(Math.max(Math.trunc(limit ?? 10), 1), 50)
}

function normalizeDays(days?: number) {
  if (!Number.isFinite(days) || !days || days <= 0) return undefined
  return Math.min(Math.trunc(days), 3650)
}

function includesToken(values: string[], token?: string) {
  if (!token) return true
  const normalizedToken = token.trim().toLowerCase()
  return values.some((value) => value.trim().toLowerCase() === normalizedToken)
}

function buildPostPath(locale: string, postId: string) {
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`
  return `${prefix}/content/${postId}`
}

export async function getContentSignals({
  limit = 10,
  locale,
  days,
  category,
  tag,
  includeContent = true
}: ContentSignalsOptions = {}) {
  const db = createDb()
  const targetLocale = resolveLocale(locale)
  const maxItems = clampLimit(limit)
  const maxAgeDays = normalizeDays(days)
  const translationJoin = and(eq(postTranslations.postId, posts.id), eq(postTranslations.locale, targetLocale))
  const conditions: SQL<unknown>[] = [eq(posts.status, 'PUBLISHED'), buildLocaleAvailabilityCondition(targetLocale)]

  if (maxAgeDays) {
    conditions.push(gte(posts.updatedAt, new Date(Date.now() - maxAgeDays * 86_400_000)))
  }

  if (category) {
    conditions.push(eq(categories.key, category))
  }

  if (tag) {
    conditions.push(like(posts.tags, `%${tag}%`))
  }

  const rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      summary: posts.summary,
      content: posts.content,
      tags: posts.tags,
      language: posts.language,
      publishedAt: posts.publishedAt,
      updatedAt: posts.updatedAt,
      translationTitle: postTranslations.title,
      translationSummary: postTranslations.summary,
      translationContent: postTranslations.content
    })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .leftJoin(postTranslations, translationJoin)
    .where(and(...conditions))
    .orderBy(desc(posts.updatedAt))
    .limit(tag ? Math.max(maxItems * 4, 20) : maxItems)

  const resultPosts = rows
    .map((row) => {
      const translated = targetLocale !== resolveLocale(row.language) && row.translationTitle
      const title = translated ? (row.translationTitle ?? row.title) : row.title
      const summary = translated ? (row.translationSummary ?? row.summary) : row.summary
      const content = translated ? (row.translationContent ?? row.content) : row.content
      const tags = Array.isArray(row.tags) ? row.tags : []

      if (!includesToken(tags, tag)) return null

      const post: ContentSignalPost = {
        id: row.id,
        title,
        summary,
        url: buildAbsoluteUrl(buildPostPath(targetLocale, row.id)),
        publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
        updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null
      }

      if (includeContent) {
        post.content = content
      }

      return post
    })
    .filter((post): post is ContentSignalPost => Boolean(post))
    .slice(0, maxItems)

  return resultPosts
}
