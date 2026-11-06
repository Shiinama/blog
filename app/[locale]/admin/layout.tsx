import { getTranslations } from 'next-intl/server'

import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav')
  return { title: { default: t('admin'), template: `%s · ${t('admin')}` }, robots: { index: false } }
}

// Presentation only — every admin page and action authorizes itself (see `requireAdminPage`).
export default async function AdminLayout({ children }: LayoutProps<'/[locale]/admin'>) {
  const t = await getTranslations('admin.nav')
  return (
    <div className="px-6 py-8 lg:px-10">
      <nav className="mb-8 flex gap-1">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/posts">{t('posts')}</Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/memberships">{t('memberships')}</Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/tools">{t('tools')}</Link>
        </Button>
      </nav>
      {children}
    </div>
  )
}
