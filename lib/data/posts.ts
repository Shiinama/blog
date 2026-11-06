import 'server-only'

import { and, asc, count, desc, eq, isNotNull, like, or, sql, type SQL } from 'drizzle-orm'
import { cache } from 'react'

import { categories, posts, postTranslations, type PostStatus } from '@/drizzle/schema'
import { getDb } from '@/lib/db'
import { requireAdmin } from '@/lib/session'

export const POSTS_PAGE_SIZE = 20

export const postSorts = ['newest', 'oldest', 'title'] as const
export type PostSort = (typeof postSorts)[number]

export type PostCard = {
  id: string
  title: string
  summary: string
  coverImageUrl: string | null
  categoryKey: string
  publishedAt: Date | null
}

export type LocalizedPost = PostCard & {
  content: string
  /** Locale the content is shown in. */
  locale: string
  /** Every locale this post can be read in (original + translations). */
  locales: string[]
  tags: string[]
  isMembersOnly: boolean
  updatedAt: Date
}

export type CategoryWithCount = { id: string; key: string; postCount: number }

/** Columns resolved for `locale`: the original when written in it, otherwise the translation. */
function localized(locale: string) {
  const isOriginal = sql`${posts.locale} = ${locale}`
  return {
    join: and(eq(postTranslations.postId, posts.id), eq(postTranslations.locale, locale)),
    available: or(eq(posts.locale, locale), isNotNull(postTranslations.postId)) as SQL,
    title: sql<string>`case when ${isOriginal} then ${posts.title} else ${postTranslations.title} end`,
    summary: sql<string>`case when ${isOriginal} then ${posts.summary} else ${postTranslations.summary} end`,
    content: sql<string>`case when ${isOriginal} then ${posts.content} else ${postTranslations.content} end`
  }
}

// ---------------------------------------------------------------------------
// Public, cached reads (published posts only)
// ---------------------------------------------------------------------------

export async function listPublishedPosts({
  locale,
  query,
  categoryKey,
  sort = 'newest',
  page = 1
}: {
  locale: string
  query?: string
  categoryKey?: string
  sort?: PostSort
  page?: number
}): Promise<{ items: PostCard[]; total: number; pageCount: number }> {
  const db = await getDb()
  const l = localized(locale)
  const where = and(
    eq(posts.status, 'PUBLISHED'),
    eq(categories.isVisible, true),
    l.available,
    categoryKey ? eq(categories.key, categoryKey) : undefined,
    query ? or(like(l.title, `%${query}%`), like(l.summary, `%${query}%`)) : undefined
  )
  const orderBy = sort === 'title' ? asc(l.title) : sort === 'oldest' ? asc(posts.publishedAt) : desc(posts.publishedAt)

  const [items, [{ total }]] = await Promise.all([
    db
      .select({
        id: posts.id,
        title: l.title,
        summary: l.summary,
        coverImageUrl: posts.coverImageUrl,
        categoryKey: categories.key,
        publishedAt: posts.publishedAt
      })
      .from(posts)
      .innerJoin(categories, eq(categories.id, posts.categoryId))
      .leftJoin(postTranslations, l.join)
      .where(where)
      .orderBy(orderBy)
      .limit(POSTS_PAGE_SIZE)
      .offset((page - 1) * POSTS_PAGE_SIZE),
    db
      .select({ total: count() })
      .from(posts)
      .innerJoin(categories, eq(categories.id, posts.categoryId))
      .leftJoin(postTranslations, l.join)
      .where(where)
  ])

  return { items, total, pageCount: Math.max(1, Math.ceil(total / POSTS_PAGE_SIZE)) }
}

export async function getVisibleCategories(locale: string): Promise<CategoryWithCount[]> {
  const db = await getDb()
  const l = localized(locale)
  return db
    .select({
      id: categories.id,
      key: categories.key,
      postCount: sql<number>`count(case when ${posts.status} = 'PUBLISHED' and ${l.available} then 1 end)`
    })
    .from(categories)
    .leftJoin(posts, eq(posts.categoryId, categories.id))
    .leftJoin(postTranslations, l.join)
    .where(eq(categories.isVisible, true))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder))
}

