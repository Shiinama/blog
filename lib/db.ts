import { getCloudflareContext } from '@opennextjs/cloudflare'
import { drizzle } from 'drizzle-orm/d1'
import { connection } from 'next/server'

import * as schema from '@/drizzle/schema'

export function createDb(database: D1Database) {
  return drizzle(database, { schema })
}

export type DB = ReturnType<typeof createDb>

/**
 * D1 for the current request. Reading the database is request-time work: `connection()` keeps
 * Next from prerendering callers at build time (builds never touch production data).
 */
export async function getDb(): Promise<DB> {
  await connection()
  const { env } = await getCloudflareContext({ async: true })
  return createDb(env.BLOG_DATABASE)
}

export async function getBucket(): Promise<R2Bucket> {
  const { env } = await getCloudflareContext({ async: true })
  return env.BLOG_BUCKET
}
