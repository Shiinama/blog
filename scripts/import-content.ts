import 'dotenv/config'

import Database from 'better-sqlite3'
import { existsSync, readdirSync } from 'fs'
import fs from 'fs/promises'
import path from 'path'

import { drizzle as drizzleBetter } from 'drizzle-orm/better-sqlite3'
import matter from 'gray-matter'
import { execSync } from 'child_process'

import { CATEGORY_PRESETS } from '../constant/category-presets'
import { type DB } from '../lib/db'
import * as schema from '../drizzle/schema'
import { calculateReadingTime, extractSummary, normalizeSlug } from '../lib/posts/utils'

const categoriesTable = schema.categories
const postsTable = schema.posts
type Category = schema.Category
type PostStatus = schema.PostStatus

const CONTENT_DIR = path.join(process.cwd(), 'content')
const LOCAL_DB_BASE = path.join(process.cwd(), '.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject')

interface PostUpsertPayload {
  title: string
  slug: string
  summary: string
  content: string
  coverImageUrl: string | null
  status: PostStatus
  categoryId: string
  sortOrder: number
  tags: string[]
  language: string
  readingTime: number
  isSubscriptionOnly: boolean
}

type Frontmatter = Record<string, unknown>

const categoryCache = new Map<string, Category>()
let dynamicCategoryIndex = 0

type DatabaseContext = {
  db: DB
  close?: () => void
}

async function getFileTimestamps(filePath: string) {
  const stat = await fs.stat(filePath)

  return {
    createdAt: stat.birthtime && stat.birthtime.getTime() > 0 ? stat.birthtime : stat.mtime,
    updatedAt: stat.mtime
  }
}

function getGitTimestamps(filePath: string) {
  try {
    const createdStr = execSync(`git log --diff-filter=A --follow --format=%aI -- "${filePath}" | tail -1`, {
      encoding: 'utf8'
    }).trim()

    const updatedStr = execSync(`git log -1 --format=%aI -- "${filePath}"`, { encoding: 'utf8' }).trim()

    return {
      createdAt: createdStr ? new Date(createdStr) : null,
      updatedAt: updatedStr ? new Date(updatedStr) : null
    }
  } catch {
    return { createdAt: null, updatedAt: null }
  }
}

function findLocalSqliteFile(): string | null {
  const manualPath = process.env.LOCAL_DB_PATH || process.env.SQLITE_PATH
  if (manualPath) {
    if (!existsSync(manualPath)) {
      throw new Error(`Local database file not found at "${manualPath}". Check LOCAL_DB_PATH/SQLITE_PATH.`)
    }
    return manualPath
  }

  if (!existsSync(LOCAL_DB_BASE)) {
    return null
  }

  const stack = [LOCAL_DB_BASE]
  while (stack.length > 0) {
    const current = stack.pop()!
    const entries = readdirSync(current, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(fullPath)
        continue
      }

      if (entry.isFile() && entry.name.endsWith('.sqlite')) {
        return fullPath
      }
    }
  }

  return null
}

function createDatabaseContext(): DatabaseContext {
  const localFile = findLocalSqliteFile()

  console.log(`Using local SQLite database: ${localFile}`)
  const sqlite = new Database(localFile!)
  return {
    db: drizzleBetter(sqlite, { schema }) as unknown as DB,
    close: () => sqlite.close()
  }
}

const databaseContext = createDatabaseContext()
const db = databaseContext.db

async function ensurePresetCategories() {
  for (const preset of CATEGORY_PRESETS) {
    const now = new Date()
    const result = await db
      .insert(categoriesTable)
      .values({
        key: preset.i18nKey,
        sortOrder: preset.sortOrder,
        isVisible: preset.isVisible,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: categoriesTable.key,
        set: {
          sortOrder: preset.sortOrder,
          isVisible: preset.isVisible,
          updatedAt: now
        }
      })
      .returning()

    const category =
      result[0] ??
      (await db.query.categories.findFirst({
        where: (category, { eq }) => eq(category.key, preset.i18nKey)
      }))
    if (category) {
      categoryCache.set(preset.folder, category)
      categoryCache.set(preset.i18nKey, category)
    }
  }
}

async function getCategoryForFolder(folder: string) {
  if (categoryCache.has(folder)) {
    return categoryCache.get(folder)!
  }

  const preset = CATEGORY_PRESETS.find((item) => item.folder === folder)
  if (preset && categoryCache.has(preset.folder)) {
    return categoryCache.get(preset.folder)!
  }

  const categoryKey =
    folder
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || folder
  const result = await db
    .insert(categoriesTable)
    .values({
      key: categoryKey,
      sortOrder: CATEGORY_PRESETS.length + dynamicCategoryIndex,
      isVisible: false,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: categoriesTable.key,
      set: {
        updatedAt: new Date()
      }
    })
    .returning()

  const category =
    result[0] ??
    (await db.query.categories.findFirst({
      where: (category, { eq }) => eq(category.key, categoryKey)
    }))
  if (!category) {
    throw new Error(`Failed to resolve category for folder "${folder}"`)
  }
  categoryCache.set(folder, category)
  categoryCache.set(category.key, category)
  dynamicCategoryIndex += 1
  return category
}

