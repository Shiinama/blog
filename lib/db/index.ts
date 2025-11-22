import { getCloudflareContext } from '@opennextjs/cloudflare'
import { drizzle as drizzleD1 } from 'drizzle-orm/d1'

import * as schema from '@/drizzle/schema'

import type { DrizzleD1Database } from 'drizzle-orm/d1'

const getEnvDb = () => {
  const context = getCloudflareContext()
  if (!context?.env?.BLOG_DATABASE) {
    throw new Error('Cloudflare D1 binding `DB` is not available on this request.')
  }
  return drizzleD1(context.env.BLOG_DATABASE, { schema })
}

export const createDb = (): DrizzleD1Database<typeof schema> => {
  return getEnvDb()
}

export type DB = ReturnType<typeof createDb>
