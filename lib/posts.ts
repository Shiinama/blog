import { and, count, desc, eq, like, or } from 'drizzle-orm'

import {
  categories,
  createDb,
  posts,
  type Category,
  type Post,
  type PostStatus,
  users
} from '@/lib/db'

import { normalizeSlug } from './posts/utils'

export type CategorySummary = Pick<
  Category,
  'id' | 'name' | 'slug' | 'i18nKey' | 'description' | 'sortOrder' | 'isVisible'
>
export type SidebarPost = Pick<Post, 'id' | 'title' | 'slug' | 'sortOrder' | 'publishedAt' | 'createdAt' | 'status'>

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

export async function getPostBySlug(slug: string, options?: { includeDrafts?: boolean }) {
  const db = createDb()
  const cleanedSlug = normalizeSlug(slug)
  const post = await db.query.posts.findFirst({
    where: (post, { eq }) => eq(post.slug, cleanedSlug),
    with: {
      category: {
        columns: {
          id: true,
          name: true,
          slug: true,
          i18nKey: true,
          description: true,
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
      name: true,
      slug: true,
      i18nKey: true,
      description: true,
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
  const conditions = []
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
        name: categories.name,
        slug: categories.slug,
        i18nKey: categories.i18nKey,
        description: categories.description,
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

  const [rows, totalResult] = await Promise.all([
    whereClause ? postQuery.where(whereClause) : postQuery,
    whereClause ? totalQuery.where(whereClause) : totalQuery
  ])

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
  const rows = await db
    .select({ slug: posts.slug })
    .from(posts)
    .where(eq(posts.status, 'PUBLISHED'))

  return rows.map((row) => row.slug)
}
