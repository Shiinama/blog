'use server'

import { desc, eq } from 'drizzle-orm'

import { comments, users } from '@/drizzle/schema'
import { createDb } from '@/lib/db'

export type CommentView = {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string | null
  }
}

function mapRowToComment(row: {
  id: string
  content: string
  createdAt: Date | number | null
  userId: string
  userName: string | null
  userEmail: string | null
}): CommentView {
  const created = row.createdAt instanceof Date ? row.createdAt : row.createdAt ? new Date(row.createdAt) : new Date()

  return {
    id: row.id,
    content: row.content,
    createdAt: created.toISOString(),
    user: {
      id: row.userId,
      name: row.userName,
      email: row.userEmail
    }
  }
}

export async function getCommentsForPost(postId: string): Promise<CommentView[]> {
  if (!postId) return []

  const db = createDb()
  const rows = await db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      userId: comments.userId,
      userName: users.name,
      userEmail: users.email
    })
    .from(comments)
    .leftJoin(users, eq(users.id, comments.userId))
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.createdAt))

  return rows.map(mapRowToComment)
}

export async function addCommentToPost({
  postId,
  userId,
  content
}: {
  postId: string
  userId: string
  content: string
}): Promise<CommentView> {
  const trimmedContent = content.trim()
  if (!trimmedContent) {
    throw new Error('Empty content')
  }

  const db = createDb()

  const id = crypto.randomUUID()
  await db.insert(comments).values({
    id,
    postId,
    userId,
    content: trimmedContent
  })

  const [row] = await db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      userId: comments.userId,
      userName: users.name,
      userEmail: users.email
    })
    .from(comments)
    .leftJoin(users, eq(users.id, comments.userId))
    .where(eq(comments.id, id))
    .limit(1)

  if (!row) {
    throw new Error('Failed to load comment')
  }

  return mapRowToComment(row)
}
