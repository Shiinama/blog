import { getCloudflareContext } from '@opennextjs/cloudflare'
import { drizzle as drizzleD1 } from 'drizzle-orm/d1'
import { drizzle as drizzleProxy } from 'drizzle-orm/sqlite-proxy'

import * as schema from '@/drizzle/schema'

import { d1HttpDriver } from './d1-http-driver'

import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { AsyncRemoteCallback } from 'drizzle-orm/sqlite-proxy'

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
