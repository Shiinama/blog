import { buildRssResponse } from '@/lib/rss'

type RssRouteParams = {
  locale?: string
}

export async function GET(_request: Request, { params }: { params: Promise<RssRouteParams> }) {
  const { locale } = await params
  return buildRssResponse(locale)
}
