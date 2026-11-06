import { hasValidApiKey } from '@/lib/api-key'
import { DouyinSubtitleError, extractDouyinSubtitle, getDouyinSubtitleRun } from '@/lib/douyin-subtitle'
import { isAdminRequest } from '@/lib/session'

const NO_STORE = { 'Cache-Control': 'no-store' }

/** Each run spends Apify credits, so only admins (or callers holding the API key) may use it. */
async function isAuthorized(request: Request) {
  return hasValidApiKey(request, process.env.DOUYIN_SUBTITLE_API_KEY) || (await isAdminRequest())
}

const UNAUTHORIZED = () => Response.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE })

function pollUrl(request: Request, runId: string) {
  return `${new URL(request.url).pathname}?runId=${runId}`
}

function errorResponse(error: unknown) {
  if (error instanceof DouyinSubtitleError) {
    return Response.json({ error: error.message }, { status: error.status, headers: NO_STORE })
  }
  console.error('Failed to extract Douyin subtitle', error)
  return Response.json({ error: 'Failed to extract subtitle' }, { status: 500, headers: NO_STORE })
}

/** Long videos take minutes to transcribe — more than a Worker can hold open.
 *  So we return `202 pending` with a `runId` the client re-polls via `?runId=`. */
async function run(request: Request, url: string | null | undefined, runId: string | null, lang?: string) {
  try {
    if (runId) {
      const result = await getDouyinSubtitleRun(runId, { targetLanguage: lang })
      const status = result.status === 'pending' ? 202 : 200
      return Response.json({ ...result, pollUrl: pollUrl(request, runId) }, { status, headers: NO_STORE })
    }

    if (!url) {
      return Response.json({ error: 'Missing "url" or "runId" parameter' }, { status: 400, headers: NO_STORE })
    }

    const result = await extractDouyinSubtitle(url, { targetLanguage: lang })
    if (result.status === 'pending') {
      return Response.json({ ...result, pollUrl: pollUrl(request, result.runId) }, { status: 202, headers: NO_STORE })
    }
    return Response.json(result, { headers: NO_STORE })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function GET(request: Request) {
  if (!(await isAuthorized(request))) return UNAUTHORIZED()
  const { searchParams } = new URL(request.url)
  return run(request, searchParams.get('url'), searchParams.get('runId'), searchParams.get('lang') ?? undefined)
}

export async function POST(request: Request) {
  if (!(await isAuthorized(request))) return UNAUTHORIZED()
  const body = (await request.json().catch(() => ({}))) as { url?: string; runId?: string; targetLanguage?: string }
  return run(request, body.url, body.runId ?? null, body.targetLanguage)
}
