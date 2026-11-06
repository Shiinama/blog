import { getTranslations } from 'next-intl/server'

import { getViewer } from '@/lib/session'

import { SignInLink } from './sign-in-link'
import { UserMenuDropdown } from './user-menu-dropdown'

export async function UserMenu() {
  const [viewer, t] = await Promise.all([getViewer(), getTranslations('nav')])

  if (!viewer) return <SignInLink label={t('signIn')} />

  return (
    <UserMenuDropdown
      name={viewer.name ?? viewer.email ?? t('account')}
      image={viewer.image}
      isAdmin={viewer.isAdmin}
      labels={{ account: t('account'), admin: t('admin'), tools: t('tools'), signOut: t('signOut') }}
    />
  )
}
