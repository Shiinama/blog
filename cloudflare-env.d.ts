import type { D1Database, Fetcher } from '@cloudflare/workers-types'

declare global {
  interface CloudflareEnv {
    /**
     * Static assets produced by OpenNext (`.open-next/assets`).
     */
    ASSETS: Fetcher
    /** Cloudflare D1 binding for application data. */
    DB: D1Database
    [key: string]: unknown
  }
}

export type { CloudflareEnv }
