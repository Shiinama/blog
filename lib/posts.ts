'use server'

import { and, count, desc, eq, isNotNull, like, or, sql, type SQL } from 'drizzle-orm'

import { categories, postTranslations, posts, type PostStatus } from '@/drizzle/schema'
import { DEFAULT_LOCALE } from '@/i18n/routing'
import { formatCategoryLabel } from '@/lib/categories'
import {
  type CategorySummary,
  type ExplorerFilterInput,
  type ExplorerPostsResponse,
  type PaginatedPostsResult,
  type PostDetails
} from '@/lib/posts/types'

import { createDb } from './db'

function resolveLocale(locale?: string): string {
  const normalized = locale?.trim().toLowerCase()
  return normalized?.length ? normalized : DEFAULT_LOCALE
}

function buildLocaleAvailabilityCondition(targetLocale: string): SQL<unknown> {
  return or(eq(posts.language, targetLocale), isNotNull(postTranslations.id)) as SQL<unknown>
}

export async function getPublishedPostsForSitemap() {
  const db = createDb()
  const rows = await db.query.posts.findMany({
    where: (post, { eq }) => eq(post.status, 'PUBLISHED'),
    columns: {
      id: true,
      language: true
    },
    with: {
      translations: {
        columns: {
          locale: true
        }
      }
    },
    orderBy: (post, { desc }) => desc(post.publishedAt)
  })

  return rows.map(({ translations, ...post }) => {
    const localeSet = new Set([resolveLocale(post.language)])
    translations?.forEach((t) => {
      const locale = t?.locale?.trim().toLowerCase()
      if (locale) localeSet.add(locale)
    })
    return { id: post.id, locales: Array.from(localeSet) }
  })
}

export async function getVisibleCategoriesWithCounts(locale?: string) {
  const db = createDb()
  const targetLocale = resolveLocale(locale)
  const availabilityCondition = buildLocaleAvailabilityCondition(targetLocale)

  const rows = await db
    .select({
      id: categories.id,
      key: categories.key,
      sortOrder: categories.sortOrder,
      isVisible: categories.isVisible,
      postCount: sql<number>`sum(case when ${posts.id} is not null and ${availabilityCondition} then 1 else 0 end)`
    })
    .from(categories)
    .leftJoin(posts, and(eq(posts.categoryId, categories.id), eq(posts.status, 'PUBLISHED')))
    .leftJoin(postTranslations, and(eq(postTranslations.postId, posts.id), eq(postTranslations.locale, targetLocale)))
    .where(eq(categories.isVisible, true))
    .groupBy(categories.id)
    .orderBy(categories.sortOrder)

  return rows
}

