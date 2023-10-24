import { Metadata } from 'next'
import { SITE } from 'config/const'

interface PageSEOProps {
  title: string
  description?: string
  image?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export function genPageMetadata({ title, description, image, ...rest }: PageSEOProps): Metadata {
  return {
    title,
    openGraph: {
      title: `${title} | ${SITE.title}`,
      description: description || SITE.description,
      url: './',
      siteName: SITE.title,
      images: image ? [image] : [SITE.socialBanner],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      title: `${title} | ${SITE.title}`,
      card: 'summary_large_image',
      images: image ? [image] : [SITE.socialBanner],
    },
    ...rest,
  }
}
