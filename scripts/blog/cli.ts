#!/usr/bin/env tsx
/**
 * blog CLI — manage posts in the blog's D1 database from the command line.
 *
 * Local mode (default) uses the miniflare sqlite file under .wrangler/;
 * --remote talks to the production D1 database over the Cloudflare HTTP API
 * (requires CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN / DATABASE_ID in .env).
 *
 * Markdown in/out uses frontmatter: title, summary, category, tags, status,
 * language, coverImageUrl, publishedAt.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'

import { and, desc, eq, like, or, sql, type SQL } from 'drizzle-orm'
import matter from 'gray-matter'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import { categories, posts, postStatusEnum, type PostStatus } from '@/drizzle/schema'
import { calculateReadingTime, extractSummary } from '@/lib/posts/utils'

import { createCliDb, type CliDb } from './db'

type GlobalArgs = { remote: boolean; json: boolean }

function db(argv: GlobalArgs): CliDb {
  return createCliDb(argv.remote)
}

function fail(message: string): never {
  console.error(`Error: ${message}`)
  process.exit(1)
}

function fmtDate(value: Date | number | null | undefined): string {
  if (!value) return '-'
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? '-' : d.toISOString().slice(0, 16).replace('T', ' ')
}

async function resolveCategory(database: CliDb, keyOrId: string) {
  const found = await database
    .select()
    .from(categories)
    .where(or(eq(categories.key, keyOrId), eq(categories.id, keyOrId)))
  return found[0] ?? null
}

async function findPost(database: CliDb, idOrPrefix: string) {
  const exact = await database.select().from(posts).where(eq(posts.id, idOrPrefix))
  if (exact[0]) return exact[0]
  const prefixed = await database
    .select()
    .from(posts)
    .where(like(posts.id, `${idOrPrefix}%`))
    .limit(2)
  if (prefixed.length > 1) fail(`id prefix "${idOrPrefix}" is ambiguous (${prefixed.length}+ matches)`)
  return prefixed[0] ?? null
}

function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === 'string')
    return value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
  return []
}

function normalizeStatus(value: string): PostStatus {
  const upper = value.trim().toUpperCase()
  if (!(postStatusEnum as readonly string[]).includes(upper)) {
    fail(`invalid status "${value}" (expected ${postStatusEnum.join(' | ')})`)
  }
  return upper as PostStatus
}

type PostInput = {
  title?: string
  summary?: string
  content?: string
  categoryKeyOrId?: string
  tags?: string[]
  status?: PostStatus
  language?: string
  coverImageUrl?: string | null
  publishedAt?: Date | null
}

function readMarkdownFile(file: string): PostInput {
  const raw = readFileSync(resolve(file), 'utf-8')
  const { data, content } = matter(raw)
  const input: PostInput = { content: content.trim() }
  if (data.title) input.title = String(data.title)
  if (data.summary) input.summary = String(data.summary)
  if (data.category) input.categoryKeyOrId = String(data.category)
  if (data.tags !== undefined) input.tags = parseTags(data.tags)
  if (data.status) input.status = normalizeStatus(String(data.status))
  if (data.language) input.language = String(data.language)
  if (data.coverImageUrl !== undefined) input.coverImageUrl = data.coverImageUrl ? String(data.coverImageUrl) : null
  if (data.publishedAt) {
    const d = new Date(String(data.publishedAt))
    if (Number.isNaN(d.getTime())) fail(`invalid publishedAt in frontmatter: ${data.publishedAt}`)
    input.publishedAt = d
  }
  return input
}

function mergeCliOverrides(input: PostInput, argv: Record<string, unknown>): PostInput {
  if (argv.title) input.title = String(argv.title)
  if (argv.summary) input.summary = String(argv.summary)
  if (argv.category) input.categoryKeyOrId = String(argv.category)
  if (argv.tags !== undefined && argv.tags !== '') input.tags = parseTags(argv.tags)
  if (argv.status) input.status = normalizeStatus(String(argv.status))
  if (argv.language) input.language = String(argv.language)
  if (argv.cover !== undefined) input.coverImageUrl = argv.cover ? String(argv.cover) : null
  return input
}

async function cmdList(argv: GlobalArgs & { status?: string; category?: string; search?: string; limit: number }) {
  const database = db(argv)
  const conditions: SQL<unknown>[] = []
  if (argv.status) conditions.push(eq(posts.status, normalizeStatus(argv.status)))
  if (argv.category) {
    const cat = await resolveCategory(database, argv.category)
    if (!cat) fail(`category "${argv.category}" not found`)
    conditions.push(eq(posts.categoryId, cat.id))
  }
  if (argv.search) {
    const pattern = `%${argv.search}%`
    conditions.push(or(like(posts.title, pattern), like(posts.summary, pattern)) as SQL<unknown>)
  }

  const rows = await database
    .select({
      id: posts.id,
      title: posts.title,
      status: posts.status,
      categoryId: posts.categoryId,
      categoryKey: categories.key,
      tags: posts.tags,
      language: posts.language,
      publishedAt: posts.publishedAt,
      updatedAt: posts.updatedAt
    })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(posts.updatedAt))
    .limit(argv.limit)

  if (argv.json) {
    console.log(JSON.stringify(rows, null, 2))
    return
  }
  if (!rows.length) {
    console.log('No posts found.')
    return
  }
  for (const row of rows) {
    console.log(
      [
        row.id.slice(0, 8),
        row.status.padEnd(9),
        `[${row.categoryKey ?? '?'}]`.padEnd(14),
        fmtDate(row.publishedAt ?? row.updatedAt),
        row.title
      ].join('  ')
    )
  }
  console.log(`\n${rows.length} post(s). Use \`blog get <id>\` for details (id prefix ok).`)
}

async function cmdGet(argv: GlobalArgs & { id: string }) {
  const database = db(argv)
  const post = await findPost(database, argv.id)
  if (!post) fail(`post "${argv.id}" not found`)
  if (argv.json) {
    console.log(JSON.stringify(post, null, 2))
    return
  }
  const cat = await database.select().from(categories).where(eq(categories.id, post.categoryId))
  console.log(`id:          ${post.id}`)
  console.log(`title:       ${post.title}`)
  console.log(`status:      ${post.status}`)
  console.log(`category:    ${cat[0]?.key ?? post.categoryId}`)
  console.log(`tags:        ${(post.tags ?? []).join(', ') || '-'}`)
  console.log(`language:    ${post.language}`)
  console.log(`published:   ${fmtDate(post.publishedAt)}`)
  console.log(`updated:     ${fmtDate(post.updatedAt)}`)
  console.log(`readingTime: ${post.readingTime} min`)
  console.log(`cover:       ${post.coverImageUrl ?? '-'}`)
  console.log(`summary:     ${post.summary}`)
  console.log('---')
  console.log(post.content)
}

function postToMarkdown(post: typeof posts.$inferSelect, categoryKey: string | null): string {
  return matter.stringify(`${post.content.trim()}\n`, {
    title: post.title,
    summary: post.summary,
    category: categoryKey ?? post.categoryId,
    tags: post.tags ?? [],
    status: post.status,
    language: post.language,
    coverImageUrl: post.coverImageUrl ?? '',
    publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : '',
    id: post.id
  })
}

async function cmdExport(argv: GlobalArgs & { id: string; out?: string }) {
  const database = db(argv)
  const post = await findPost(database, argv.id)
  if (!post) fail(`post "${argv.id}" not found`)
  const cat = await database.select().from(categories).where(eq(categories.id, post.categoryId))
  const markdown = postToMarkdown(post, cat[0]?.key ?? null)
  if (argv.out) {
    const target = resolve(argv.out)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, markdown)
    console.log(`Exported ${post.id.slice(0, 8)} (${post.title}) -> ${target}`)
  } else {
    process.stdout.write(markdown)
  }
}

async function cmdCreate(argv: GlobalArgs & Record<string, unknown> & { file?: string }) {
  const database = db(argv)
  const input = mergeCliOverrides(argv.file ? readMarkdownFile(argv.file) : {}, argv)

  if (!input.title) fail('title is required (frontmatter `title:` or --title)')
  if (!input.content || input.content.length < 1) fail('content is required (markdown body or --file)')
  if (!input.categoryKeyOrId) fail('category is required (frontmatter `category:` or --category)')

  const cat = await resolveCategory(database, input.categoryKeyOrId)
  if (!cat) {
    const all = await database.select({ key: categories.key }).from(categories)
    fail(`category "${input.categoryKeyOrId}" not found. Available: ${all.map((c) => c.key).join(', ') || '(none — create one with `blog categories --add <key>`)'}`)
  }

  const status: PostStatus = input.status ?? 'DRAFT'
  const now = new Date()
  const created = await database
    .insert(posts)
    .values({
      title: input.title.trim(),
      summary: input.summary?.trim() || extractSummary(input.content),
      content: input.content,
      coverImageUrl: input.coverImageUrl ?? null,
      categoryId: cat.id,
      status,
      tags: input.tags ?? [],
      language: input.language ?? 'zh',
      readingTime: calculateReadingTime(input.content),
      publishedAt: status === 'PUBLISHED' ? (input.publishedAt ?? now) : null,
      createdAt: now,
      updatedAt: now
    })
    .returning({ id: posts.id, title: posts.title, status: posts.status })

  const post = created[0]!
  if (argv.json) console.log(JSON.stringify(post, null, 2))
  else console.log(`Created ${post.status} post ${post.id}\n  ${post.title}`)
}

async function cmdUpdate(argv: GlobalArgs & Record<string, unknown> & { id: string; file?: string }) {
  const database = db(argv)
  const post = await findPost(database, argv.id)
  if (!post) fail(`post "${argv.id}" not found`)

  const input = mergeCliOverrides(argv.file ? readMarkdownFile(argv.file) : {}, argv)
  const changes: Partial<typeof posts.$inferInsert> = { updatedAt: new Date() }

  if (input.title) changes.title = input.title.trim()
  if (input.content) {
    changes.content = input.content
    changes.readingTime = calculateReadingTime(input.content)
  }
  if (input.summary) changes.summary = input.summary.trim()
  else if (input.content && !post.summary) changes.summary = extractSummary(input.content)
  if (input.tags) changes.tags = input.tags
  if (input.language) changes.language = input.language
  if (input.coverImageUrl !== undefined) changes.coverImageUrl = input.coverImageUrl
  if (input.categoryKeyOrId) {
    const cat = await resolveCategory(database, input.categoryKeyOrId)
    if (!cat) fail(`category "${input.categoryKeyOrId}" not found`)
    changes.categoryId = cat.id
  }
  if (input.status) {
    changes.status = input.status
    changes.publishedAt = input.status === 'PUBLISHED' ? (input.publishedAt ?? post.publishedAt ?? new Date()) : null
  } else if (input.publishedAt) {
    changes.publishedAt = input.publishedAt
  }

  const changedKeys = Object.keys(changes).filter((k) => k !== 'updatedAt')
  if (!changedKeys.length) fail('nothing to update — pass --file or field flags')

  await database.update(posts).set(changes).where(eq(posts.id, post.id))
  console.log(`Updated ${post.id.slice(0, 8)} (${changedKeys.join(', ')})`)
}

async function setStatus(argv: GlobalArgs & { id: string }, status: PostStatus) {
  const database = db(argv)
  const post = await findPost(database, argv.id)
  if (!post) fail(`post "${argv.id}" not found`)
  await database
    .update(posts)
    .set({
      status,
      publishedAt: status === 'PUBLISHED' ? (post.publishedAt ?? new Date()) : null,
      updatedAt: new Date()
    })
    .where(eq(posts.id, post.id))
  console.log(`${status === 'PUBLISHED' ? 'Published' : 'Unpublished'} ${post.id.slice(0, 8)}: ${post.title}`)
  if (status === 'PUBLISHED') {
    const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '')
    if (base) console.log(`  ${base}/content/${post.id}`)
  }
}

async function cmdDelete(argv: GlobalArgs & { id: string; yes: boolean }) {
  const database = db(argv)
  const post = await findPost(database, argv.id)
  if (!post) fail(`post "${argv.id}" not found`)
  if (!argv.yes) fail(`refusing to delete "${post.title}" (${post.id.slice(0, 8)}) without --yes`)
  await database.delete(posts).where(eq(posts.id, post.id))
  console.log(`Deleted ${post.id.slice(0, 8)}: ${post.title}`)
}

async function cmdCategories(argv: GlobalArgs & { add?: string; visible?: boolean }) {
  const database = db(argv)
  if (argv.add) {
    const key = argv.add.trim()
    const existing = await database.select().from(categories).where(eq(categories.key, key))
    if (existing[0]) fail(`category "${key}" already exists`)
    const maxRow = await database.select({ max: sql<number>`coalesce(max(${categories.sortOrder}), 0)` }).from(categories)
    const created = await database
      .insert(categories)
      .values({
        key,
        sortOrder: (maxRow[0]?.max ?? 0) + 1,
        isVisible: argv.visible ?? true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()
    console.log(`Created category ${created[0]!.key} (${created[0]!.id})`)
    return
  }
  const rows = await database
    .select({
      id: categories.id,
      key: categories.key,
      isVisible: categories.isVisible,
      sortOrder: categories.sortOrder,
      postCount: sql<number>`(select count(*) from posts where posts.category_id = ${categories.id})`
    })
    .from(categories)
    .orderBy(categories.sortOrder)
  if (argv.json) {
    console.log(JSON.stringify(rows, null, 2))
    return
  }
  if (!rows.length) {
    console.log('No categories. Create one: blog categories --add <key>')
    return
  }
  for (const row of rows) {
    console.log(`${row.key.padEnd(20)} ${row.isVisible ? 'visible' : 'hidden '}  posts:${row.postCount}  ${row.id}`)
  }
}

const contentOptions = {
  file: { alias: 'f', type: 'string' as const, describe: 'markdown file (frontmatter: title/summary/category/tags/status/language/coverImageUrl/publishedAt)' },
  title: { type: 'string' as const, describe: 'post title (overrides frontmatter)' },
  summary: { type: 'string' as const, describe: 'summary (defaults to first paragraph)' },
  category: { alias: 'c', type: 'string' as const, describe: 'category key or id' },
  tags: { type: 'string' as const, describe: 'comma-separated tags' },
  status: { type: 'string' as const, describe: 'DRAFT | PUBLISHED' },
  language: { type: 'string' as const, describe: 'post language (default zh)' },
  cover: { type: 'string' as const, describe: 'cover image url' }
}

void yargs(hideBin(process.argv))
  .scriptName('blog')
  .option('remote', { alias: 'r', type: 'boolean', default: false, describe: 'use the remote D1 database (Cloudflare HTTP API)' })
  .option('json', { type: 'boolean', default: false, describe: 'JSON output' })
  .command(
    'list',
    'list posts',
    (y) =>
      y
        .option('status', { alias: 's', type: 'string', describe: 'DRAFT | PUBLISHED' })
        .option('category', { alias: 'c', type: 'string', describe: 'category key or id' })
        .option('search', { alias: 'q', type: 'string', describe: 'search in title/summary' })
        .option('limit', { alias: 'n', type: 'number', default: 20 }),
    (argv) => cmdList(argv as never)
  )
  .command(
    'get <id>',
    'show a post (id prefix ok)',
    (y) => y.positional('id', { type: 'string', demandOption: true }),
    (argv) => cmdGet(argv as never)
  )
  .command(
    'export <id>',
    'export a post as markdown with frontmatter',
    (y) =>
      y
        .positional('id', { type: 'string', demandOption: true })
        .option('out', { alias: 'o', type: 'string', describe: 'output file (default stdout)' }),
    (argv) => cmdExport(argv as never)
  )
  .command('create', 'create a post from markdown', (y) => y.options(contentOptions), (argv) => cmdCreate(argv as never))
  .command(
    'update <id>',
    'update fields of a post',
    (y) => y.positional('id', { type: 'string', demandOption: true }).options(contentOptions),
    (argv) => cmdUpdate(argv as never)
  )
  .command(
    'publish <id>',
    'set a post to PUBLISHED',
    (y) => y.positional('id', { type: 'string', demandOption: true }),
    (argv) => setStatus(argv as never, 'PUBLISHED')
  )
  .command(
    'unpublish <id>',
    'set a post back to DRAFT',
    (y) => y.positional('id', { type: 'string', demandOption: true }),
    (argv) => setStatus(argv as never, 'DRAFT')
  )
  .command(
    'delete <id>',
    'delete a post',
    (y) =>
      y.positional('id', { type: 'string', demandOption: true }).option('yes', { alias: 'y', type: 'boolean', default: false, describe: 'confirm deletion' }),
    (argv) => cmdDelete(argv as never)
  )
  .command(
    'categories',
    'list categories, or --add <key> to create one',
    (y) =>
      y
        .option('add', { type: 'string', describe: 'create a category with this key' })
        .option('visible', { type: 'boolean', describe: 'visibility for --add (default true)' }),
    (argv) => cmdCategories(argv as never)
  )
  .demandCommand(1, 'Specify a command. Try: blog list')
  .strict()
  .help()
  .fail((msg, err) => {
    console.error(`Error: ${msg ?? err?.message}`)
    process.exit(1)
  })
  .parse()
