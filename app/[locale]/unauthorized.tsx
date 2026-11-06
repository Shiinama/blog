import { getTranslations } from 'next-intl/server'

import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

export default async function Unauthorized() {
  const t = await getTranslations('errors')
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-muted-foreground font-mono text-sm">401</p>
      <h1 className="text-2xl font-semibold">{t('unauthorized.title')}</h1>
      <p className="text-muted-foreground">{t('unauthorized.description')}</p>
      <Button asChild>
        <Link href="/sign-in">{t('unauthorized.action')}</Link>
      </Button>
    </div>
  )
}
