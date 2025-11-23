import { NextResponse } from 'next/server'
import { z } from 'zod'

import { auth } from '@/lib/auth'
import { addCommentToPost, getCommentsForPost } from '@/lib/comments'

const createCommentSchema = z.object({
  postId: z.string().min(1),
  content: z.string().trim().min(3).max(1200)
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get('postId')

  if (!postId) {
    return NextResponse.json({ error: 'Missing postId' }, { status: 400 })
  }

  const comments = await getCommentsForPost(postId)
  return NextResponse.json({ comments })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const json = await request.json().catch(() => null)
  const parsed = createCommentSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  console.log(session.user, parsed.data)

  try {
    const comment = await addCommentToPost({
      postId: parsed.data.postId,
      userId: session.user.id,
      content: parsed.data.content
    })

    return NextResponse.json({ comment })
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : ''
    const status = message === 'Post not found' ? 404 : 400
    return NextResponse.json({ error: 'Unable to save comment' }, { status })
  }
}
