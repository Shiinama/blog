import { NextResponse } from 'next/server'

import { DouyinSubtitleError, extractDouyinSubtitle, getDouyinSubtitleRun } from '@/lib/douyin-subtitle'

export const dynamic = 'force-dynamic'

const NO_STORE = { 'Cache-Control': 'no-store' }

function pollUrl(request: Request, runId: string) {
  return `${new URL(request.url).pathname}?runId=${runId}`
}

function errorResponse(error: unknown) {
  if (error instanceof DouyinSubtitleError) {
    return NextResponse.json({ error: error.message }, { status: error.status, headers: NO_STORE })
  }
  console.error('Failed to extract Douyin subtitle', error)
  return NextResponse.json({ error: 'Failed to extract subtitle' }, { status: 500, headers: NO_STORE })
}

/** Long videos take minutes to transcribe — more than a Worker can hold open.
 *  So we return `202 pending` with a `runId` the client re-polls via `?runId=`. */
async function run(request: Request, url: string | null | undefined, runId: string | null, lang?: string) {
  try {
    if (runId) {
      const result = await getDouyinSubtitleRun(runId, { targetLanguage: lang })
      const status = result.status === 'pending' ? 202 : 200
      return NextResponse.json({ ...result, pollUrl: pollUrl(request, runId) }, { status, headers: NO_STORE })
    }

    if (!url) {
      return NextResponse.json({ error: 'Missing "url" or "runId" parameter' }, { status: 400, headers: NO_STORE })
    }

    const result = await extractDouyinSubtitle(url, { targetLanguage: lang })
    if (result.status === 'pending') {
      return NextResponse.json({ ...result, pollUrl: pollUrl(request, result.runId) }, { status: 202, headers: NO_STORE })
    }
    return NextResponse.json(result, { headers: NO_STORE })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  return run(request, searchParams.get('url'), searchParams.get('runId'), searchParams.get('lang') ?? undefined)
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { url?: string; runId?: string; targetLanguage?: string }
  return run(request, body.url, body.runId ?? null, body.targetLanguage)
}
