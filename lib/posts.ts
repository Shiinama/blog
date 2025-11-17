'use server'

import { and, count, desc, eq, like, or, type SQL } from 'drizzle-orm'

import { categories, createDb, posts, type Category, type Post, type PostStatus, users } from '@/lib/db'

import { formatCategoryLabel } from './categories'
import { normalizeSlug } from './posts/utils'

export type CategorySummary = Pick<Category, 'id' | 'key' | 'sortOrder' | 'isVisible'>
export type SidebarPost = Pick<Post, 'id' | 'title' | 'slug' | 'sortOrder' | 'publishedAt' | 'createdAt' | 'status'>
export type ExplorerSortOption = 'newest' | 'oldest' | 'alphabetical'

export interface ExplorerFilterInput {
  search?: string
  categoryId?: string
  sortBy?: ExplorerSortOption
}

export type ExplorerPostRecord = {
  id: string
  slug: string
  title: string
  summary: string | null
  coverImageUrl: string | null
  categoryId: string | null
  categoryKey: string | null
  categoryLabel: string
  publishedAt: string | null
  createdAt: string | null
  sortTimestamp: number
}

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
        orderBy: (post, { asc, desc }) => [asc(post.sortOrder), desc(post.publishedAt), desc(post.createdAt)]
      }
    }
  })
}

export async function getSidebarPosts(categoryId: string) {
  const db = createDb()
  return db.query.posts.findMany({
    where: (post, { and, eq }) => and(eq(post.categoryId, categoryId), eq(post.status, 'PUBLISHED')),
    orderBy: (post, { asc, desc }) => [asc(post.sortOrder), desc(post.publishedAt), desc(post.createdAt)],
    columns: {
      id: true,
      title: true,
      slug: true,
      sortOrder: true,
      publishedAt: true,
      createdAt: true,
      status: true
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
    conditions.push(or(like(posts.title, likeSearch), like(posts.summary, likeSearch)))
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
    .orderBy(desc(posts.publishedAt), desc(posts.createdAt))

  const normalized = rows.map((row) => {
    const label = formatCategoryLabel(row.categoryKey ?? undefined) || 'Uncategorized'
    const sortTimestamp = new Date(row.publishedAt ?? row.createdAt ?? new Date()).getTime()
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

export async function getPostBySlug(slug: string, options?: { includeDrafts?: boolean }) {
  const db = createDb()
  const cleanedSlug = normalizeSlug(slug)
  const post = await db.query.posts.findFirst({
    where: (post, { eq }) => eq(post.slug, cleanedSlug),
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

export async function getAllCategories() {
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
}: PaginatedPostOptions) {
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
    conditions.push(or(like(posts.title, likeSearch), like(posts.summary, likeSearch)))
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

  let filteredPostQuery = postQuery
  let filteredTotalQuery = totalQuery
  if (whereClause) {
    filteredPostQuery = filteredPostQuery.where(whereClause)
    filteredTotalQuery = filteredTotalQuery.where(whereClause)
  }

  const [rows, totalResult] = await Promise.all([filteredPostQuery, filteredTotalQuery])

  const formattedPosts = rows.map(({ post, category, author }) => ({
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
