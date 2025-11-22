'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { postTranslations, posts, PostStatus, postStatusEnum } from '@/drizzle/schema'
import { auth } from '@/lib/auth'
import { createDb, DB } from '@/lib/db'
import { getOrCreatePostTranslation } from '@/lib/posts/translation'
import { calculateReadingTime, extractSummary, normalizeSlug } from '@/lib/posts/utils'

type PostFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Record<string, string[]>
}

async function assertAdmin() {
  const session = await auth()

  if (!session?.user || !process.env.NEXT_PUBLIC_ADMIN_ID?.split(',').includes(session?.user?.id ?? '')) {
    throw new Error('Unauthorized')
  }

  return session.user
}

const postStatusValues = [...postStatusEnum] as [PostStatus, ...PostStatus[]]

const postFormSchema = z.object({
  postId: z.string().optional(),
  title: z.string().min(3, '标题至少 3 个字符'),
  slug: z.string().min(1, 'Slug 不能为空'),
  summary: z.string().optional(),
  content: z.string().min(50, '内容需要至少 50 个字符'),
  coverImageUrl: z.string().url('封面链接格式不正确').optional().or(z.literal('')),
  categoryId: z.string().min(1, '请选择分类'),
  tags: z.string().optional(),
  status: z.enum(postStatusValues).default('DRAFT'),
  sortOrder: z.coerce.number().optional(),
  publishedAt: z.string().optional(),
  language: z.string().optional(),
  editorLocale: z.string().optional(),
  isSubscriptionOnly: z.coerce.boolean().default(false)
})

function formatFieldErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {}
  const fieldErrors = error.flatten().fieldErrors
  Object.entries(fieldErrors).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      const messages = value.filter(Boolean) as string[]
      if (messages.length) {
        formatted[key] = messages
      }
    }
  })
  return formatted
}

