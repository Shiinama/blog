import { drizzle as drizzleD1 } from 'drizzle-orm/d1'
import OpenAI from 'openai'

import { categories, posts, postTranslations } from '@/drizzle/schema'
import * as schema from '@/drizzle/schema'
import { createDb, type DB } from '@/lib/db'
import { calculateReadingTime } from '@/lib/posts/utils'

const AI_DAILY_CATEGORY_KEY = 'ai-daily'
const DEFAULT_MODEL = 'gpt-5.5'
const TAGS = ['ai-daily', 'ai', 'news']
export const AI_DAILY_TIME_ZONE = 'America/Los_Angeles'
const SEARCH_CONTEXT_SIZE = 'high'
const HOT_SIGNAL_SOURCES = [
  'official AI company blogs and changelogs',
  'major AI lab announcements',
  'research paper pages and conference proceedings',
  'GitHub trending repositories and release notes',
  'Hacker News, Product Hunt, and developer community discussions',
  'reputable developer-focused tech media with original reporting',
  'AI product directories, benchmark pages, SDK docs, and release feeds'
]

const EVENT_PRIORITY_RULES = [
  'new model, benchmark, API, SDK, product, or platform release',
  'model capability improvements in coding, agents, multimodal, voice, video, inference, memory, or reasoning',
  'fast-growing open-source model, framework, agent system, developer tool, or infrastructure project',
  'major research result with released paper, code, dataset, demo, benchmark, or reproducible method',
  'notable product workflow update from AI-native apps, IDEs, browsers, search, productivity tools, or creative tools',
  'pricing, latency, context window, deployment, hardware, cloud, or inference improvements that change builder economics'
]

const LOWER_PRIORITY_RULES = [
  'regulation, lawsuits, copyright disputes, government procurement, national security, defense, election, surveillance, and geopolitical stories',
  'AI safety or security incidents without a clear developer-facing technical lesson',
  'funding and executive stories without a released product, model, dataset, paper, or platform change'
]

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

function zonedDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: AI_DAILY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date)

  return Object.fromEntries(parts.map((part) => [part.type, part.value])) as {
    year: string
    month: string
    day: string
    hour: string
  }
}

function zonedDateLabel(date: Date) {
  const parts = zonedDateParts(date)
  return `${parts.year}-${parts.month}-${parts.day}`
}

function dateInZone(day: string, hour: number) {
  const guess = new Date(`${day}T${String(hour).padStart(2, '0')}:00:00.000Z`)

  for (let offset = -12; offset <= 14; offset += 1) {
    const candidate = new Date(guess.getTime() + offset * 3_600_000)
    const parts = zonedDateParts(candidate)

    if (
      `${parts.year}-${parts.month}-${parts.day}` === day &&
      Number.parseInt(parts.hour, 10) === hour
    ) {
      return candidate
    }
  }

  throw new Error(`Unable to resolve ${day} ${hour}:00 in ${AI_DAILY_TIME_ZONE}.`)
}

function localDayRange(now: Date) {
  const day = zonedDateLabel(now)
  const start = dateInZone(day, 0)
  const end = dateInZone(
    zonedDateLabel(new Date(start.getTime() + 36 * 3_600_000)),
    0
  )

  return { start, end }
}

function localHalfDaySlot(now: Date) {
  const { start: dayStart } = localDayRange(now)
  const slotStartHour = Number.parseInt(zonedDateParts(now).hour, 10) < 12 ? 0 : 12
  const start = slotStartHour === 0 ? dayStart : dateInZone(zonedDateLabel(now), 12)
  const end = slotStartHour === 0 ? dateInZone(zonedDateLabel(now), 12) : localDayRange(new Date(start.getTime() + 18 * 3_600_000)).start

  return {
    start,
    end,
    label: `${String(slotStartHour).padStart(2, '0')}:00 Los Angeles time`,
    window: `${String(slotStartHour).padStart(2, '0')}:00-${String(slotStartHour + 12).padStart(2, '0')}:00 Los Angeles time`
  }
}

function dateLabel(date: Date) {
  return zonedDateLabel(date)
}

function cleanDraftTitle(title: string) {
  return title
    .replace(/\b(?:Asia\/Shanghai|America\/Los_Angeles)\b/gi, '')
    .replace(/\b(?:Shanghai|Los Angeles)\s+time\b/gi, '')
    .replace(/\s+([:：,，;；])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([—-])\s*$/g, '')
    .trim()
}

