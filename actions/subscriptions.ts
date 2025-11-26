'use server'

import { and, desc, eq, gt, lt } from 'drizzle-orm'
import { z } from 'zod'

import { orders, products, subscriptions, type Currency } from '@/drizzle/schema'
import { auth } from '@/lib/auth'
import { createDb, type DB } from '@/lib/db'

import type { GrantSubscriptionState } from './subscriptions/state'

const PRODUCT_NAME = 'Annual Membership (1 year)'
const PRODUCT_PRICE = 200
const PRODUCT_CURRENCY: Currency = 'CNY'

const grantSubscriptionSchema = z.object({
  userId: z.string().min(1, { message: '请输入用户 ID' }),
  note: z.string().max(200, { message: '备注请少于 200 个字符' }).optional().or(z.literal('')),
  startAt: z.preprocess(
    (value) => {
      if (typeof value !== 'string') return undefined
      const trimmed = value.trim()
      if (!trimmed) return undefined
      return new Date(trimmed)
    },
    z.date({ message: '请选择有效的开始时间' }).optional()
  )
})

async function assertAdmin() {
  const session = await auth()

  if (!session?.user || !process.env.NEXT_PUBLIC_ADMIN_ID?.split(',').includes(session.user.id)) {
    throw new Error('Unauthorized')
  }

  return session.user
}

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

const addYear = (date: Date) => {
  const next = new Date(date)
  next.setFullYear(next.getFullYear() + 1)
  return next
}

export type CurrentSubscriptionInfo =
  | { status: 'none' }
  | { status: 'active' | 'expired' | 'scheduled'; planName: string; startAt: string; expiredAt: string }

export async function getCurrentSubscription(): Promise<CurrentSubscriptionInfo> {
  const session = await auth()

  if (!session?.user?.id) {
    return { status: 'none' }
  }

  const db = createDb()
  const [record] = await db
    .select({
      expiredAt: subscriptions.expiredAt,
      startAt: subscriptions.createdAt,
      productName: products.name
    })
    .from(subscriptions)
    .leftJoin(products, eq(subscriptions.productId, products.id))
    .where(eq(subscriptions.userId, session.user.id))
    .orderBy(desc(subscriptions.expiredAt))
    .limit(1)

  if (!record?.expiredAt) {
    return { status: 'none' }
  }

  const now = new Date()
  const expiredAt = new Date(record.expiredAt)
  const startAt = new Date(record.startAt)
  const isActive = startAt <= now && expiredAt > now

  if (startAt > now) {
    return {
      status: 'scheduled',
      planName: record.productName ?? PRODUCT_NAME,
      startAt: startAt.toISOString(),
      expiredAt: expiredAt.toISOString()
    }
  }

  return {
    status: isActive ? 'active' : 'expired',
    planName: record.productName ?? PRODUCT_NAME,
    startAt: startAt.toISOString(),
    expiredAt: expiredAt.toISOString()
  }
}

async function ensureAnnualSubscriptionProduct(db: DB) {
  const [existing] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.name, PRODUCT_NAME), eq(products.type, 'subscription')))
    .limit(1)

  if (existing?.id) {
    return existing
  }

  const [created] = await db
    .insert(products)
    .values({
      name: PRODUCT_NAME,
      type: 'subscription',
      price: PRODUCT_PRICE,
      currency: PRODUCT_CURRENCY,
      interval: 'year',
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .returning({ id: products.id })

  if (!created?.id) {
    throw new Error('Failed to create subscription product')
  }

  return created
}

export async function grantAnnualSubscriptionAction(
  _prevState: GrantSubscriptionState,
  formData: FormData
): Promise<GrantSubscriptionState> {
  try {
    const admin = await assertAdmin()
    const db = createDb()
    const parsed = grantSubscriptionSchema.safeParse({
      userId: formData.get('userId'),
      note: formData.get('note'),
      startAt: formData.get('startAt')
    })

    if (!parsed.success) {
      return {
        status: 'error',
        errors: formatFieldErrors(parsed.error),
        message: '请检查输入'
      }
    }

    const { userId, note, startAt: requestedStartAt } = parsed.data
    const now = new Date()
    const startAt = requestedStartAt ?? now
    const expiresAt = addYear(startAt)

    const [existingSubscription] = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          lt(subscriptions.createdAt, expiresAt),
          gt(subscriptions.expiredAt, startAt)
        )
      )
      .limit(1)

    if (existingSubscription?.id) {
      return {
        status: 'error',
        message: '该用户在所选时间范围内已有会员，无需重复发放'
      }
    }

    const product = await ensureAnnualSubscriptionProduct(db)
    if (!product?.id) {
      return {
        status: 'error',
        message: '无法准备订阅商品'
      }
    }

    const [order] = await db
      .insert(orders)
      .values({
        userId: userId,
        productId: product.id,
        status: 'completed',
        transactionType: 'purchase',
        paymentMethod: 'other',
        paymentIntentId: 'manual-grant',
        metadata: JSON.stringify({
          note: note?.trim() || undefined,
          issuedBy: admin.id,
          issuedAt: now.toISOString(),
          startAt: startAt.toISOString(),
          type: 'manual_subscription_grant'
        }),
        createdAt: now,
        updatedAt: now
      })
      .returning({ id: orders.id })

    if (!order?.id) {
      return {
        status: 'error',
        message: '无法创建订单'
      }
    }

    const [subscription] = await db
      .insert(subscriptions)
      .values({
        userId: userId,
        productId: product.id,
        orderId: order.id,
        expiredAt: expiresAt,
        cancelAt: false,
        createdAt: startAt,
        updatedAt: startAt
      })
      .returning({ id: subscriptions.id })

    if (!subscription?.id) {
      return {
        status: 'error',
        message: '创建订阅失败，请稍后重试'
      }
    }

    return {
      status: 'success',
      message: `已为 ${userId} 下发一年会员`
    }
  } catch (error) {
    console.error('Failed to grant subscription', error)
    return {
      status: 'error',
      message: error instanceof Error ? error.message : '服务器开小差了'
    }
  }
}
