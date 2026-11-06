import 'server-only'

import { eq } from 'drizzle-orm'
import { forbidden, unauthorized } from 'next/navigation'
import { cache } from 'react'

import { users } from '@/drizzle/schema'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/db'

export type Viewer = {
  id: string
  name: string | null
  email: string | null
  image: string | null
  isAdmin: boolean
}

const adminIds = new Set(
  (process.env.ADMIN_USER_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
)

/** JWT sessions only prove who signed in; the user row is the source of truth (and may be gone). */
async function readViewer(): Promise<Viewer | null> {
  const session = await auth()
  const id = session?.user?.id
  if (!id) return null

  const db = await getDb()
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    columns: { id: true, name: true, email: true, image: true }
  })
  return user ? { ...user, isAdmin: adminIds.has(user.id) } : null
}

/**
 * The signed-in user for rendering, deduped per request. Reads cookies, so render the
 * component that calls it inside `<Suspense>` to keep the rest of the page streaming.
 */
export const getViewer = cache(readViewer)

/** For Server Actions and Route Handlers: always re-reads the session. */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await readViewer()
  if (!viewer) throw new Error('Unauthorized')
  return viewer
}

export async function requireAdmin(): Promise<Viewer> {
  const viewer = await requireViewer()
  if (!viewer.isAdmin) throw new Error('Forbidden')
  return viewer
}

/** For admin pages: 401 when signed out, 403 for non-admins. */
export async function requireAdminPage(): Promise<Viewer> {
  const viewer = await getViewer()
  if (!viewer) unauthorized()
  if (!viewer.isAdmin) forbidden()
  return viewer
}

/** For Route Handlers that accept either an admin session or an API key. */
export async function isAdminRequest(): Promise<boolean> {
  return Boolean((await readViewer())?.isAdmin)
}
