'use server'

import { and } from 'drizzle-orm'

import { createDb } from '@/lib/db'

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  if (!userId) return false

  const db = createDb()
  const active = await db.query.subscriptions.findFirst({
    where: (subscription, { eq, gt, lte }) =>
      and(eq(subscription.userId, userId), lte(subscription.createdAt, new Date()), gt(subscription.expiredAt, new Date()))
  })

  return Boolean(active)
}
