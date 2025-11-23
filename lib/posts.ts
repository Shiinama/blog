'use server'

import { and, count, desc, eq, like, or, type SQL } from 'drizzle-orm'

import { categories, postTranslations, posts, type PostStatus } from '@/drizzle/schema'
import { formatCategoryLabel } from '@/lib/categories'
import {
  type CategorySummary,
  type ExplorerFilterInput,
  type ExplorerPostsResponse,
  type PaginatedPostsResult,
  type PostDetails
} from '@/lib/posts/types'

import { createDb } from './db'

type LocalizablePost = {
  id: string
  title: string
  summary: string
  coverImageUrl?: string | null
  language?: string | null
}

export async function getPublishedPostsForSitemap() {
  const db = createDb()
  return db
    .select({
      id: posts.id
    })
    .from(posts)
    .where(eq(posts.status, 'PUBLISHED'))
    .orderBy(desc(posts.publishedAt))
}

export async function getVisibleCategoriesWithCounts() {
  const db = createDb()
  const rows = await db
    .select({
      id: categories.id,
      key: categories.key,
      sortOrder: categories.sortOrder,
      isVisible: categories.isVisible,
      postCount: count(posts.id)
    })
    .from(categories)
    .leftJoin(posts, and(eq(posts.categoryId, categories.id), eq(posts.status, 'PUBLISHED')))
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
  const targetLocale = locale?.trim().toLowerCase()
  const conditions = [eq(posts.status, 'PUBLISHED'), eq(categories.isVisible, true)]
  if (categoryId) {
    conditions.push(eq(posts.categoryId, categoryId))
  }
  if (search) {
    const likeSearch = `%${search}%`
    conditions.push(or(like(posts.title, likeSearch), like(posts.summary, likeSearch)) as any)
  }

  const offset = Math.max(0, (page - 1) * pageSize)

  const baseSelection = {
    id: posts.id,
    title: posts.title,
    summary: posts.summary,
    coverImageUrl: posts.coverImageUrl,
    categoryId: posts.categoryId,
    categoryKey: categories.key,
    publishedAt: posts.publishedAt,
    createdAt: posts.createdAt
  }

  const rows =
    targetLocale && targetLocale !== 'zh'
      ? await db
          .select({
            ...baseSelection,
            translationTitle: postTranslations.title,
            translationSummary: postTranslations.summary,
            translationCover: postTranslations.coverImageUrl
          })
          .from(posts)
          .leftJoin(categories, eq(posts.categoryId, categories.id))
          .leftJoin(
            postTranslations,
            and(eq(postTranslations.postId, posts.id), eq(postTranslations.locale, targetLocale))
          )
          .where(and(...conditions))
          .orderBy(desc(posts.publishedAt))
          .limit(pageSize)
          .offset(offset)
      : await db
          .select(baseSelection)
          .from(posts)
          .leftJoin(categories, eq(posts.categoryId, categories.id))
          .where(and(...conditions))
          .orderBy(desc(posts.publishedAt))
          .limit(pageSize)
          .offset(offset)

  const totalRows = await db
    .select({ value: count(posts.id) })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(and(...conditions))

  const normalized = rows.map((row) => {
    const label = formatCategoryLabel(row.categoryKey ?? undefined) || 'Uncategorized'
    const sortTimestamp = new Date(row.publishedAt ?? new Date()).getTime()
    const hasTranslation = Boolean(targetLocale && 'translationTitle' in row && row.translationTitle)
    return {
      ...row,
      title: hasTranslation ? ((row as any).translationTitle ?? row.title) : row.title,
      summary: hasTranslation ? ((row as any).translationSummary ?? row.summary) : row.summary,
      coverImageUrl: hasTranslation ? ((row as any).translationCover ?? row.coverImageUrl) : row.coverImageUrl,
      categoryLabel: label,
      sortTimestamp,
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
      }
    }
  })

  if (!post) {
    return null
  }

  if (!options?.includeDrafts && post.status !== 'PUBLISHED') {
    return null
  }

  const targetLocale = options?.locale?.trim().toLowerCase()
  const sourceLocale = (post.language ?? 'zh').trim().toLowerCase() || 'zh'

  if (targetLocale && targetLocale !== sourceLocale) {
    const existingTranslation = await db.query.postTranslations.findFirst({
      where: (translation, { eq }) => and(eq(translation.postId, post.id), eq(translation.locale, targetLocale))
    })

    if (existingTranslation) {
      return {
        ...post,
        title: existingTranslation.title,
        summary: existingTranslation.summary,
        content: existingTranslation.content,
        coverImageUrl: existingTranslation.coverImageUrl ?? post.coverImageUrl ?? null,
        language: targetLocale
      }
    }
  }

  return post
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
    conditions.push(or(like(posts.title, likeSearch), like(posts.summary, likeSearch)) as any)
  }
  const whereClause = conditions.length ? and(...conditions) : undefined

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

  const postQuery =
    targetLocale && targetLocale !== 'zh'
      ? db
          .select({
            ...baseSelection,
            translationTitle: postTranslations.title
          })
          .from(posts)
          .leftJoin(
            postTranslations,
            and(eq(postTranslations.postId, posts.id), eq(postTranslations.locale, targetLocale))
          )
          .orderBy(desc(posts.publishedAt))
          .limit(pageSize)
          .offset((page - 1) * pageSize)
      : db
          .select(baseSelection)
          .from(posts)
          .orderBy(desc(posts.publishedAt))
          .limit(pageSize)
          .offset((page - 1) * pageSize)

  const totalQuery = db.select({ value: count(posts.id) }).from(posts)

  const filteredPostQuery = whereClause ? postQuery.where(whereClause) : postQuery
  const filteredTotalQuery = whereClause ? totalQuery.where(whereClause) : totalQuery

  const [rows, totalResult] = await Promise.all([filteredPostQuery, filteredTotalQuery])

  return {
    posts: rows.map((row) => ({
      ...row,
      title: 'translationTitle' in row && row.translationTitle ? (row as any).translationTitle : row.title
    })),
    total: totalResult[0]?.value ?? 0,
    page,
    pageSize
  }
}

export async function getPostsForFeed(limit = 40) {
  const db = createDb()
  const rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      summary: posts.summary,
      content: posts.content,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
      language: posts.language
    })
    .from(posts)
    .where(eq(posts.status, 'PUBLISHED'))
    .orderBy(desc(posts.publishedAt))
    .limit(limit)

  return rows.map((row) => ({
    ...row,
    publishedAt: row.publishedAt ? new Date(row.publishedAt).toISOString() : null,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null
  }))
}
