import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'
import createNextIntlPlugin from 'next-intl/plugin'

import type { NextConfig } from 'next'

initOpenNextCloudflareForDev()

const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: './messages/en.json'
  }
})

const nextConfig: NextConfig = {
  // Cache Components (`use cache` / Partial Prerendering) stay off until OpenNext runs them reliably on Workers:
  // https://github.com/opennextjs/opennextjs-cloudflare/issues/1464 and #1450.
  experimental: {
    globalNotFound: true,
    authInterrupts: true
  },
  images: {
    // Optimised by the Cloudflare Images binding (`IMAGES` in wrangler.jsonc). Only these origins
    // may be transformed; new uploads go to our own R2 domain.
    remotePatterns: [
      'static.xibaoyu.xyz',
      'ik.imagekit.io',
      'ai.feishu.cn',
      'article-images.zsxq.com',
      'docs.expo.dev',
      'developer.apple.com',
      'devimages-cdn.apple.com',
      'developer.android.com',
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com'
    ].map((hostname) => ({ protocol: 'https', hostname }))
  }
}

export default withNextIntl(nextConfig)
