import 'dotenv/config'

import type { Config } from 'drizzle-kit'

const { LOCAL_DB_PATH, DATABASE_ID, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID } = process.env

if (!LOCAL_DB_PATH && (!DATABASE_ID || !CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID)) {
  throw new Error('Set LOCAL_DB_PATH for local SQLite files or provide CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, and DATABASE_ID for Cloudflare D1.')
}

const baseConfig = {
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  verbose: true,
  strict: true,
  dialect: 'sqlite'
} satisfies Partial<Config>

const config: Config = LOCAL_DB_PATH
  ? {
      ...baseConfig,
      dbCredentials: {
        url: LOCAL_DB_PATH
      }
    }
  : {
      ...baseConfig,
      driver: 'd1-http',
      dbCredentials: {
        databaseId: DATABASE_ID!,
        token: CLOUDFLARE_API_TOKEN!,
        accountId: CLOUDFLARE_ACCOUNT_ID!
      }
    }

export default config
