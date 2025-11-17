import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth'

import type { Session } from 'next-auth'

export async function requireAdmin(options?: { redirectTo?: string }) {
  const session = await auth()

  if (!session?.user) {
    redirect(`/login${options?.redirectTo ? `?callbackUrl=${encodeURIComponent(options.redirectTo)}` : ''}`)
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/')
  }

  return session.user
}

export async function assertAdmin() {
  const session = (await auth()) as Session | null

  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  return session.user
}
