// @ts-ignore The `.open-next/worker.js` file is generated at build time by OpenNext
import handler from './.open-next/worker.js'
import { publishAiDailyPost } from './lib/ai-daily'

import type { ExportedHandler } from '@cloudflare/workers-types'

const worker: ExportedHandler<CloudflareEnv> = {
  fetch(request, env, ctx) {
    return handler.fetch(request, env, ctx)
  },
  scheduled(_event, env, ctx) {
    ctx.waitUntil(
      publishAiDailyPost({ env }).catch((error) => {
        console.error('Failed to publish scheduled AI daily post', error)
      })
    )
  }
}

export default worker

// Re-export anything OpenNext generates (Durable Objects, queue handlers, etc.)
// export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from './.open-next/worker.js'
