import 'server-only'

import { and, asc, eq, gte, isNotNull, isNull, notInArray, or, sql, type SQL } from 'drizzle-orm'

import { categories, posts, postTranslations } from '@/drizzle/schema'
import { getDb } from '@/lib/db'
import { postUrl } from '@/lib/metadata'

export type ContentSignalOptions = {
  locale: string
  /** Only posts updated within the last N days. */
  days?: number
  category?: string
  excludeCategories?: string[]
  /** `false` (default): claim the oldest unclaimed post. `true`: peek at an already-claimed one. */
  claimed?: boolean
  includeContent?: boolean
}

/**
 * Hands out one published post to an external content pipeline. Unless `claimed` is set,
 * the post is atomically marked so it is never handed out twice.
 */
export async function claimContentSignal({
  locale,
  days,
  category,
  excludeCategories = [],
  claimed = false,
  includeContent = true
}: ContentSignalOptions) {
  const db = await getDb()
  const isOriginal = sql`${posts.locale} = ${locale}`
  const conditions: (SQL | undefined)[] = [
    eq(posts.status, 'PUBLISHED'),
    or(eq(posts.locale, locale), isNotNull(postTranslations.postId)),
    claimed ? isNotNull(posts.signalClaimedAt) : isNull(posts.signalClaimedAt),
    days ? gte(posts.updatedAt, new Date(Date.now() - days * 86_400_000)) : undefined,
    category ? eq(categories.key, category) : undefined,
    excludeCategories.length ? notInArray(categories.key, excludeCategories) : undefined
  ]

  const [candidate] = await db
    .select({
      id: posts.id,
      title: sql<string>`case when ${isOriginal} then ${posts.title} else ${postTranslations.title} end`,
      summary: sql<string>`case when ${isOriginal} then ${posts.summary} else ${postTranslations.summary} end`,
      content: sql<string>`case when ${isOriginal} then ${posts.content} else ${postTranslations.content} end`,
      publishedAt: posts.publishedAt,
      updatedAt: posts.updatedAt,
      signalClaimedAt: posts.signalClaimedAt
    })
    .from(posts)
    .innerJoin(categories, eq(categories.id, posts.categoryId))
    .leftJoin(postTranslations, and(eq(postTranslations.postId, posts.id), eq(postTranslations.locale, locale)))
    .where(and(...conditions))
    .orderBy(asc(posts.updatedAt))
    .limit(1)

  if (!candidate) return null

  let signalClaimedAt = candidate.signalClaimedAt
  if (!claimed) {
    const [record] = await db
      .update(posts)
      .set({ signalClaimedAt: new Date(), updatedAt: candidate.updatedAt })
      .where(and(eq(posts.id, candidate.id), isNull(posts.signalClaimedAt)))
      .returning({ signalClaimedAt: posts.signalClaimedAt })
    // Lost a race with a concurrent claim.
    if (!record) return null
    signalClaimedAt = record.signalClaimedAt
  }

  return {
    id: candidate.id,
    title: candidate.title,
    summary: candidate.summary,
    ...(includeContent ? { content: candidate.content } : {}),
    url: postUrl(candidate.id, locale),
    publishedAt: candidate.publishedAt?.toISOString() ?? null,
    updatedAt: candidate.updatedAt.toISOString(),
    signalClaimedAt: signalClaimedAt?.toISOString() ?? null
  }
}
