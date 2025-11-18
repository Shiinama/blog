import { redirect } from '@/i18n/navigation'
import { DEFAULT_LOCALE } from '@/i18n/routing'
import { auth } from '@/lib/auth'

import type { Session } from 'next-auth'

export async function requireAdmin(options?: { redirectTo?: string; locale?: string }) {
  const session = await auth()

  if (!session?.user) {
    redirect({
      href: `/login${options?.redirectTo ? `?callbackUrl=${encodeURIComponent(options.redirectTo)}` : ''}`,
      locale: options?.locale ?? DEFAULT_LOCALE
    })
  }

  if (session?.user?.id !== 'ADMIN') {
    redirect({ href: '/', locale: options?.locale ?? DEFAULT_LOCALE })
  }

  return session?.user
}

export async function assertAdmin() {
  const session = (await auth()) as Session | null

  if (!session?.user || session.user?.id !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  return session.user
}
