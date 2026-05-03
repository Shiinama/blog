import { NextResponse } from 'next/server'

import { getContentSignals } from '@/lib/content-signals'

function parsePositiveInt(value: string | null) {
  if (!value) return undefined
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function parseBoolean(value: string | null) {
  if (!value) return undefined
  return ['1', 'true', 'yes'].includes(value.trim().toLowerCase())
}

function isAuthorized(request: Request) {
  const expectedKey = process.env.CONTENT_SIGNALS_API_KEY?.trim()
  if (!expectedKey) return true

  const authorization = request.headers.get('authorization') ?? ''
  const bearerToken = authorization.toLowerCase().startsWith('bearer ') ? authorization.slice(7).trim() : null
  const headerToken = request.headers.get('x-api-key')?.trim()

  return bearerToken === expectedKey || headerToken === expectedKey
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)

  try {
    const result = await getContentSignals({
      limit: parsePositiveInt(searchParams.get('limit')),
      days: parsePositiveInt(searchParams.get('days')),
      locale: searchParams.get('locale') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      tag: searchParams.get('tag') ?? undefined,
      includeContent: parseBoolean(searchParams.get('includeContent'))
    })

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900'
      }
    })
  } catch (error) {
    console.error('Failed to load content posts', error)
    return NextResponse.json({ error: 'Failed to load content posts' }, { status: 500 })
  }
}