export async function getExplorerPosts({
  search,
  categoryId,
  sortBy = 'newest',
  locale,
  page = 1,
  pageSize = 20
}: ExplorerFilterInput = {}): Promise<ExplorerPostsResponse> {
  const db = createDb()
  const targetLocale = resolveLocale(locale)
  const availabilityCondition = buildLocaleAvailabilityCondition(targetLocale)
  const conditions: SQL<unknown>[] = [
    eq(posts.status, 'PUBLISHED'),
    eq(categories.isVisible, true),
    availabilityCondition
  ]
  if (categoryId) {
    conditions.push(eq(posts.categoryId, categoryId))
  }
  if (search) {
    const likeSearch = `%${search}%`
    conditions.push(or(like(posts.title, likeSearch), like(posts.summary, likeSearch)) as SQL<unknown>)
  }

  const offset = Math.max(0, (page - 1) * pageSize)

  const baseSelection = {
    id: posts.id,
    title: posts.title,
    summary: posts.summary,
    coverImageUrl: posts.coverImageUrl,
    categoryId: posts.categoryId,
    categoryKey: categories.key,
    language: posts.language,
    publishedAt: posts.publishedAt,
    createdAt: posts.createdAt
  }

  const translationJoin = and(eq(postTranslations.postId, posts.id), eq(postTranslations.locale, targetLocale))

  const rows = await db
    .select({
      ...baseSelection,
      translationTitle: postTranslations.title,
      translationSummary: postTranslations.summary,
      translationCover: postTranslations.coverImageUrl
    })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .leftJoin(postTranslations, translationJoin)
    .where(and(...conditions))
    .orderBy(desc(posts.publishedAt))
    .limit(pageSize)
    .offset(offset)

  const totalRows = await db
    .select({ value: count(posts.id) })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .leftJoin(postTranslations, translationJoin)
    .where(and(...conditions))

  const normalized = rows.map((row) => {
    const hasTranslation = targetLocale !== (row.language ?? DEFAULT_LOCALE) && row.translationTitle
    return {
      ...row,
      title: hasTranslation ? (row.translationTitle ?? row.title) : row.title,
      summary: hasTranslation ? (row.translationSummary ?? row.summary) : row.summary,
      coverImageUrl: hasTranslation ? (row.translationCover ?? row.coverImageUrl) : row.coverImageUrl,
      categoryLabel: formatCategoryLabel(row.categoryKey ?? undefined) || 'Uncategorized',
      sortTimestamp: new Date(row.publishedAt ?? new Date()).getTime(),
      publishedAt: row.publishedAt ? new Date(row.publishedAt).toISOString() : null,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null
    }
  })

  const sorted = normalized.sort((a, b) => {
    switch (sortBy) {
      case 'alphabetical':
        return a.title.localeCompare(b.title)
      case 'oldest':
        return a.sortTimestamp - b.sortTimestamp
      case 'newest':
      default:
        return b.sortTimestamp - a.sortTimestamp
    }
  })

  return { posts: sorted, total: totalRows[0]?.value ?? 0 }
}

export async function getPostById(
  id: string,
  options?: { includeDrafts?: boolean; locale?: string }
): Promise<PostDetails | null> {
  const db = createDb()
  const post = await db.query.posts.findFirst({
    where: (post, { eq }) => eq(post.id, id),
    with: {
      category: {
        columns: {
          id: true,
          key: true,
          sortOrder: true,
          isVisible: true
        }
      },
      author: {
        columns: {
          id: true,
          name: true,
          email: true
        }
      },
      translations: {
        columns: {
          locale: true,
          title: true,
          summary: true,
          content: true,
          coverImageUrl: true
        }
      }
    }
  })

  if (!post) {
    return null
  }

  const { translations = [], ...basePost } = post

  if (!options?.includeDrafts && basePost.status !== 'PUBLISHED') {
    return null
  }

  const localeSet = new Set([resolveLocale(basePost.language)])
  translations?.forEach((t) => {
    const locale = t?.locale?.trim().toLowerCase()
    if (locale) localeSet.add(locale)
  })
  const availableLocales = Array.from(localeSet)

  const targetLocale = options?.locale ? resolveLocale(options.locale) : undefined
  const sourceLocale = resolveLocale(basePost.language ?? 'zh')

  if (targetLocale && targetLocale !== sourceLocale) {
    const translation = translations.find((t) => t?.locale?.trim().toLowerCase() === targetLocale)
    if (translation) {
      return {
        ...basePost,
        title: translation.title,
        summary: translation.summary,
        content: translation.content,
        coverImageUrl: translation.coverImageUrl ?? basePost.coverImageUrl ?? null,
        language: targetLocale,
        availableLocales
      }
    }
    if (!options?.includeDrafts) return null
  }

  return {
    ...basePost,
    availableLocales
  }
}

export async function getAllCategories(): Promise<CategorySummary[]> {
  const db = createDb()
  return db.query.categories.findMany({
    orderBy: (category, { asc }) => asc(category.sortOrder),
    columns: {
      id: true,
      key: true,
      sortOrder: true,
      isVisible: true
    }
  })
}

interface PaginatedPostOptions {
  page?: number
  pageSize?: number
  search?: string
  status?: PostStatus | 'all'
  categoryId?: string
  locale?: string
}

