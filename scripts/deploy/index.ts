/**
 * Production deploy: sync runtime secrets, apply pending D1 migrations, build & deploy the Worker.
 *   pnpm deploy:prod
 *
 * `.env` also holds build/tooling credentials (CLOUDFLARE_API_TOKEN, …). Only the runtime secrets
 * below are uploaded to the Worker; any other secret found on the Worker is removed.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const RUNTIME_SECRETS = [
  'AUTH_SECRET',
  'AUTH_TRUST_HOST',
  'AUTH_GOOGLE_ID',
  'AUTH_GOOGLE_SECRET',
  'AUTH_GITHUB_ID',
  'AUTH_GITHUB_SECRET',
  'AUTH_RESEND_KEY',
  'ADMIN_USER_IDS',
  'CONTENT_SIGNALS_API_KEY',
  'DOUYIN_SUBTITLE_API_KEY',
  'APIFY_TOKEN',
  'OPENAI_API_KEY',
  'OPENAI_BASE_URL',
  'AI_DAILY_MODEL'
] as const
const REQUIRED: (typeof RUNTIME_SECRETS)[number][] = ['AUTH_SECRET', 'ADMIN_USER_IDS', 'CONTENT_SIGNALS_API_KEY']

const run = (args: string[]) => execFileSync('pnpm', ['exec', 'wrangler', ...args], { stdio: 'inherit' })
/** Non-interactive (no TTY on stdin): wrangler takes the default answer for its confirmation prompts. */
const runUnattended = (args: string[]) =>
  execFileSync('pnpm', ['exec', 'wrangler', ...args], {
    stdio: ['ignore', 'inherit', 'inherit'],
    env: { ...process.env, CI: 'true' }
  })
const read = (args: string[]) => execFileSync('pnpm', ['exec', 'wrangler', ...args], { encoding: 'utf8' })

process.loadEnvFile('.env')

const missing = REQUIRED.filter((name) => !process.env[name])
if (missing.length) {
  console.error(`Missing required secrets in .env: ${missing.join(', ')}`)
  process.exit(1)
}

console.log('🔐 Syncing runtime secrets')
const secrets = Object.fromEntries(
  RUNTIME_SECRETS.flatMap((name) => (process.env[name] ? [[name, process.env[name]]] : []))
)
const file = join(mkdtempSync(join(tmpdir(), 'blog-secrets-')), 'secrets.json')
writeFileSync(file, JSON.stringify(secrets), { mode: 0o600 })
try {
  run(['secret', 'bulk', file])
} finally {
  rmSync(file)
}

console.log('🗄️  Applying D1 migrations')
run(['d1', 'migrations', 'apply', 'BLOG_DATABASE', '--remote'])

console.log('🚀 Building and deploying')
execFileSync('pnpm', ['run', 'deploy'], { stdio: 'inherit' })

// Only once the new version is live: the previous one may still read these.
const existing = (JSON.parse(read(['secret', 'list', '--format', 'json'])) as { name: string }[]).map((s) => s.name)
for (const name of existing.filter((name) => !(name in secrets))) {
  console.log(`🧹 Removing stale secret ${name}`)
  runUnattended(['secret', 'delete', name])
}
