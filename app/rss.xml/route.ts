import { buildRssResponse } from '@/lib/rss'

export async function GET() {
  return buildRssResponse()
}
