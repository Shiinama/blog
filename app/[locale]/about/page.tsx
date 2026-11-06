import { getLocale, getTranslations } from 'next-intl/server'

import { AboutContent } from '@/components/about/about-content'
import { alternates } from '@/lib/metadata'

import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations('seo')])
  return { title: t('aboutTitle'), description: t('aboutDescription'), alternates: alternates('/about', locale) }
}

const CONTACTS = [
  { name: 'Substack', url: 'https://xibaoyuxi.substack.com' },
  { name: 'Twitter', url: 'https://x.com/Xi_baoyu' },
  { name: 'Github', url: 'https://github.com/Shiinama' },
  { name: 'Facebook', url: 'https://www.facebook.com/profile.php?id=100094312606141' },
  { name: 'Juejin', url: 'https://juejin.cn/user/400646714977431' },
  { name: 'Zhihu', url: 'https://www.zhihu.com/people/39-97-11-82' }
]

export default async function AboutPage() {
  const t = await getTranslations('about')
  const sections = (['experiences', 'connect'] as const).map((key) => ({
    title: t(`sections.${key}.title`),
    content: t(`sections.${key}.content`)
  }))

  return (
    <AboutContent
      title={t('title')}
      intro={t('intro')}
      contactMe={t('contactMe')}
      sections={sections}
      contacts={CONTACTS}
    />
  )
}
