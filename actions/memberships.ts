'use server'

import { eq } from 'drizzle-orm'
import { refresh } from 'next/cache'
import { z } from 'zod'

import { memberships, users } from '@/drizzle/schema'
import { hasOverlappingMembership } from '@/lib/data/memberships'
import { getDb } from '@/lib/db'
import { requireAdmin } from '@/lib/session'

import { fail, invalid, type ActionState } from './types'

const grantSchema = z.object({
  userId: z.string().trim().min(1),
  startsAt: z
    .string()
    .optional()
    .transform((value) => (value ? new Date(value) : new Date()))
    .refine((date) => !Number.isNaN(date.getTime())),
  months: z.coerce.number().int().min(1).max(36).default(12),
  note: z.string().trim().max(200).optional()
})

export async function grantMembership(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin()
  const parsed = grantSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return invalid(parsed.error, formData)

  const { userId, startsAt, months, note } = parsed.data
  const expiresAt = new Date(startsAt)
  expiresAt.setMonth(expiresAt.getMonth() + months)

  const db = await getDb()
  const user = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { id: true } })
  if (!user) return fail('userNotFound', formData)
  if (await hasOverlappingMembership(userId, startsAt, expiresAt)) return fail('membershipOverlap', formData)

  await db.insert(memberships).values({ userId, startsAt, expiresAt, note: note || null, grantedBy: admin.id })
  refresh()
  return { ok: true }
}
