import { getTranslations } from 'next-intl/server'

import { GrantSubscriptionForm } from '@/components/subscriptions/grant-subscription-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminSubscriptionsPage() {
  const t = await getTranslations('admin.subscriptions')

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-muted-foreground text-sm">{t('description')}</p>
        <h2 className="text-3xl font-bold">{t('title')}</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('formTitle')}</CardTitle>
          <CardDescription>{t('helper')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul>
            <li>{t('bullet.price')}</li>
            <li>{t('bullet.interval')}</li>
            <li>{t('bullet.howItWorks')}</li>
          </ul>
          <GrantSubscriptionForm />
        </CardContent>
      </Card>
    </div>
  )
}
