import fs from 'fs/promises'
import path from 'path'

import matter from 'gray-matter'

import { CATEGORY_PRESETS } from '../constant/category-presets'
import { categories as categoriesTable, createDb, posts as postsTable, type Category, PostStatus } from '../lib/db'
import { calculateReadingTime, extractSummary, normalizeSlug } from '../lib/posts/utils'

const CONTENT_DIR = path.join(process.cwd(), 'content')

if (!process.env.NEXT_PUBLIC_DB_PROXY) {
  process.env.NEXT_PUBLIC_DB_PROXY = '1'
}

const db = createDb()

const categoryCache = new Map<string, Category>()
let dynamicCategoryIndex = 0

async function ensurePresetCategories() {
  for (const preset of CATEGORY_PRESETS) {
    const result = await db
      .insert(categoriesTable)
      .values({
        slug: preset.slug,
        name: preset.name,
        i18nKey: preset.i18nKey ?? null,
        sortOrder: preset.sortOrder ?? 0,
        isVisible: preset.isVisible ?? false
      })
      .onConflictDoUpdate({
        target: categoriesTable.slug,
        set: {
          name: preset.name,
          i18nKey: preset.i18nKey ?? null,
          sortOrder: preset.sortOrder ?? 0,
          isVisible: preset.isVisible ?? false,
          updatedAt: new Date()
        }
      })
      .returning()

    const category = result[0]
    if (category) {
      categoryCache.set(preset.folder, category)
      categoryCache.set(preset.slug, category)
    }
  }
}

function toTitleCase(value: string) {
  return value
    .split(/[\s-]+/)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ')
}

async function getCategoryForFolder(folder: string) {
  if (categoryCache.has(folder)) {
    return categoryCache.get(folder)!
  }

  const slug = folder
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
  const result = await db
    .insert(categoriesTable)
    .values({
      slug,
      name: toTitleCase(folder),
      i18nKey: null,
      sortOrder: CATEGORY_PRESETS.length + dynamicCategoryIndex,
      isVisible: false
    })
    .onConflictDoUpdate({
      target: categoriesTable.slug,
      set: {
        name: toTitleCase(folder),
        updatedAt: new Date()
      }
    })
    .returning()

  const category = result[0]!
  categoryCache.set(folder, category)
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

async function importMdxFile(filePath: string) {
  const relative = path.relative(CONTENT_DIR, filePath)
  const folder = relative.split(path.sep)[0]
  const category = await getCategoryForFolder(folder)

  const fileRaw = await fs.readFile(filePath, 'utf-8')
  const { data, content } = matter(fileRaw)

  const slugPath = relative.replace(/\\/g, '/').replace(/\.mdx?$/, '')
  const slug = normalizeSlug(slugPath)
  const title = (data.title as string) ?? extractHeading(content) ?? toTitleCase(path.basename(slug))
  const summary = (data.description as string) ?? extractSummary(content)
  const readingTime = calculateReadingTime(content)
  const coverImageCandidate = (data.coverImageUrl ?? data.coverImage ?? data.cover) as string | undefined
  const coverImageUrl = typeof coverImageCandidate === 'string' ? coverImageCandidate : null
  const publishedFlag = data.published === undefined ? true : Boolean(data.published)
  const status = publishedFlag ? PostStatus.PUBLISHED : PostStatus.DRAFT
  const publishedAt = status === PostStatus.PUBLISHED ? (parseDate(data.date as string) ?? new Date()) : null
  const sortOrder =
    typeof data.sortOrder === 'number'
      ? data.sortOrder
      : Number.isFinite(Number(data.sortOrder))
        ? Number(data.sortOrder)
        : deriveSortOrder(filePath)
  const tags = parseTags(data.tags)

  const now = new Date()

  await db
    .insert(postsTable)
    .values({
      title,
      slug,
      summary,
      content,
      coverImageUrl,
      status,
      publishedAt,
      categoryId: category.id,
      sortOrder,
      tags,
      language: (data.language as string) ?? 'zh',
      readingTime,
      createdAt: now,
      updatedAt: now
    })
    .onConflictDoUpdate({
      target: postsTable.slug,
      set: {
        title,
        summary,
        content,
        coverImageUrl,
        status,
        publishedAt,
        categoryId: category.id,
        sortOrder,
        tags,
        readingTime,
        language: (data.language as string) ?? 'zh',
        updatedAt: now
      }
    })

  console.log(`Imported: ${slug}`)
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

main().catch(async (error) => {
  console.error('Import failed:', error)
  process.exit(1)
})
