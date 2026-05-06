import { and, asc, eq, gte, isNotNull, isNull, ne, notInArray, or, type SQL } from 'drizzle-orm'

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
  contentSignalReferencedAt: string | null
}

export type ContentSignalsOptions = {
  locale?: string
  days?: number
  category?: string
  excludeCategories?: string[]
  contentSignalReferencedAt?: boolean
  includeContent?: boolean
}

function resolveLocale(locale?: string) {
  const normalized = locale?.trim().toLowerCase()
  return normalized?.length ? normalized : DEFAULT_LOCALE
}

function buildLocaleAvailabilityCondition(targetLocale: string): SQL<unknown> {
  return or(eq(posts.language, targetLocale), isNotNull(postTranslations.id)) as SQL<unknown>
}

function normalizeDays(days?: number) {
  if (!Number.isFinite(days) || !days || days <= 0) return undefined
  return Math.min(Math.trunc(days), 3650)
}

function normalizeCategoryKeys(keys?: string[]) {
  if (!keys?.length) return []
  return Array.from(new Set(keys.map((key) => key.trim()).filter(Boolean)))
}

function buildPostPath(locale: string, postId: string) {
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`
  return `${prefix}/content/${postId}`
}

function serializeContentSignalPost(
  row: {
    id: string
    title: string
    summary: string
    content: string
    language: string
    publishedAt: Date | null
    updatedAt: Date
    contentSignalReferencedAt: Date | null
    translationTitle: string | null
    translationSummary: string | null
    translationContent: string | null
  },
  targetLocale: string,
  includeContent: boolean
): ContentSignalPost {
  const translated = targetLocale !== resolveLocale(row.language) && row.translationTitle
  const title = translated ? (row.translationTitle ?? row.title) : row.title
  const summary = translated ? (row.translationSummary ?? row.summary) : row.summary
  const content = translated ? (row.translationContent ?? row.content) : row.content
  const post: ContentSignalPost = {
    id: row.id,
    title,
    summary,
    url: buildAbsoluteUrl(buildPostPath(targetLocale, row.id)),
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    updatedAt: row.updatedAt.toISOString(),
    contentSignalReferencedAt: row.contentSignalReferencedAt ? row.contentSignalReferencedAt.toISOString() : null
  }

  if (includeContent) {
    post.content = content
  }

  return post
}

export async function claimNextContentSignal({
  locale,
  days,
  category,
  excludeCategories,
  contentSignalReferencedAt,
  includeContent = true
}: ContentSignalsOptions) {
  const db = createDb()
  const targetLocale = resolveLocale(locale)
  const maxAgeDays = normalizeDays(days)
  const categoryKey = category?.trim()
  const excludedCategoryKeys = normalizeCategoryKeys(excludeCategories)
  const translationJoin = and(eq(postTranslations.postId, posts.id), eq(postTranslations.locale, targetLocale))
  const conditions: SQL<unknown>[] = [eq(posts.status, 'PUBLISHED'), buildLocaleAvailabilityCondition(targetLocale)]

  if (contentSignalReferencedAt === true) {
    conditions.push(isNotNull(posts.contentSignalReferencedAt))
  } else {
    conditions.push(isNull(posts.contentSignalReferencedAt))
  }

  if (maxAgeDays) {
    conditions.push(gte(posts.updatedAt, new Date(Date.now() - maxAgeDays * 86_400_000)))
  }

  if (categoryKey) {
    conditions.push(eq(categories.key, categoryKey))
  }

  if (excludedCategoryKeys.length === 1) {
    conditions.push(ne(categories.key, excludedCategoryKeys[0]))
  } else if (excludedCategoryKeys.length > 1) {
    conditions.push(notInArray(categories.key, excludedCategoryKeys))
  }

  const candidate = await db
    .select({
      id: posts.id,
      title: posts.title,
      summary: posts.summary,
      content: posts.content,
      language: posts.language,
      publishedAt: posts.publishedAt,
      updatedAt: posts.updatedAt,
      contentSignalReferencedAt: posts.contentSignalReferencedAt,
      translationTitle: postTranslations.title,
      translationSummary: postTranslations.summary,
      translationContent: postTranslations.content
    })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .leftJoin(postTranslations, translationJoin)
    .where(and(...conditions))
    .orderBy(asc(posts.updatedAt))
    .limit(1)
    .then((rows) => rows[0])

  if (!candidate) return null

  if (contentSignalReferencedAt === true) {
    return serializeContentSignalPost(candidate, targetLocale, includeContent)
  }

  const updated = await db
    .update(posts)
    .set({
      contentSignalReferencedAt: new Date()
    })
    .where(and(eq(posts.id, candidate.id), isNull(posts.contentSignalReferencedAt)))
    .returning({
      id: posts.id,
      contentSignalReferencedAt: posts.contentSignalReferencedAt
    })

  const record = updated[0]
  if (!record) return null

  return serializeContentSignalPost(
    {
      ...candidate,
      contentSignalReferencedAt: record.contentSignalReferencedAt
    },
    targetLocale,
    includeContent
  )
}
