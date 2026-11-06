import { getPlatformProxy } from 'wrangler'

import { createDb, type DB } from '@/lib/db'

export type CliDb = DB

/** The app's own D1 binding via wrangler: local miniflare by default, production with `--remote`. */
export async function createCliDb(remote: boolean): Promise<{ db: CliDb; dispose: () => Promise<void> }> {
  const proxy = await getPlatformProxy<CloudflareEnv>({ remoteBindings: remote })
  return { db: createDb(proxy.env.BLOG_DATABASE), dispose: proxy.dispose }
}
