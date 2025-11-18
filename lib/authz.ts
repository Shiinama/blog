import { redirect } from '@/i18n/navigation'
import { DEFAULT_LOCALE } from '@/i18n/routing'
import { auth } from '@/lib/auth'

export async function requireAdmin(options?: { redirectTo?: string; locale?: string }) {
  const session = await auth()

  if (!session?.user) {
    redirect({
      href: `/login${options?.redirectTo ? `?callbackUrl=${encodeURIComponent(options.redirectTo)}` : ''}`,
      locale: options?.locale ?? DEFAULT_LOCALE
    })
  }

  if (session?.user?.id !== process.env.NEXT_PUBLIC_ADMIN_ID) {
    redirect({ href: '/', locale: options?.locale ?? DEFAULT_LOCALE })
  }

  return session?.user
}

export async function assertAdmin() {
  const session = await auth()

  if (!session?.user || session.user?.id !== process.env.NEXT_PUBLIC_ADMIN_ID) {
    throw new Error('Unauthorized')
  }

  return session.user
}
