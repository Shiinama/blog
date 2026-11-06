import { unauthorized } from 'next/navigation'
import { getFormatter, getTranslations } from 'next-intl/server'
import { Suspense } from 'react'

import { signOutAction } from '@/actions/auth'
import { CopyButton } from '@/components/copy-button'
import { Button } from '@/components/ui/button'
import { getViewerMembership } from '@/lib/data/memberships'
import { getViewer } from '@/lib/session'

import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account')
  return { title: t('title'), robots: { index: false } }
}

export default async function AccountPage() {
  const t = await getTranslations('account')
  return (
    <div className="mx-auto w-full max-w-xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-semibold">{t('title')}</h1>
      <Suspense fallback={<div className="bg-muted/40 h-64 animate-pulse rounded-2xl" />}>
        <AccountDetails />
      </Suspense>
    </div>
  )
}

async function AccountDetails() {
  const viewer = await getViewer()
  if (!viewer) unauthorized()

  const [membership, t, format] = await Promise.all([getViewerMembership(), getTranslations('account'), getFormatter()])
  const plan =
    membership.status === 'none'
      ? t('plan.none')
      : t(`plan.${membership.status}`, {
          start: format.dateTime(membership.startsAt, 'short'),
          end: format.dateTime(membership.expiresAt, 'short')
        })

  return (
    <dl className="divide-border/60 divide-y rounded-2xl border">
      <Row label={t('userId')}>
        <span className="font-mono text-xs break-all">{viewer.id}</span>
        <CopyButton value={viewer.id} label={t('copy')} copiedLabel={t('copied')} />
      </Row>
      {viewer.name && <Row label={t('name')}>{viewer.name}</Row>}
      {viewer.email && <Row label={t('email')}>{viewer.email}</Row>}
      <Row label={t('membership')}>{plan}</Row>
      <div className="flex justify-end p-4">
        <form action={signOutAction}>
          <Button type="submit" variant="destructive" size="sm">
            {t('signOut')}
          </Button>
        </form>
      </div>
    </dl>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:gap-4">
      <dt className="text-muted-foreground w-28 shrink-0 text-sm">{label}</dt>
      <dd className="flex min-w-0 flex-1 items-center gap-2 text-sm">{children}</dd>
    </div>
  )
}
