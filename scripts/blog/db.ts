import 'dotenv/config'

import { existsSync, readdirSync } from 'fs'
import { join } from 'path'

import Database from 'better-sqlite3'
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3'
import { drizzle as drizzleProxy } from 'drizzle-orm/sqlite-proxy'

import * as schema from '@/drizzle/schema'
import { d1HttpDriver } from '@/lib/db/d1-http-driver'

import type { SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy'
import type { AsyncRemoteCallback } from 'drizzle-orm/sqlite-proxy'

// Both drivers are used through the async (thenable) query interface,
// so the CLI treats them uniformly as the remote-database type.
export type CliDb = SqliteRemoteDatabase<typeof schema>

export function findLocalSqliteFile(): string | null {
  const basePath = join(process.cwd(), '.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject')
  if (!existsSync(basePath)) return null

  function findFile(dir: string): string | null {
    for (const file of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, file.name)
      if (file.isDirectory()) {
        const found = findFile(path)
        if (found) return found
      } else if (file.name.endsWith('.sqlite') && file.name !== 'metadata.sqlite') {
        return path
      }
    }
    return null
  }

  return findFile(basePath)
}

export function createCliDb(remote: boolean): CliDb {
  if (remote) {
    const wrappedDriver: AsyncRemoteCallback = async (sql, params, method) => {
      if (method === 'values') {
        return d1HttpDriver(sql, params, 'all')
      }
      return d1HttpDriver(sql, params, method)
    }
    return drizzleProxy(wrappedDriver, { schema })
  }

  const sqliteFile = process.env.LOCAL_DB_PATH || findLocalSqliteFile()
  if (!sqliteFile) {
    console.error('Local D1 database not found. Run `pnpm dev` once to create it, or set LOCAL_DB_PATH.')
    process.exit(1)
  }
  const client = new Database(sqliteFile)
  return drizzleSqlite(client, { schema }) as unknown as CliDb
}
