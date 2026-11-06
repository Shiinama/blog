/**
 * One-off: migrate the legacy (pre-2026-11) database to `0000_baseline` in place (schema, data cleanup, history).
 *
 *   pnpm db:rebuild --local
 *   pnpm db:rebuild --remote   # back up first: wrangler d1 export blog --remote --output backup.sql
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const remote = process.argv.includes('--remote')
if (!remote && !process.argv.includes('--local')) {
  console.error('Usage: pnpm db:rebuild --local | --remote')
  process.exit(1)
}

const migrationsDir = join(process.cwd(), 'drizzle', 'migrations')
const baselineName = readdirSync(migrationsDir).find((file) => /^0000_.*\.sql$/.test(file))
if (!baselineName) throw new Error('Baseline migration not found in drizzle/migrations')

const baseline = readFileSync(join(migrationsDir, baselineName), 'utf8').replaceAll('--> statement-breakpoint', '')
const script = readFileSync(join(import.meta.dirname, 'legacy-to-baseline.sql'), 'utf8')
  .replace('-- @@BASELINE@@', baseline)
  .replace('@@BASELINE_NAME@@', baselineName)
const file = join(mkdtempSync(join(tmpdir(), 'blog-rebuild-')), 'rebuild.sql')
writeFileSync(file, script)

console.log(`Migrating legacy schema → ${baselineName} (${remote ? 'remote' : 'local'})`)
execFileSync(
  'pnpm',
  ['exec', 'wrangler', 'd1', 'execute', 'BLOG_DATABASE', remote ? '--remote' : '--local', '--file', file, '--yes'],
  {
    stdio: 'inherit'
  }
)
