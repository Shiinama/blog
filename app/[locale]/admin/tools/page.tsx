import { getTranslations } from 'next-intl/server'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/i18n/navigation'

// Registry of admin tools. Add an entry here (plus its `admin.tools.<key>`
// messages and a page under `tools/<slug>`) to surface a new tool.
const TOOLS = [{ key: 'douyinSubtitle', href: '/admin/tools/douyin-subtitle' }] as const

export default async function AdminToolsPage() {
  const t = await getTranslations('admin.tools')

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm">{t('description')}</p>
          <h2 className="text-3xl font-bold">{t('title')}</h2>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/posts">{t('actions.back')}</Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => (
          <Card key={tool.key} className="flex flex-col">
            <CardHeader>
              <CardTitle>{t(`${tool.key}.name`)}</CardTitle>
              <CardDescription>{t(`${tool.key}.summary`)}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button asChild>
                <Link href={tool.href}>{t('actions.openTool')}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
