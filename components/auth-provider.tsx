'use client'

import { useRequest } from 'ahooks'
import { User } from 'next-auth'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { createContext, useContext, useMemo } from 'react'

import { getCurrentSubscription } from '@/actions/subscriptions'

export type AuthData = {
  session: ReturnType<typeof useSession>
  common: ReturnType<typeof useTranslations>
  auth: ReturnType<typeof useTranslations>
  user?: {
    id: string
  } & User
  isAdmin: boolean
  planLabel: string
  expiredAtLabel: string
}

const AuthActionsContext = createContext<AuthData | null>(null)

export function useAuthData(): AuthData {
  const session = useSession()
  const common = useTranslations()
  const auth = useTranslations('auth')

  const user = session.data?.user
  const isAdmin = process.env.NEXT_PUBLIC_ADMIN_ID?.split(',').includes(user?.id ?? '') ?? false
  const ready = Boolean(user?.id)

  const { data: subscription, loading } = useRequest(() => getCurrentSubscription(), {
    ready,
    refreshDeps: [user?.id]
  })

  const { planLabel, expiredAtLabel } = useMemo(() => {
    if (!ready) {
      return { planLabel: common('common.planFree'), expiredAtLabel: common('common.notAvailable') }
    }

    if (loading) {
      const label = common('common.planLoading')
      return { planLabel: label, expiredAtLabel: label }
    }

    if (!subscription || subscription.status === 'none') {
      return { planLabel: common('common.planFree'), expiredAtLabel: common('common.notAvailable') }
    }

    const expiredAt = new Date(subscription.expiredAt)
    const formatted = expiredAt.toLocaleString()

    return {
      planLabel: subscription.planName,
      expiredAtLabel: subscription.status === 'expired' ? `${formatted} (${common('common.expiredTag')})` : formatted
    }
  }, [common, loading, ready, subscription])

  return { session, common, auth, user, isAdmin, planLabel, expiredAtLabel }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const value = useAuthData()
  return <AuthActionsContext.Provider value={value}>{children}</AuthActionsContext.Provider>
}

export function useAuthContext(): AuthData {
  const data = useContext(AuthActionsContext)
  if (!data) throw new Error('useAuthContext must be used inside <AuthProvider>.')
  return data
}
