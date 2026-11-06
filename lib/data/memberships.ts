import 'server-only'

import { and, desc, eq, gt, lt } from 'drizzle-orm'

import { memberships, users } from '@/drizzle/schema'
import { getDb } from '@/lib/db'
import { getViewer, requireAdmin } from '@/lib/session'

export type MembershipStatus =
  { status: 'none' } | { status: 'active' | 'scheduled' | 'expired'; startsAt: Date; expiresAt: Date }

// Not exported: callers can only ask about the signed-in viewer.
async function getLatestMembership(userId: string) {
  const db = await getDb()
  const [row] = await db
    .select({ startsAt: memberships.startsAt, expiresAt: memberships.expiresAt })
    .from(memberships)
    .where(eq(memberships.userId, userId))
    .orderBy(desc(memberships.expiresAt))
    .limit(1)
  return row ?? null
}

function toStatus(row: { startsAt: Date; expiresAt: Date } | null, now: Date): MembershipStatus {
  if (!row) return { status: 'none' }
  const status = row.startsAt > now ? 'scheduled' : row.expiresAt > now ? 'active' : 'expired'
  return { status, ...row }
}

/** Membership of the signed-in viewer. Reads the session, so render it inside `<Suspense>`. */
export async function getViewerMembership(): Promise<MembershipStatus> {
  const viewer = await getViewer()
  if (!viewer) return { status: 'none' }
  return toStatus(await getLatestMembership(viewer.id), new Date())
}

export async function listRecentMemberships(limit = 20) {
  await requireAdmin()
  const db = await getDb()
  return db
    .select({
      id: memberships.id,
      userId: memberships.userId,
      userName: users.name,
      userEmail: users.email,
      startsAt: memberships.startsAt,
      expiresAt: memberships.expiresAt,
      note: memberships.note
    })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .orderBy(desc(memberships.createdAt))
    .limit(limit)
}

export async function hasOverlappingMembership(userId: string, startsAt: Date, expiresAt: Date) {
  const db = await getDb()
  const [row] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(
      and(eq(memberships.userId, userId), lt(memberships.startsAt, expiresAt), gt(memberships.expiresAt, startsAt))
    )
    .limit(1)
  return Boolean(row)
}
