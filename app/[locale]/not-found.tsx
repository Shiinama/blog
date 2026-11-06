import { getTranslations } from 'next-intl/server'

import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

export default async function NotFound() {
  const t = await getTranslations('errors')
  return (
    <ErrorPage code="404" title={t('notFound.title')} description={t('notFound.description')} action={t('backHome')} />
  )
}

export function ErrorPage({
  code,
  title,
  description,
  action
}: {
  code: string
  title: string
  description: string
  action: string
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-muted-foreground font-mono text-sm">{code}</p>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
      <Button asChild variant="outline">
        <Link href="/">{action}</Link>
      </Button>
    </div>
  )
}
