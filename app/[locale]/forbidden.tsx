import { getTranslations } from 'next-intl/server'

import { ErrorPage } from './not-found'

export default async function Forbidden() {
  const t = await getTranslations('errors')
  return (
    <ErrorPage
      code="403"
      title={t('forbidden.title')}
      description={t('forbidden.description')}
      action={t('backHome')}
    />
  )
}
