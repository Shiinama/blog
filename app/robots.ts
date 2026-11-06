import { siteOrigin } from '@/lib/metadata'

import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/zh/admin', '/account', '/zh/account', '/api/'] },
    sitemap: `${siteOrigin}/sitemap.xml`
  }
}
