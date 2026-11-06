import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'

// Stays `middleware.ts` (Edge) rather than `proxy.ts`: OpenNext on Workers doesn't support Node.js middleware yet.
export default createMiddleware(routing)

export const config = {
  // Everything except API routes, Next internals and static files — plus the locale-aware RSS feeds.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/rss.xml', '/:locale(en|zh)/rss.xml']
}
