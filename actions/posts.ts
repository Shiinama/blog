'use server'

import { eq } from 'drizzle-orm'
import { refresh } from 'next/cache'
import { z } from 'zod'

import { postStatuses, posts, postTranslations } from '@/drizzle/schema'
import { redirect } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { getDb } from '@/lib/db'
import { extractSummary } from '@/lib/markdown/text'
import { requireAdmin } from '@/lib/session'
import { translateText } from '@/lib/translate'

import { fail, invalid, type ActionState } from './types'

const locale = z.enum(routing.locales)
const optionalDate = z
  .string()
  .optional()
  .transform((value) => (value ? new Date(value) : null))
  .refine((date) => date === null || !Number.isNaN(date.getTime()), 'invalidDate')

const postSchema = z.object({
  id: z.string().optional(),
  /** UI locale, for redirects (Server Actions have no root params). */
  uiLocale: locale,
  /** Locale being edited: the original's locale, or a translation's. */
  locale,
  title: z.string().trim().min(3, 'titleTooShort'),
  summary: z.string().trim().optional(),
  content: z.string().min(50, 'contentTooShort'),
  coverImageUrl: z.union([z.url(), z.literal('')]).optional(),
  categoryId: z.string().min(1, 'categoryRequired'),
  tags: z
    .string()
    .optional()
    .transform((value) => [
      ...new Set(
        (value ?? '')
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      )
    ]),
  status: z.enum(postStatuses),
  publishedAt: optionalDate,
  isMembersOnly: z.stringbool().default(false)
})

export async function savePost(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()
  const parsed = postSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return invalid(parsed.error, formData)

  const { id, uiLocale, locale, title, content, status, ...data } = parsed.data
  const summary = data.summary || extractSummary(content)
  const shared = {
    categoryId: data.categoryId,
    coverImageUrl: data.coverImageUrl || null,
    tags: data.tags,
    status,
    isMembersOnly: data.isMembersOnly,
    publishedAt: status === 'PUBLISHED' ? (data.publishedAt ?? new Date()) : data.publishedAt
  }
  const db = await getDb()

  if (!id) {
    const [created] = await db
      .insert(posts)
      .values({ ...shared, locale, title, summary, content })
      .returning({ id: posts.id })
    return redirect({ href: `/admin/posts/${created!.id}`, locale: uiLocale })
  }

  const existing = await db.query.posts.findFirst({ where: eq(posts.id, id), columns: { locale: true } })
  if (!existing) return fail('notFound', formData)

  if (existing.locale === locale) {
    await db
      .update(posts)
      .set({ ...shared, title, summary, content })
      .where(eq(posts.id, id))
  } else {
    await db.batch([
      db.update(posts).set(shared).where(eq(posts.id, id)),
      db
        .insert(postTranslations)
        .values({ postId: id, locale, title, summary, content })
        .onConflictDoUpdate({
          target: [postTranslations.postId, postTranslations.locale],
          set: { title, summary, content, updatedAt: new Date() }
        })
    ])
  }

  refresh()
  return { ok: true }
}

const idSchema = z.string().min(1).max(64)

export async function deletePost(id: string, uiLocale: string) {
  await requireAdmin()
  const db = await getDb()
  await db.delete(posts).where(eq(posts.id, idSchema.parse(id)))
  return redirect({ href: '/admin/posts', locale: locale.parse(uiLocale) })
}

const flagsSchema = z
  .object({
    status: z.enum(postStatuses),
    isMembersOnly: z.boolean(),
    signalClaimed: z.boolean(),
    publishedAt: z.coerce.date().nullable()
  })
  .partial()

/** Inline toggles from the admin table. */
export async function updatePostFlags(id: string, input: z.input<typeof flagsSchema>): Promise<ActionState> {
  await requireAdmin()
  const flags = flagsSchema.safeParse(input)
  if (!flags.success) return invalid(flags.error)

  const db = await getDb()
  const existing = await db.query.posts.findFirst({
    where: eq(posts.id, idSchema.parse(id)),
    columns: { publishedAt: true }
  })
  if (!existing) return fail('notFound')

  const { status, isMembersOnly, signalClaimed, publishedAt } = flags.data
  await db
    .update(posts)
    .set({
      ...(status && { status }),
      ...(status === 'PUBLISHED' && !existing.publishedAt && { publishedAt: new Date() }),
      ...(isMembersOnly !== undefined && { isMembersOnly }),
      ...(signalClaimed !== undefined && { signalClaimedAt: signalClaimed ? new Date() : null }),
      ...(publishedAt !== undefined && { publishedAt })
    })
    .where(eq(posts.id, id))

  refresh()
  return { ok: true }
}

/** Machine-translate the original into `target` and store it as a translation (overwrites an existing one). */
export async function translatePost(id: string, target: string): Promise<ActionState> {
  await requireAdmin()
  const to = locale.safeParse(target)
  if (!to.success) return fail('invalid')

  const db = await getDb()
  const post = await db.query.posts.findFirst({ where: eq(posts.id, idSchema.parse(id)) })
  if (!post) return fail('notFound')
  if (post.locale === to.data) return fail('sameLocale')

  try {
    const [title, summary, content] = await Promise.all(
      [post.title, post.summary, post.content].map((text) => translateText(text, post.locale, to.data))
    )
    await db
      .insert(postTranslations)
      .values({ postId: id, locale: to.data, title: title!, summary: summary!, content: content! })
      .onConflictDoUpdate({
        target: [postTranslations.postId, postTranslations.locale],
        set: { title: title!, summary: summary!, content: content!, updatedAt: new Date() }
      })
  } catch (error) {
    console.error('Translation failed', error)
    return fail('translationFailed')
  }

  refresh()
  return { ok: true }
}
