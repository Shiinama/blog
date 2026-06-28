/**
 * Extract subtitles / spoken-word transcript from a Douyin video.
 *
 * Douyin's web detail API is signature-gated (a_bogus) and the SSR page is
 * JS-challenge protected, so neither can be called from a stateless Cloudflare
 * Worker. We delegate the heavy lifting (audio download + ASR) to the Apify
 * actor `zen-studio/douyin-transcripts-scraper`, which we reach with a plain
 * `fetch` — Worker friendly, no reverse-engineering required.
 *
 * Transcription can take minutes (a long video observed at ~4 min), which is
 * longer than a Cloudflare Worker can hold a single request open. So instead of
 * the blocking `run-sync` endpoint we START a run, POLL it for a bounded window,
 * and hand back a `runId` the caller can poll later if it isn't done yet.
 */

const APIFY_BASE = 'https://api.apify.com/v2'
const ACTOR_ID = 'zen-studio~douyin-transcripts-scraper'

export type DouyinSubtitleSegment = {
  start: number
  end: number
  text: string
}

export type DouyinSubtitleResult = {
  status: 'succeeded'
  runId: string
  url: string
  language: string
  duration: number | null
  title: string | null
  transcript: string
  segments: DouyinSubtitleSegment[]
  srt: string
  truncated: boolean
}

export type DouyinSubtitlePending = {
  status: 'pending'
  runId: string
  /** Apify run state, e.g. READY | RUNNING. */
  runStatus: string
}

export type ExtractDouyinSubtitleOptions = {
  /** Output language. `zh` keeps the original Mandarin (no translation cost). */
  targetLanguage?: string
  /** Apify token; defaults to `process.env.APIFY_TOKEN`. */
  token?: string
  /** How long to poll before returning a pending result (ms). Keep under the
   *  Worker request budget. Default 45s. */
  maxWaitMs?: number
  /** Delay between status polls (ms). Default 3s. */
  pollIntervalMs?: number
  /** Abort signal for upstream requests. */
  signal?: AbortSignal
}

export class DouyinSubtitleError extends Error {
  status: number

  constructor(message: string, status = 500) {
    super(message)
    this.name = 'DouyinSubtitleError'
    this.status = status
  }
}

const TERMINAL_OK = 'SUCCEEDED'
const TERMINAL_BAD = new Set(['FAILED', 'ABORTED', 'TIMED-OUT', 'TIMED_OUT'])

function resolveToken(token?: string) {
  const resolved = token ?? process.env.APIFY_TOKEN
  if (!resolved) {
    throw new DouyinSubtitleError('APIFY_TOKEN is not configured', 500)
  }
  return resolved
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new DouyinSubtitleError('Aborted', 499))
      },
      { once: true }
    )
  })
}

async function apify<T>(url: string, init: RequestInit & { signal?: AbortSignal } = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, init)
  } catch (error) {
    throw new DouyinSubtitleError(
      `Failed to reach the transcript service: ${error instanceof Error ? error.message : 'unknown error'}`,
      502
    )
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new DouyinSubtitleError(
      `Transcript service returned ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`,
      response.status === 401 ? 401 : 502
    )
  }
  return (await response.json().catch(() => null)) as T
}

function pad(value: number, length = 2) {
  return Math.floor(value).toString().padStart(length, '0')
}

/** Format a float-second timestamp as an SRT timecode (HH:MM:SS,mmm). */
function toSrtTime(seconds: number) {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0
  const ms = Math.round((safe - Math.floor(safe)) * 1000)
  const total = Math.floor(safe)
  return `${pad(total / 3600)}:${pad((total % 3600) / 60)}:${pad(total % 60)},${pad(ms, 3)}`
}

/** Build a SubRip (.srt) document from timestamped segments. */
export function segmentsToSrt(segments: DouyinSubtitleSegment[]) {
  return segments
    .map((segment, index) => `${index + 1}\n${toSrtTime(segment.start)} --> ${toSrtTime(segment.end)}\n${segment.text}\n`)
    .join('\n')
    .trim()
}

function normalizeSegments(raw: unknown): DouyinSubtitleSegment[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      const segment = item as Record<string, unknown>
      const text = typeof segment.text === 'string' ? segment.text.trim() : ''
      if (!text) return null
      return { start: Number(segment.start) || 0, end: Number(segment.end) || 0, text }
    })
    .filter((segment): segment is DouyinSubtitleSegment => segment !== null)
}

