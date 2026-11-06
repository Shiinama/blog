import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Fish Blog',
    short_name: 'Fish Blog',
    description: 'Practical notes on engineering, applied AI, and growth.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    theme_color: '#0f172a',
    background_color: '#0f172a',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  }
}