function parseDraft(outputText: string, fallbackTitle: string, stage: string): DailyDraft {
  let value: Partial<DailyDraft>

  try {
    value = JSON.parse(outputText) as Partial<DailyDraft>
  } catch (error) {
    const preview = outputText.trim().replace(/\s+/g, ' ').slice(0, 240)
    throw new Error(`${stage} response was not valid JSON: ${preview}`, { cause: error })
  }

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
    title: cleanDraftTitle(value.title?.trim() || fallbackTitle),
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

function englishPrompt(day: string, slotWindow: string) {
  return [
    `Search the web for the most important and currently hot global AI events around ${day}, ${slotWindow}.`,
    'Use the last 12 hours as the main window. Only use a 24-hour window for stories that are still gaining momentum now or need a primary-source confirmation.',
    'The post title must not include any timezone name, timezone identifier, city time label, or slot window.',
    '',
    'Search strategy:',
    `- Scan these high-signal source types first: ${HOT_SIGNAL_SOURCES.join('; ')}.`,
    '- Prefer specific entity and product queries over generic "AI news" queries.',
    '- Cross-check each candidate with a primary source, release note, paper, repository, benchmark, demo, docs page, or reputable original report before including it.',
    '- Treat social/community buzz as a discovery signal only; do not cite low-authority social posts unless they are the original announcement.',
    '',
    'Selection rules:',
    `- Prioritize events matching these hot-signal categories: ${EVENT_PRIORITY_RULES.join('; ')}.`,
    `- Deprioritize these unless they are the biggest AI story of the day and have a direct builder impact: ${LOWER_PRIORITY_RULES.join('; ')}.`,
    '- Aim for at least 75% of selected events to be technical progress, product updates, model releases, open-source projects, papers, benchmarks, developer tools, or infrastructure improvements.',
    '- Include at most one regulation, national security, defense, lawsuit, copyright, or policy-heavy item, and only when it clearly changes how AI builders or product teams will work this week.',
    '- Rank events by practical impact, freshness, source authority, and visible momentum among builders, founders, researchers, or operators.',
    '- Exclude evergreen explainers, generic opinion pieces, SEO roundups, undated pages, job posts, listicles, minor feature updates, and policy/security stories that are not immediately useful to technical readers.',
    '- Avoid duplicate angles about the same announcement. Merge related coverage into one event and cite the strongest sources.',
    '- Include at least one China/Asia signal when it is genuinely among the strongest stories; otherwise keep the list global by impact.',
    'Write one complete publish-ready English post for technical founders, AI builders, and operators.',
    'Keep the analysis dense, practical, and appropriately cautious. Each event must include at least one accessible source URL, and details should explain why this item is hot now.'
  ].join('\n')
}

function translationPrompt(draft: DailyDraft) {
  return [
    'Translate this English AI daily post into natural Simplified Chinese.',
    'Preserve the exact same event set, ordering, factual claims, source URLs, publishers, and published dates.',
    'The translated title must not include any timezone name, timezone identifier, city time label, or slot window.',
    'Do not search the web. Do not add new events or remove existing events.',
    'Translate analytical prose naturally for Chinese technical founders, AI builders, and operators.',
    JSON.stringify(draft)
  ].join('\n\n')
}

async function generateDrafts(client: OpenAI, env: CloudflareEnv | undefined, day: string, slotWindow: string) {
  const english = await client.responses.create({
    model: model(env),
    input: englishPrompt(day, slotWindow),
    tools: [{ type: 'web_search', search_context_size: SEARCH_CONTEXT_SIZE }],
    text: {
      format: {
        type: 'json_schema',
        name: 'ai_daily_english_post',
        strict: true,
        schema: POST_SCHEMA
      }
    }
  })
  const en = parseDraft(english.output_text, 'Today in AI', 'English AI daily')

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
    zh: parseDraft(chinese.output_text, '今日 AI 大事件', 'Chinese AI daily translation')
  }
}

function renderMarkdown(draft: DailyDraft, day: string, slotLabel: string, language: 'en' | 'zh') {
  const text =
    language === 'en'
      ? {
          intro: `Today is ${day}, ${slotLabel}. Here are the global AI events from the last 12-24 hours worth tracking, organized by impact and actionability.`,
          takeaways: 'Quick Takeaways',
          details: 'Key Details',
          sources: 'Sources',
          watchlist: 'Signals to Watch Next',
          footer: 'This post was generated automatically from web search results. Key sources should be spot-checked before reuse.',
          date: (value: string) => ` (${value})`
        }
      : {
          intro: `今天是 ${day}，${slotLabel}。下面是过去 12-24 小时里值得关注的全球 AI 大事件，按影响力和可行动性整理。`,
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

async function existingPostForSlot(db: DB, categoryId: string, now: Date) {
  const { start, end } = localHalfDaySlot(now)
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
  const existing = await existingPostForSlot(db, category.id, now)

  if (existing) {
    return {
      status: 'skipped' as const,
      reason: 'already_published_in_slot',
      post: existing
    }
  }

  const day = dateLabel(now)
  const slot = localHalfDaySlot(now)
  const drafts = await generateDrafts(openaiClient(env), env, day, slot.window)
  const englishContent = renderMarkdown(drafts.en, day, slot.label, 'en')
  const chineseContent = renderMarkdown(drafts.zh, day, slot.label, 'zh')

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
