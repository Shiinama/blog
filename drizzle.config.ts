import { defineConfig } from 'drizzle-kit'

if (process.env.CLOUDFLARE_API_TOKEN === undefined) {
  try {
    process.loadEnvFile()
  } catch {
    // No .env: `generate` works without credentials.
  }
}

// `generate` only needs the schema; `studio` talks to production D1 over the HTTP API.
export default defineConfig({
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: 'sqlite',
  driver: 'd1-http',
  strict: true,
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.DATABASE_ID!,
    token: process.env.CLOUDFLARE_API_TOKEN!
  }
})
