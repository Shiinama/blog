'use server'

import { z } from 'zod'

import { auth } from '@/lib/auth'
import { addCommentToPost, getCommentsForPost } from '@/lib/comments'

import type { CommentView } from '@/lib/comments'

const createCommentSchema = z.object({
  postId: z.string().min(1),
  content: z.string().trim().min(3).max(1200)
})

export async function loadCommentsAction(postId: string): Promise<CommentView[]> {
  if (!postId) return []
  return getCommentsForPost(postId)
}

export async function createCommentAction(input: { postId: string; content: string }): Promise<CommentView> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const parsed = createCommentSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error('Invalid payload')
  }

  try {
    return await addCommentToPost({
      postId: parsed.data.postId,
      userId: session.user.id,
      content: parsed.data.content
    })
  } catch (error) {
    console.error(error)
    throw new Error('Unable to save comment')
  }
}