function buildResult(runId: string, item: Record<string, unknown>, fallbackLanguage: string): DouyinSubtitleResult {
  const segments = normalizeSegments(item.segments)
  const transcript =
    typeof item.transcript === 'string' && item.transcript.trim()
      ? item.transcript.trim()
      : segments.map((segment) => segment.text).join('\n')

  if (!transcript) {
    throw new DouyinSubtitleError('This video has no detectable speech to transcribe', 422)
  }

  const duration = Number(item.duration)

  return {
    status: 'succeeded',
    runId,
    url: typeof item.url === 'string' ? item.url : (typeof item.inputUrl === 'string' ? item.inputUrl : ''),
    language: typeof item.language === 'string' ? item.language : fallbackLanguage,
    duration: Number.isFinite(duration) ? duration : null,
    title:
      (typeof item.itemTitle === 'string' && item.itemTitle) ||
      (typeof item.text === 'string' && item.text) ||
      (typeof item.caption === 'string' && item.caption) ||
      null,
    transcript,
    segments,
    srt: segmentsToSrt(segments),
    truncated: item.truncatedFromSeconds != null
  }
}

type ApifyRun = { id: string; status: string; defaultDatasetId: string }

/** Kick off an actor run for a single Douyin URL and return the run handle. */
async function startRun(url: string, targetLanguage: string, token: string, signal?: AbortSignal) {
  const data = await apify<{ data: ApifyRun }>(`${APIFY_BASE}/acts/${ACTOR_ID}/runs?token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      videoUrls: [url],
      targetLanguage,
      outputSrt: false,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false
    }),
    signal
  })
  if (!data?.data?.id) {
    throw new DouyinSubtitleError('Failed to start transcript run', 502)
  }
  return data.data
}

async function getRun(runId: string, token: string, signal?: AbortSignal) {
  const data = await apify<{ data: ApifyRun }>(
    `${APIFY_BASE}/actor-runs/${encodeURIComponent(runId)}?token=${encodeURIComponent(token)}`,
    { signal }
  )
  if (!data?.data) {
    throw new DouyinSubtitleError('Unknown transcript run', 404)
  }
  return data.data
}

async function getRunResult(run: ApifyRun, token: string, fallbackLanguage: string, signal?: AbortSignal) {
  const items = await apify<Array<Record<string, unknown>>>(
    `${APIFY_BASE}/datasets/${encodeURIComponent(run.defaultDatasetId)}/items?clean=true&token=${encodeURIComponent(token)}`,
    { signal }
  )
  const item = items?.[0]
  if (!item) {
    throw new DouyinSubtitleError('No transcript was returned for this video', 404)
  }
  return buildResult(run.id, item, fallbackLanguage)
}

/**
 * Fetch the result of a previously started run. Returns the transcript once the
 * run has succeeded, or a pending marker while it is still processing.
 */
export async function getDouyinSubtitleRun(
  runId: string,
  options: Pick<ExtractDouyinSubtitleOptions, 'token' | 'targetLanguage' | 'signal'> = {}
): Promise<DouyinSubtitleResult | DouyinSubtitlePending> {
  const token = resolveToken(options.token)
  const run = await getRun(runId, token, options.signal)

  if (run.status === TERMINAL_OK) {
    return getRunResult(run, token, options.targetLanguage ?? 'zh', options.signal)
  }
  if (TERMINAL_BAD.has(run.status)) {
    throw new DouyinSubtitleError(`Transcript run ${run.status.toLowerCase()}`, 502)
  }
  return { status: 'pending', runId: run.id, runStatus: run.status }
}

/**
 * Start a transcript run for a Douyin URL (or share link / bare aweme id — the
 * actor accepts all of them) and poll for a bounded window. Returns the finished
 * transcript, or a `pending` marker with a `runId` to poll later if it is still
 * running when the window elapses.
 */
export async function extractDouyinSubtitle(
  input: string,
  options: ExtractDouyinSubtitleOptions = {}
): Promise<DouyinSubtitleResult | DouyinSubtitlePending> {
  const url = input?.trim()
  if (!url) {
    throw new DouyinSubtitleError('A Douyin video URL is required', 400)
  }

  const token = resolveToken(options.token)
  const targetLanguage = options.targetLanguage ?? 'zh'
  const maxWaitMs = options.maxWaitMs ?? 45_000
  const pollIntervalMs = options.pollIntervalMs ?? 3_000

  const run = await startRun(url, targetLanguage, token, options.signal)
  const deadline = maxWaitMs

  let elapsed = 0
  let status = run.status
  while (elapsed < deadline) {
    if (status === TERMINAL_OK) {
      return getRunResult(run, token, targetLanguage, options.signal)
    }
    if (TERMINAL_BAD.has(status)) {
      throw new DouyinSubtitleError(`Transcript run ${status.toLowerCase()}`, 502)
    }
    await sleep(pollIntervalMs, options.signal)
    elapsed += pollIntervalMs
    status = (await getRun(run.id, token, options.signal)).status
  }

  if (status === TERMINAL_OK) {
    return getRunResult(run, token, targetLanguage, options.signal)
  }

  return { status: 'pending', runId: run.id, runStatus: status }
}
