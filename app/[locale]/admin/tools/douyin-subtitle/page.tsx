import { getTranslations } from 'next-intl/server'

import { DouyinSubtitleTool } from '@/components/tools/douyin-subtitle-tool'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/i18n/navigation'

export default async function DouyinSubtitlePage() {
  const t = await getTranslations('admin.tools')

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">{t('douyinSubtitle.title')}</h2>
        <Button asChild variant="outline">
          <Link href="/admin/tools">{t('actions.back')}</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('douyinSubtitle.name')}</CardTitle>
          <CardDescription>{t('douyinSubtitle.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <DouyinSubtitleTool />
        </CardContent>
      </Card>
    </div>
  )
}
