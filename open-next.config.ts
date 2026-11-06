import { defineCloudflareConfig } from '@opennextjs/cloudflare'
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache'

// Pages render per request (they read the session), so only build-time static output lands in R2.
// No tag cache / queue: nothing calls revalidateTag/revalidatePath or uses time-based ISR.
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache
})