/** Deduped per request: `generateMetadata` and the page share one query. */
export const getPublishedPost = cache(async (id: string, locale: string): Promise<LocalizedPost | null> => {
  const db = await getDb()
  const post = await db.query.posts.findFirst({
    where: (post, { and, eq }) => and(eq(post.id, id), eq(post.status, 'PUBLISHED')),
    with: { category: { columns: { key: true } }, translations: true }
  })
  if (!post) return null

  const translation = post.translations.find((t) => t.locale === locale)
  if (post.locale !== locale && !translation) return null
  const source = translation ?? post

  return {
    id: post.id,
    title: source.title,
    summary: source.summary,
    content: source.content,
    coverImageUrl: post.coverImageUrl,
    categoryKey: post.category.key,
    publishedAt: post.publishedAt,
    updatedAt: source.updatedAt,
    locale,
    locales: [post.locale, ...post.translations.map((t) => t.locale)],
    tags: post.tags,
    isMembersOnly: post.isMembersOnly
  }
})

export async function getSitemapPosts(): Promise<{ id: string; locales: string[]; updatedAt: Date }[]> {
  const db = await getDb()
  const rows = await db.query.posts.findMany({
    where: (post, { eq }) => eq(post.status, 'PUBLISHED'),
    columns: { id: true, locale: true, updatedAt: true },
    with: { translations: { columns: { locale: true } } },
    orderBy: (post, { desc }) => desc(post.publishedAt)
  })
  return rows.map((row) => ({
    id: row.id,
    locales: [row.locale, ...row.translations.map((t) => t.locale)],
    updatedAt: row.updatedAt
  }))
}

export async function getFeedPosts(locale: string, limit = 50) {
  const db = await getDb()
  const l = localized(locale)
  return db
    .select({
      id: posts.id,
      title: l.title,
      summary: l.summary,
      tags: posts.tags,
      categoryKey: categories.key,
      publishedAt: posts.publishedAt
    })
    .from(posts)
    .innerJoin(categories, eq(categories.id, posts.categoryId))
    .leftJoin(postTranslations, l.join)
    .where(and(eq(posts.status, 'PUBLISHED'), l.available))
    .orderBy(desc(posts.publishedAt))
    .limit(limit)
}

// ---------------------------------------------------------------------------
// Admin reads (uncached, always fresh). Each one authorizes itself.
// ---------------------------------------------------------------------------

export const ADMIN_PAGE_SIZE = 20

export async function listPostsForAdmin({
  query,
  status,
  categoryId,
  page = 1
}: {
  query?: string
  status?: PostStatus
  categoryId?: string
  page?: number
}) {
  await requireAdmin()
  const db = await getDb()
  const where = and(
    status ? eq(posts.status, status) : undefined,
    categoryId ? eq(posts.categoryId, categoryId) : undefined,
    query ? or(like(posts.title, `%${query}%`), like(posts.summary, `%${query}%`)) : undefined
  )

  const [items, [{ total }]] = await Promise.all([
    db
      .select({
        id: posts.id,
        title: posts.title,
        locale: posts.locale,
        status: posts.status,
        categoryKey: categories.key,
        isMembersOnly: posts.isMembersOnly,
        signalClaimedAt: posts.signalClaimedAt,
        publishedAt: posts.publishedAt,
        updatedAt: posts.updatedAt
      })
      .from(posts)
      .innerJoin(categories, eq(categories.id, posts.categoryId))
      .where(where)
      .orderBy(sql`${posts.publishedAt} is null desc`, desc(posts.publishedAt), desc(posts.updatedAt))
      .limit(ADMIN_PAGE_SIZE)
      .offset((page - 1) * ADMIN_PAGE_SIZE),
    db.select({ total: count() }).from(posts).where(where)
  ])

  return { items, total, pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) }
}

export type AdminPostRow = Awaited<ReturnType<typeof listPostsForAdmin>>['items'][number]

export async function getPostForEditing(id: string) {
  await requireAdmin()
  const db = await getDb()
  return (
    (await db.query.posts.findFirst({
      where: (post, { eq }) => eq(post.id, id),
      with: { translations: true }
    })) ?? null
  )
}

export type EditablePost = NonNullable<Awaited<ReturnType<typeof getPostForEditing>>>

export async function listAllCategories() {
  await requireAdmin()
  const db = await getDb()
  return db
    .select({ id: categories.id, key: categories.key, isVisible: categories.isVisible })
    .from(categories)
    .orderBy(asc(categories.sortOrder))
}
