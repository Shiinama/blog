'use server'

import { and, count, desc, eq, like, or, type SQL } from 'drizzle-orm'

import { categories, posts, type PostStatus, users } from '@/drizzle/schema'
import { formatCategoryLabel } from '@/lib/categories'
import {
  type CategorySummary,
  type ExplorerFilterInput,
  type ExplorerPostRecord,
  type PaginatedPostListItem,
  type PaginatedPostsResult,
  type PostDetails
} from '@/lib/posts/types'

import { createDb } from './db'

export async function getVisibleCategoriesWithPosts() {
  const db = createDb()
  return db.query.categories.findMany({
    where: (category, { eq }) => eq(category.isVisible, true),
    orderBy: (category, { asc }) => asc(category.sortOrder),
    with: {
      posts: {
        where: (post, { eq }) => eq(post.status, 'PUBLISHED'),
        columns: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          coverImageUrl: true,
          publishedAt: true,
          createdAt: true
        },
        orderBy: (post, { desc }) => [desc(post.publishedAt)]
      }
    }
  })
}

export async function getExplorerPosts({ search, categoryId, sortBy = 'newest' }: ExplorerFilterInput = {}): Promise<
  ExplorerPostRecord[]
> {
  const db = createDb()
  const conditions = [eq(posts.status, 'PUBLISHED'), eq(categories.isVisible, true)]
  if (categoryId) {
    conditions.push(eq(posts.categoryId, categoryId))
  }
  if (search) {
    const likeSearch = `%${search}%`
    conditions.push(or(like(posts.title, likeSearch), like(posts.summary, likeSearch)) as any)
  }

  const rows = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      summary: posts.summary,
      coverImageUrl: posts.coverImageUrl,
      categoryId: posts.categoryId,
      categoryKey: categories.key,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt
    })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(desc(posts.publishedAt))

  const normalized = rows.map((row) => {
    const label = formatCategoryLabel(row.categoryKey ?? undefined) || 'Uncategorized'
    const sortTimestamp = new Date(row.publishedAt ?? new Date()).getTime()
    return {
      ...row,
      categoryLabel: label,
      sortTimestamp,
      publishedAt: row.publishedAt ? new Date(row.publishedAt).toISOString() : null,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null
    }
  })

  return normalized.sort((a, b) => {
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
}

export async function getPostById(id: string, options?: { includeDrafts?: boolean }): Promise<PostDetails | null> {
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
}

export async function getPaginatedPosts({
  page = 1,
  pageSize = 20,
  search,
  status = 'all',
  categoryId
}: PaginatedPostOptions): Promise<PaginatedPostsResult> {
  const db = createDb()
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

  const postQuery = db
    .select({
      post: posts,
      category: {
        id: categories.id,
        key: categories.key,
        sortOrder: categories.sortOrder,
        isVisible: categories.isVisible
      },
      author: {
        id: users.id,
        name: users.name
      }
    })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .leftJoin(users, eq(posts.authorId, users.id))
    .orderBy(desc(posts.updatedAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  const totalQuery = db.select({ value: count(posts.id) }).from(posts)

  const filteredPostQuery = whereClause ? postQuery.where(whereClause) : postQuery
  const filteredTotalQuery = whereClause ? totalQuery.where(whereClause) : totalQuery

  const [rows, totalResult] = await Promise.all([filteredPostQuery, filteredTotalQuery])

  const formattedPosts: PaginatedPostListItem[] = rows.map(({ post, category, author }) => ({
    ...post,
    category,
    author
  }))

  return {
    posts: formattedPosts,
    total: totalResult[0]?.value ?? 0,
    page,
    pageSize
  }
}

export async function getAllPublishedPostSlugs() {
  const db = createDb()
  const rows = await db.select({ slug: posts.slug }).from(posts).where(eq(posts.status, 'PUBLISHED'))

  return rows.map((row) => row.slug)
}
