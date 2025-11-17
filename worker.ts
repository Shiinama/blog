// @ts-ignore The `.open-next/worker.js` file is generated at build time by OpenNext
import handler from './.open-next/worker.js'

import type { ExportedHandler } from '@cloudflare/workers-types'

const worker: ExportedHandler<CloudflareEnv> = {
  fetch(request, env, ctx) {
    return handler.fetch(request, env, ctx)
  }
}

export default worker

// Re-export anything OpenNext generates (Durable Objects, queue handlers, etc.)
// export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from './.open-next/worker.js'
