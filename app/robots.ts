import { MetadataRoute } from 'next'
import { SITE } from 'config/const'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${SITE.website}/sitemap.xml`,
    host: SITE.website,
  }
}
