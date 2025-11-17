import { getCloudflareContext } from '@opennextjs/cloudflare'
import type { D1Database } from '@cloudflare/workers-types'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { drizzle as drizzleD1 } from 'drizzle-orm/d1'
import { drizzle as drizzleProxy } from 'drizzle-orm/sqlite-proxy'

import type { AsyncRemoteCallback } from 'drizzle-orm/sqlite-proxy'

import { d1HttpDriver } from '@/lib/db/d1-http-driver'

import * as schema from '@/drizzle/schema'

const wrappedDriver: AsyncRemoteCallback = async (sql, params, method) => {
  if (method === 'values') {
    return d1HttpDriver(sql, params, 'all')
  }
  return d1HttpDriver(sql, params, method)
}

const createProxyDb = () => drizzleProxy(wrappedDriver, { schema }) as DrizzleD1Database<typeof schema>

const getEnvDb = () => {
  const context = getCloudflareContext()
  if (!context?.env?.blog) {
    throw new Error('Cloudflare D1 binding `DB` is not available on this request.')
  }
  return drizzleD1(context.env.blog, { schema })
}

export const createDb = (): DrizzleD1Database<typeof schema> => {
  if (process.env.NEXT_PUBLIC_DB_PROXY === '1') {
    return createProxyDb()
  }

  return getEnvDb()
}

export type DB = ReturnType<typeof createDb>
export * from '@/drizzle/schema'
