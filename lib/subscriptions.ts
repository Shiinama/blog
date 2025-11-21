'use server'

import { and } from 'drizzle-orm'

import { createDb } from '@/lib/db'

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  if (!userId) return false

  const db = createDb()
  const active = await db.query.subscriptions.findFirst({
    where: (subscription, { eq, gt }) => and(eq(subscription.userId, userId), gt(subscription.expiredAt, new Date()))
  })

  return Boolean(active)
}