function parseTags(value?: string) {
  if (!value) return []
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

async function upsertPost(db: DB, data: z.infer<typeof postFormSchema>, userId: string) {
  const slug = normalizeSlug(data.slug)
  const summary = data.summary?.trim() || extractSummary(data.content)
  const coverImageUrl = data.coverImageUrl?.trim() ? data.coverImageUrl.trim() : null
  const tags = parseTags(data.tags)
  const readingTime = calculateReadingTime(data.content)
  const language = data.language?.trim() || 'zh'
  const sortOrder = Number.isFinite(data.sortOrder) ? (data.sortOrder as number) : 0
  const isSubscriptionOnly = Boolean(data.isSubscriptionOnly)

  const publishedAt =
    data.status === 'PUBLISHED'
      ? (() => {
          const parsedDate = data.publishedAt ? new Date(data.publishedAt) : new Date()
          return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate
        })()
      : null

  const baseData = {
    title: data.title.trim(),
    slug,
    summary,
    content: data.content,
    coverImageUrl,
    categoryId: data.categoryId,
    status: data.status,
    isSubscriptionOnly,
    tags,
    readingTime,
    language,
    sortOrder,
    authorId: userId,
    publishedAt
  }

  if (data.postId) {
    const existing = await db.query.posts.findFirst({
      where: (post, { eq }) => eq(post.id, data.postId!)
    })

    if (!existing) {
      throw new Error('Post not found')
    }

    const updatedPublishedAt =
      data.status === 'PUBLISHED' ? (baseData.publishedAt ?? existing.publishedAt ?? new Date()) : null

    const updated = await db
      .update(posts)
      .set({
        ...baseData,
        publishedAt: updatedPublishedAt,
        updatedAt: new Date()
      })
      .where(eq(posts.id, data.postId))
      .returning()

    return updated[0]!
  }

  const created = await db
    .insert(posts)
    .values({
      ...baseData,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .returning()

  return created[0]!
}

function revalidatePostRoutes(postId: string) {
  revalidatePath('/')
  revalidatePath(`/content/${postId}`)
  revalidatePath('/admin/posts')
}

export async function savePostAction(_prevState: PostFormState, formData: FormData): Promise<PostFormState> {
  const db = createDb()
  try {
    const user = await assertAdmin()
    const entries = Object.fromEntries(formData.entries()) as Record<string, string>
    const payload = postFormSchema.safeParse(entries)

    if (!payload.success) {
      return {
        status: 'error',
        errors: formatFieldErrors(payload.error),
        message: '请检查表单信息'
      }
    }

    const editorLocale = (payload.data.editorLocale || payload.data.language || '').trim().toLowerCase()

    if (payload.data.postId && editorLocale) {
      const existing = await db.query.posts.findFirst({
        where: (post, { eq }) => eq(post.id, payload.data.postId!)
      })

      if (!existing) {
        throw new Error('Post not found')
      }

      const sourceLocale = (existing.language ?? 'zh').trim().toLowerCase() || 'zh'

      if (editorLocale !== sourceLocale) {
        const summary = payload.data.summary?.trim() || extractSummary(payload.data.content)
        const coverImageUrl = payload.data.coverImageUrl?.trim() ? payload.data.coverImageUrl.trim() : null
        const title = payload.data.title.trim()
        const content = payload.data.content
        const now = new Date()

        const existingTranslation = await db.query.postTranslations.findFirst({
          where: (translation, { eq }) => and(eq(translation.postId, existing.id), eq(translation.locale, editorLocale))
        })

        if (existingTranslation) {
          await db
            .update(postTranslations)
            .set({
              title,
              summary,
              content,
              coverImageUrl,
              updatedAt: now
            })
            .where(and(eq(postTranslations.postId, existing.id), eq(postTranslations.locale, editorLocale)))
        } else {
          await db.insert(postTranslations).values({
            postId: existing.id,
            locale: editorLocale,
            title,
            summary,
            content,
            coverImageUrl,
            createdAt: now,
            updatedAt: now
          })
        }

        revalidatePostRoutes(existing.id)

        return {
          status: 'success',
          message: '翻译已保存'
        }
      }
    }

    const post = await upsertPost(db, payload.data, user.id)

    revalidatePostRoutes(post.id)

    return {
      status: 'success',
      message: '文章已保存'
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        status: 'error',
        errors: formatFieldErrors(error),
        message: '请检查表单信息'
      }
    }

    if (error instanceof Error && /UNIQUE constraint failed: posts\.slug/i.test(error.message)) {
      return {
        status: 'error',
        errors: {
          slug: ['Slug 已存在，请更换一个唯一的地址']
        }
      }
    }

    console.error('Failed to save post', error)
    return {
      status: 'error',
      message: error instanceof Error ? error.message : '保存失败，请稍后重试'
    }
  }
}

export async function deletePostAction(postId: string) {
  await assertAdmin()
  const db = createDb()
  const deleted = await db.delete(posts).where(eq(posts.id, postId)).returning({ id: posts.id })

  if (!deleted[0]) {
    return { status: 'error', message: '文章不存在' }
  }

  revalidatePostRoutes(deleted[0].id)

  return { status: 'success' }
}

export async function togglePostStatusAction(postId: string, status: PostStatus) {
  await assertAdmin()
  const db = createDb()
  const existing = await db.query.posts.findFirst({
    where: (post, { eq }) => eq(post.id, postId)
  })

  if (!existing) {
    return { status: 'error', message: '文章不存在' }
  }

  const publishedAt = status === 'PUBLISHED' ? (existing.publishedAt ?? new Date()) : null

  const updated = await db
    .update(posts)
    .set({
      status,
      publishedAt,
      updatedAt: new Date()
    })
    .where(eq(posts.id, postId))
    .returning({ id: posts.id, status: posts.status })

  const updatedPost = updated[0]
  if (!updatedPost) {
    return { status: 'error', message: '文章不存在' }
  }

  revalidatePostRoutes(updatedPost.id)

  return { status: 'success', statusValue: updatedPost.status }
}

export async function updatePostPublishedAtAction(postId: string, publishedAt?: string | null) {
  await assertAdmin()
  const db = createDb()
  const existing = await db.query.posts.findFirst({
    where: (post, { eq }) => eq(post.id, postId)
  })

  if (!existing) {
    return { status: 'error', message: '文章不存在' }
  }

  let parsedDate: Date | null = null
  if (publishedAt) {
    const candidate = new Date(publishedAt)
    if (Number.isNaN(candidate.getTime())) {
      return { status: 'error', message: 'Invalid published time' }
    }
    parsedDate = candidate
  }

  const updated = await db
    .update(posts)
    .set({
      publishedAt: parsedDate,
      updatedAt: new Date()
    })
    .where(eq(posts.id, postId))
    .returning({ id: posts.id })

  if (!updated[0]) {
    return { status: 'error', message: '文章不存在' }
  }

  revalidatePostRoutes(updated[0].id)

  return { status: 'success' }
}

export async function updatePostSubscriptionAction(postId: string, isSubscriptionOnly: boolean) {
  await assertAdmin()
  const db = createDb()
  const updated = await db
    .update(posts)
    .set({
      isSubscriptionOnly,
      updatedAt: new Date()
    })
    .where(eq(posts.id, postId))
    .returning({ id: posts.id, isSubscriptionOnly: posts.isSubscriptionOnly })

  const record = updated[0]
  if (!record) {
    return { status: 'error', message: '文章不存在' }
  }

  revalidatePostRoutes(record.id)

  return { status: 'success', value: record.isSubscriptionOnly }
}

export async function translatePostAction(postId: string, targetLocale: string) {
  await assertAdmin()
  const db = createDb()
  const trimmedLocale = targetLocale?.trim().toLowerCase()

  if (!trimmedLocale) {
    return { status: 'error', message: '请选择目标语言' }
  }

  const post = await db.query.posts.findFirst({
    where: (post, { eq }) => eq(post.id, postId)
  })

  if (!post) {
    return { status: 'error', message: '文章不存在' }
  }

  const sourceLocale = (post.language ?? 'en').trim().toLowerCase() || 'en'
  if (sourceLocale === trimmedLocale) {
    return { status: 'error', message: '目标语言与原文相同' }
  }

  try {
    const translation = await getOrCreatePostTranslation(
      {
        postId: post.id,
        content: post.content,
        targetLocale: trimmedLocale,
        sourceLocale,
        originalTitle: post.title,
        originalSummary: post.summary,
        coverImageUrl: post.coverImageUrl ?? null
      },
      true
    )

    if (!translation) {
      return { status: 'error', message: '翻译失败，请稍后重试' }
    }

    revalidatePostRoutes(post.id)

    return { status: 'success', translation }
  } catch (error) {
    console.error('Failed to translate post', error)
    return {
      status: 'error',
      message: error instanceof Error ? error.message : '翻译失败，请稍后重试'
    }
  }
}
