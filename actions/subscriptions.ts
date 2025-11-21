'use server'

import { and, desc, eq, gte } from 'drizzle-orm'
import { z } from 'zod'

import { orders, products, subscriptions, users, type Currency } from '@/drizzle/schema'
import { auth } from '@/lib/auth'
import { createDb, type DB } from '@/lib/db'

import type { GrantSubscriptionState } from './subscriptions/state'

const PRODUCT_NAME = 'Annual Membership (1 year)'
const PRODUCT_PRICE = 200
const PRODUCT_CURRENCY: Currency = 'CNY'

const grantSubscriptionSchema = z.object({
  email: z.string().email({ message: '请输入有效的邮箱地址' }),
  note: z.string().max(200, { message: '备注请少于 200 个字符' }).optional().or(z.literal(''))
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
  | { status: 'active' | 'expired'; planName: string; expiredAt: string }

export async function getCurrentSubscription(): Promise<CurrentSubscriptionInfo> {
  const session = await auth()

  if (!session?.user?.id) {
    return { status: 'none' }
  }

  const db = createDb()
  const [record] = await db
    .select({
      expiredAt: subscriptions.expiredAt,
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

  const expiredAt = new Date(record.expiredAt)
  const isActive = expiredAt > new Date()

  return {
    status: isActive ? 'active' : 'expired',
    planName: record.productName ?? PRODUCT_NAME,
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
      email: formData.get('email'),
      note: formData.get('note')
    })

    if (!parsed.success) {
      return {
        status: 'error',
        errors: formatFieldErrors(parsed.error),
        message: '请检查输入'
      }
    }

    const { email, note } = parsed.data
    const now = new Date()
    const [targetUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)

    if (!targetUser?.id) {
      return {
        status: 'error',
        message: '无法找到该邮箱对应的用户'
      }
    }

    const [existingSubscription] = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, targetUser.id), gte(subscriptions.expiredAt, now)))
      .limit(1)

    if (existingSubscription?.id) {
      return {
        status: 'error',
        message: '该用户已有有效会员，无需重复发放'
      }
    }

    const product = await ensureAnnualSubscriptionProduct(db)
    if (!product?.id) {
      return {
        status: 'error',
        message: '无法准备订阅商品'
      }
    }

    const expiresAt = addYear(now)

    const [order] = await db
      .insert(orders)
      .values({
        userId: targetUser.id,
        productId: product.id,
        status: 'completed',
        transactionType: 'purchase',
        paymentMethod: 'other',
        paymentIntentId: 'manual-grant',
        metadata: JSON.stringify({
          note: note?.trim() || undefined,
          issuedBy: admin.id,
          issuedAt: now.toISOString(),
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
        userId: targetUser.id,
        productId: product.id,
        orderId: order.id,
        expiredAt: expiresAt,
        cancelAt: false,
        createdAt: now,
        updatedAt: now
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
      message: `已为 ${email} 下发一年会员`
    }
  } catch (error) {
    console.error('Failed to grant subscription', error)
    return {
      status: 'error',
      message: error instanceof Error ? error.message : '服务器开小差了'
    }
  }
}
