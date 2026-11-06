'use server'

import { and, eq } from 'drizzle-orm'
import { refresh } from 'next/cache'
import { z } from 'zod'

import { comments, posts } from '@/drizzle/schema'
import { getDb } from '@/lib/db'
import { getViewer } from '@/lib/session'

import { fail, invalid, type ActionState } from './types'

const commentSchema = z.object({
  postId: z.string().min(1).max(64),
  content: z.string().trim().min(3).max(1200)
})

export async function createComment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const viewer = await getViewer()
  if (!viewer) return fail('unauthorized', formData)

  const parsed = commentSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return invalid(parsed.error, formData)

  const db = await getDb()
  const post = await db.query.posts.findFirst({
    where: and(eq(posts.id, parsed.data.postId), eq(posts.status, 'PUBLISHED')),
    columns: { id: true }
  })
  if (!post) return fail('notFound', formData)

  await db.insert(comments).values({ postId: post.id, userId: viewer.id, content: parsed.data.content })
  refresh()
  return { ok: true }
}
