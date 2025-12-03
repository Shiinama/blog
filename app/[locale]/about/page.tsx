import { getTranslations } from 'next-intl/server'

import { AboutContent } from '@/components/about/about-content'
import { routing } from '@/i18n/routing'
import { buildAbsoluteUrl, buildLanguageAlternates } from '@/lib/metadata'

import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'seo' })
  const pageTitle = t('aboutTitle')
  const description = t('aboutDescription')
  const pathname = routing.defaultLocale === locale ? '/about' : `/${locale}/about`

  return {
    title: pageTitle,
    description,
    alternates: {
      canonical: pathname,
      languages: buildLanguageAlternates('/about')
    },
    openGraph: {
      title: pageTitle,
      description,
      url: buildAbsoluteUrl(pathname),
      siteName: t('siteTitle'),
      locale
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description
    }
  }
}

export default async function About() {
  const t = await getTranslations('about')
  const sectionKeys = ['whyNow', 'community', 'expectations'] as const
  const sections = sectionKeys.map((key) => ({
    title: t(`sections.${key}.title`),
    content: t(`sections.${key}.content`)
  }))

  return (
    <AboutContent
      contactMe={t('contactMe')}
      sections={sections}
      contacts={[
        { name: 'Substack', url: 'https://xibaoyuxi.substack.com' },
        { name: 'Twitter', url: 'https://x.com/Xi_baoyu' },
        { name: 'Github', url: 'https://github.com/Shiinama' },
        { name: 'Facebook', url: 'https://www.facebook.com/profile.php?id=100094312606141' },
        { name: 'Juejin', url: 'https://juejin.cn/user/400646714977431' },
        { name: 'Zhihu', url: 'https://www.zhihu.com/people/39-97-11-82' }
      ]}
    />
  )
}
