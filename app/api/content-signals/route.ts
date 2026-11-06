import { z } from 'zod'

import { routing } from '@/i18n/routing'
import { hasValidApiKey } from '@/lib/api-key'
import { claimContentSignal } from '@/lib/data/content-signals'

const list = z.array(z.string()).transform((values) =>
  values
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean)
)

const querySchema = z.object({
  locale: z.enum(routing.locales).default(routing.defaultLocale),
  days: z.coerce.number().int().positive().max(3650).optional(),
  category: z.string().trim().min(1).optional(),
  excludeCategory: list.default([]),
  claimed: z.stringbool().default(false),
  includeContent: z.stringbool().default(true)
})

/**
 * GET /api/content-signals?locale=en&days=30&category=ai&excludeCategory=ai-daily&claimed=false
 * Auth: `Authorization: Bearer <CONTENT_SIGNALS_API_KEY>` or `x-api-key`.
 */
export async function GET(request: Request) {
  if (!hasValidApiKey(request, process.env.CONTENT_SIGNALS_API_KEY)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = querySchema.safeParse({
    ...Object.fromEntries(searchParams),
    excludeCategory: searchParams.getAll('excludeCategory')
  })
  if (!query.success) {
    return Response.json({ error: 'Invalid query', issues: z.flattenError(query.error).fieldErrors }, { status: 400 })
  }

  const { excludeCategory, ...options } = query.data
  const result = await claimContentSignal({ ...options, excludeCategories: excludeCategory })
  if (!result) {
    return Response.json({ error: 'No available content signal' }, { status: 404 })
  }
  return Response.json(result, { headers: { 'Cache-Control': 'no-store' } })
}
