import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'
import createNextIntlPlugin from 'next-intl/plugin'

initOpenNextCloudflareForDev()

const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: './messages/en.json'
  }
})

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
        port: '',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'static.xibaoyu.xyz',
        port: '',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'p6-juejin.byteimg.com',
        port: '',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'p1-juejin.byteimg.com',
        port: '',
        pathname: '/**'
      }
    ]
  }
}

export default withNextIntl(nextConfig)
