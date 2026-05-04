import { drizzle as drizzleD1 } from 'drizzle-orm/d1'
import OpenAI from 'openai'

import { categories, posts, postTranslations } from '@/drizzle/schema'
import * as schema from '@/drizzle/schema'
import { createDb, type DB } from '@/lib/db'
import { calculateReadingTime } from '@/lib/posts/utils'

const AI_DAILY_CATEGORY_KEY = 'ai-daily'
const DEFAULT_MODEL = 'gpt-5.5'
const TAGS = ['ai-daily', 'ai', 'news']

type Citation = {
  title: string
  url: string
  publisher: string
  publishedAt: string
}

type DailyEvent = {
  title: string
  whyItMatters: string
  details: string[]
  citations: Citation[]
}

type DailyDraft = {
  title: string
  summary: string
  events: DailyEvent[]
  watchlist: string[]
}

export type AiDailyRunOptions = {
  now?: Date
  env?: CloudflareEnv
}

const POST_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'summary', 'events', 'watchlist'],
  properties: {
    title: { type: 'string' },
    summary: { type: 'string' },
    watchlist: { type: 'array', items: { type: 'string' } },
    events: {
      type: 'array',
      minItems: 4,
      maxItems: 8,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'whyItMatters', 'details', 'citations'],
        properties: {
          title: { type: 'string' },
          whyItMatters: { type: 'string' },
          details: { type: 'array', items: { type: 'string' } },
          citations: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['title', 'url', 'publisher', 'publishedAt'],
              properties: {
                title: { type: 'string' },
                url: { type: 'string' },
                publisher: { type: 'string' },
                publishedAt: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }
}

function envValue(name: string, env?: CloudflareEnv) {
  const binding = env?.[name as keyof CloudflareEnv]
  if (typeof binding === 'string' && binding.trim()) return binding.trim()
  return process.env[name]?.trim()
}

function runtimeDb(env?: CloudflareEnv) {
  return env?.BLOG_DATABASE ? (drizzleD1(env.BLOG_DATABASE, { schema }) as DB) : createDb()
}

function openaiClient(env?: CloudflareEnv) {
  const apiKey = envValue('OPENAI_API_KEY', env) || envValue('SOCHEAP_OPENAI_KEY', env)
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY or SOCHEAP_OPENAI_KEY for AI daily generation.')
  }

  const baseURL = envValue('OPENAI_BASE_URL', env) || envValue('SOCHEAP_BASE_URL', env)
  return new OpenAI({ apiKey, baseURL: baseURL || undefined })
}

function model(env?: CloudflareEnv) {
  return envValue('AI_DAILY_MODEL', env) || DEFAULT_MODEL
}

function utcDayRange(now: Date) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  return { start, end: new Date(start.getTime() + 86_400_000) }
}

function dateLabel(date: Date) {
  return date.toISOString().slice(0, 10)
}

function parseDraft(outputText: string, fallbackTitle: string): DailyDraft {
  const value = JSON.parse(outputText) as Partial<DailyDraft>
  const events = Array.isArray(value.events)
    ? value.events
        .map((event) => {
          const item = event as Partial<DailyEvent>
          const citations = Array.isArray(item.citations)
            ? item.citations
                .map((citation) => citation as Partial<Citation>)
                .filter((citation) => citation.url?.trim())
                .map((citation) => ({
                  title: citation.title?.trim() || citation.publisher?.trim() || 'Source',
                  url: citation.url!.trim(),
                  publisher: citation.publisher?.trim() || '',
                  publishedAt: citation.publishedAt?.trim() || ''
                }))
                .slice(0, 4)
            : []

          return {
            title: item.title?.trim() || '',
            whyItMatters: item.whyItMatters?.trim() || '',
            details: Array.isArray(item.details)
              ? item.details
                  .map((detail) => String(detail).trim())
                  .filter(Boolean)
                  .slice(0, 5)
              : [],
            citations
          }
        })
        .filter((event) => event.title && event.whyItMatters && event.citations.length > 0)
        .slice(0, 8)
    : []

  if (!events.length) {
    throw new Error('AI daily response did not include any sourced events.')
  }

  return {
    title: value.title?.trim() || fallbackTitle,
    summary:
      value.summary?.trim() ||
      events
        .map((event) => event.title)
        .slice(0, 3)
        .join('; '),
    events,
    watchlist: Array.isArray(value.watchlist)
      ? value.watchlist
          .map((item) => String(item).trim())
          .filter(Boolean)
          .slice(0, 5)
      : []
  }
}

function englishPrompt(day: string) {
  return [
    `Search the web for the most important global AI events around ${day}, focusing on the last 24-48 hours.`,
    'Cover model releases, product launches, open-source projects, company and funding news, regulation, major research, infrastructure, and AI safety/security incidents.',
    'Prioritize primary sources, official company or institution announcements, papers, official blogs, and reputable media. Do not fabricate facts.',
    'Write one complete publish-ready English post for technical founders, AI builders, and operators.',
    'Keep the analysis dense, practical, and appropriately cautious. Each event must include at least one accessible source URL.'
  ].join('\n')
}

function translationPrompt(draft: DailyDraft) {
  return [
    'Translate this English AI daily post into natural Simplified Chinese.',
    'Preserve the exact same event set, ordering, factual claims, source URLs, publishers, and published dates.',
    'Do not search the web. Do not add new events or remove existing events.',
    'Translate analytical prose naturally for Chinese technical founders, AI builders, and operators.',
    JSON.stringify(draft)
  ].join('\n\n')
}

