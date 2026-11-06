import 'server-only'

import { desc, eq } from 'drizzle-orm'

import { comments, users } from '@/drizzle/schema'
import { getDb } from '@/lib/db'

export type CommentView = {
  id: string
  content: string
  createdAt: Date
  authorName: string | null
}

/** Public comments for a post. Only the author's display name leaves the server. */
export async function getComments(postId: string): Promise<CommentView[]> {
  const db = await getDb()
  return db
    .select({ id: comments.id, content: comments.content, createdAt: comments.createdAt, authorName: users.name })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.userId))
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.createdAt))
}