export async function getPaginatedPosts({
  page = 1,
  pageSize = 20,
  search,
  status = 'all',
  categoryId,
  locale
}: PaginatedPostOptions): Promise<PaginatedPostsResult> {
  const db = createDb()
  const targetLocale = locale?.trim().toLowerCase()
  const conditions: SQL<unknown>[] = []
  if (status !== 'all') {
    conditions.push(eq(posts.status, status))
  }
  if (categoryId) {
    conditions.push(eq(posts.categoryId, categoryId))
  }
  if (search) {
    const likeSearch = `%${search}%`
    conditions.push(or(like(posts.title, likeSearch), like(posts.summary, likeSearch)) as SQL<unknown>)
  }

  const baseSelection = {
    id: posts.id,
    title: posts.title,
    status: posts.status,
    publishedAt: posts.publishedAt,
    updatedAt: posts.updatedAt,
    createdAt: posts.createdAt,
    isSubscriptionOnly: posts.isSubscriptionOnly,
    categoryId: posts.categoryId
  }

  const needsLocaleTranslation = Boolean(targetLocale && targetLocale !== 'zh')
  if (needsLocaleTranslation && targetLocale) {
    conditions.push(buildLocaleAvailabilityCondition(targetLocale))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined
  const translationJoin =
    needsLocaleTranslation && targetLocale
      ? and(eq(postTranslations.postId, posts.id), eq(postTranslations.locale, targetLocale))
      : undefined

  const selection = translationJoin ? { ...baseSelection, translationTitle: postTranslations.title } : baseSelection

  const basePostQuery = db.select(selection).from(posts)
  const postQuery = translationJoin ? basePostQuery.leftJoin(postTranslations, translationJoin) : basePostQuery

  const baseTotalQuery = db.select({ value: count(posts.id) }).from(posts)
  const totalQuery = translationJoin ? baseTotalQuery.leftJoin(postTranslations, translationJoin) : baseTotalQuery

  const [rows, totalResult] = await Promise.all([
    (whereClause ? postQuery.where(whereClause) : postQuery)
      .orderBy(desc(posts.publishedAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    whereClause ? totalQuery.where(whereClause) : totalQuery
  ])

  return {
    posts: rows.map((row) => ({
      ...row,
      title: 'translationTitle' in row && row.translationTitle ? row.translationTitle : String(row.title)
    })),
    total: totalResult[0]?.value ?? 0,
    page,
    pageSize
  }
}

export async function getPostsForFeed(limit = 40, locale?: string) {
  const db = createDb()
  const targetLocale = resolveLocale(locale)
  const availabilityCondition = buildLocaleAvailabilityCondition(targetLocale)
  const translationJoin = and(eq(postTranslations.postId, posts.id), eq(postTranslations.locale, targetLocale))
  const baseSelection = {
    id: posts.id,
    title: posts.title,
    summary: posts.summary,
    content: posts.content,
    publishedAt: posts.publishedAt,
    createdAt: posts.createdAt,
    language: posts.language
  }

  const rows = await db
    .select({
      ...baseSelection,
      translationTitle: postTranslations.title,
      translationSummary: postTranslations.summary,
      translationContent: postTranslations.content
    })
    .from(posts)
    .leftJoin(postTranslations, translationJoin)
    .where(and(eq(posts.status, 'PUBLISHED'), availabilityCondition))
    .orderBy(desc(posts.publishedAt))
    .limit(limit)

  return rows.map((row) => {
    const translated = targetLocale !== (row.language ?? DEFAULT_LOCALE) && row.translationTitle
    return {
      ...row,
      title: translated ? (row.translationTitle ?? row.title) : row.title,
      summary: translated ? (row.translationSummary ?? row.summary) : row.summary,
      content: translated ? (row.translationContent ?? row.content) : row.content,
      language: translated ? targetLocale : row.language,
      publishedAt: row.publishedAt ? new Date(row.publishedAt).toISOString() : null,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null
    }
  })
}