async function generateDrafts(client: OpenAI, env: CloudflareEnv | undefined, day: string) {
  const english = await client.responses.create({
    model: model(env),
    input: englishPrompt(day),
    tools: [{ type: 'web_search', search_context_size: 'high' }],
    text: {
      format: {
        type: 'json_schema',
        name: 'ai_daily_english_post',
        strict: true,
        schema: POST_SCHEMA
      }
    }
  })
  const en = parseDraft(english.output_text, 'Today in AI')

  const chinese = await client.responses.create({
    model: model(env),
    input: translationPrompt(en),
    text: {
      format: {
        type: 'json_schema',
        name: 'ai_daily_chinese_translation',
        strict: true,
        schema: POST_SCHEMA
      }
    }
  })

  return {
    en,
    zh: parseDraft(chinese.output_text, '今日 AI 大事件')
  }
}

function renderMarkdown(draft: DailyDraft, day: string, language: 'en' | 'zh') {
  const text =
    language === 'en'
      ? {
          intro: `Today is ${day}. Here are the global AI events from the last 24-48 hours worth tracking, organized by impact and actionability.`,
          takeaways: 'Quick Takeaways',
          details: 'Key Details',
          sources: 'Sources',
          watchlist: 'Signals to Watch Next',
          footer: 'This post was generated automatically from web search results. Key sources should be spot-checked before reuse.',
          date: (value: string) => ` (${value})`
        }
      : {
          intro: `今天是 ${day}。下面是过去 24-48 小时里值得关注的全球 AI 大事件，按影响力和可行动性整理。`,
          takeaways: '快速结论',
          details: '关键信息',
          sources: '来源',
          watchlist: '接下来值得盯的信号',
          footer: '本文由自动化流程基于联网搜索生成，发布前建议抽查关键来源。',
          date: (value: string) => `（${value}）`
        }

  const lines = [text.intro, '', `## ${text.takeaways}`, '', draft.summary, '']

  draft.events.forEach((event, index) => {
    lines.push(`## ${index + 1}. ${event.title}`, '', event.whyItMatters, '')

    if (event.details.length) {
      lines.push(`### ${text.details}`, '')
      event.details.forEach((detail) => lines.push(`- ${detail}`))
      lines.push('')
    }

    lines.push(`### ${text.sources}`, '')
    event.citations.forEach((citation) => {
      const label = citation.publisher ? `${citation.publisher} - ${citation.title}` : citation.title
      const suffix = citation.publishedAt ? text.date(citation.publishedAt) : ''
      lines.push(`- [${label}](${citation.url})${suffix}`)
    })
    lines.push('')
  })

  if (draft.watchlist.length) {
    lines.push(`## ${text.watchlist}`, '')
    draft.watchlist.forEach((item) => lines.push(`- ${item}`))
    lines.push('')
  }

  lines.push('---', '', text.footer)
  return lines.join('\n')
}

async function getOrCreateCategory(db: DB) {
  const existing = await db.query.categories.findFirst({
    where: (category, { eq }) => eq(category.key, AI_DAILY_CATEGORY_KEY)
  })
  if (existing) return existing

  const now = new Date()
  const created = await db
    .insert(categories)
    .values({
      key: AI_DAILY_CATEGORY_KEY,
      sortOrder: 22,
      isVisible: true,
      createdAt: now,
      updatedAt: now
    })
    .returning()

  return created[0]!
}

async function existingPostForDay(db: DB, categoryId: string, now: Date) {
  const { start, end } = utcDayRange(now)
  return db.query.posts.findFirst({
    where: (post, { and, eq, gte, lt }) =>
      and(eq(post.categoryId, categoryId), gte(post.publishedAt, start), lt(post.publishedAt, end)),
    columns: {
      id: true,
      title: true
    }
  })
}

export async function publishAiDailyPost({ env, now = new Date() }: AiDailyRunOptions = {}) {
  const db = runtimeDb(env)
  const category = await getOrCreateCategory(db)
  const existing = await existingPostForDay(db, category.id, now)

  if (existing) {
    return {
      status: 'skipped' as const,
      reason: 'already_published',
      post: existing
    }
  }

  const day = dateLabel(now)
  const drafts = await generateDrafts(openaiClient(env), env, day)
  const englishContent = renderMarkdown(drafts.en, day, 'en')
  const chineseContent = renderMarkdown(drafts.zh, day, 'zh')

  const [post] = await db
    .insert(posts)
    .values({
      title: drafts.en.title,
      summary: drafts.en.summary,
      content: englishContent,
      categoryId: category.id,
      status: 'PUBLISHED',
      publishedAt: now,
      tags: TAGS,
      language: 'en',
      readingTime: calculateReadingTime(englishContent),
      createdAt: now,
      updatedAt: now
    })
    .returning({ id: posts.id, title: posts.title })

  const [translation] = await db
    .insert(postTranslations)
    .values({
      postId: post.id,
      locale: 'zh',
      title: drafts.zh.title,
      summary: drafts.zh.summary,
      content: chineseContent,
      createdAt: now,
      updatedAt: now
    })
    .returning({ id: postTranslations.id, locale: postTranslations.locale })

  return {
    status: 'created' as const,
    post,
    translation
  }
}