async function collectMdxFiles(dir: string) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const resolved = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const nested = await collectMdxFiles(resolved)
      files.push(...nested)
      continue
    }

    if (entry.isFile() && entry.name.endsWith('.mdx')) {
      files.push(resolved)
    }
  }

  return files
}

function extractHeading(content: string) {
  const match = content.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : null
}

function removeLeadingHeading(content: string) {
  const match = content.match(/^\s*#\s+[^\r\n]*(?:\r?\n)?/)
  if (!match) {
    return content
  }
  return content.slice(match[0].length)
}

function deriveSortOrder(filePath: string): number {
  const baseName = path.basename(filePath, path.extname(filePath))
  const match = baseName.match(/^(\d+)/)
  return match ? Number(match[1]) : 0
}

function parseDate(value?: string | number | Date) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date
}

function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim()).filter(Boolean)
  }
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
  }
  return []
}

interface BuildPostPayloadOptions {
  frontmatter: Frontmatter
  content: string
  slug: string
  categoryId: string
  sortOrder: number
}

function buildPostPayload({
  frontmatter,
  content,
  slug,
  categoryId,
  sortOrder
}: BuildPostPayloadOptions): PostUpsertPayload {
  const titleCandidate = typeof frontmatter.title === 'string' ? frontmatter.title.trim() : ''
  const title = titleCandidate || extractHeading(content) || ''
  const cleanedContent = removeLeadingHeading(content)
  const summary = extractSummary(cleanedContent)
  const readingTime = calculateReadingTime(cleanedContent)
  const coverImageCandidate = frontmatter.coverImageUrl ?? frontmatter.coverImage ?? frontmatter.cover
  const coverImageUrl = typeof coverImageCandidate === 'string' ? coverImageCandidate.trim() || null : null
  const tags = parseTags(frontmatter.tags)
  const languageCandidate = typeof frontmatter.language === 'string' ? frontmatter.language.trim() : ''
  const language = languageCandidate || 'zh'

  return {
    title,
    slug,
    summary,
    content: cleanedContent,
    coverImageUrl,
    status: 'PUBLISHED',
    categoryId,
    sortOrder,
    tags,
    language,
    readingTime,
    isSubscriptionOnly: false
  }
}

async function importMdxFile(filePath: string) {
  const relative = path.relative(CONTENT_DIR, filePath)
  const folder = relative.split(path.sep)[0]
  const category = await getCategoryForFolder(folder)

  const fileRaw = await fs.readFile(filePath, 'utf-8')
  const { data, content } = matter(fileRaw)
  const frontmatter = data as Frontmatter

  const slugPath = relative.replace(/\\/g, '/').replace(/\.mdx?$/, '')
  const slug = normalizeSlug(slugPath)
  const sortOrder =
    typeof frontmatter.sortOrder === 'number'
      ? frontmatter.sortOrder
      : Number.isFinite(Number(frontmatter.sortOrder))
        ? Number(frontmatter.sortOrder)
        : deriveSortOrder(filePath)

  const postPayload = buildPostPayload({
    frontmatter,
    content,
    slug,
    categoryId: category.id,
    sortOrder
  })

  const gitTimes = getGitTimestamps(filePath)
  const fileTimes = await getFileTimestamps(filePath)

  const createdAt =
    parseDate(frontmatter.createdAt as any) ??
    parseDate(frontmatter.date as any) ??
    gitTimes.createdAt ??
    fileTimes.createdAt ??
    new Date()

  await db.insert(postsTable).values({
    ...postPayload,
    authorId: '31a8a939-c995-42fa-9b37-a242014a1b43',
    createdAt: createdAt,
    updatedAt: createdAt,
    publishedAt: createdAt
  })

  console.log(`Imported: ${slug}${postPayload.isSubscriptionOnly ? ' (subscription only)' : ''}`)
}

async function main() {
  await ensurePresetCategories()

  const files = await collectMdxFiles(CONTENT_DIR)
  console.log(`Found ${files.length} MDX files. Starting import...`)

  for (const file of files) {
    await importMdxFile(file)
  }

  console.log('Content import complete.')
}

main()
  .catch((error) => {
    console.error('Import failed:', error)
    process.exitCode = 1
  })
  .finally(() => {
    databaseContext.close?.()
  })
