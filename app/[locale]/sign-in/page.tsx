import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'

import { SignInForm } from '@/components/auth/sign-in-form'

import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('signIn')
  return { title: t('title'), robots: { index: false } }
}

export default async function SignInPage({ searchParams }: PageProps<'/[locale]/sign-in'>) {
  const t = await getTranslations('signIn')

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-sm flex-col justify-center gap-6 px-6 py-12">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('description')}</p>
      </div>
      <Suspense>
        <SignInOptions searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function SignInOptions({ searchParams }: Pick<PageProps<'/[locale]/sign-in'>, 'searchParams'>) {
  const params = await searchParams
  const t = await getTranslations('signIn')
  const redirectTo = typeof params.redirectTo === 'string' ? params.redirectTo : '/'

  if (params.sent) {
    return <p className="bg-muted/50 rounded-2xl p-4 text-center text-sm">{t('checkEmail')}</p>
  }
  return (
    <>
      {params.error && <p className="text-destructive text-center text-sm">{t('error')}</p>}
      <SignInForm redirectTo={redirectTo} />
    </>
  )
}
