'use server'

import { and, eq } from 'drizzle-orm'

import { postTranslations } from '@/drizzle/schema'
import { createDb } from '@/lib/db'

type TranslationResult = {
  title: string
  summary: string
  content: string
  coverImageUrl: string | null
  locale: string
}

type TranslatePostParams = {
  postId: string
  content: string
  targetLocale: string
  sourceLocale: string
  originalTitle: string
  originalSummary: string
  coverImageUrl: string | null
}

// Convert common full-width punctuation to half-width so Markdown stays well-formed.
const FULLWIDTH_TO_HALFWIDTH_MAP: Record<string, string> = {
  '＃': '#',
  '（': '(',
  '）': ')',
  '"': '"',
  '【': '[',
  '】': ']',
  '｛': '{',
  '｝': '}'
}

const normalizeText = (text: string): string => {
  return Object.entries(FULLWIDTH_TO_HALFWIDTH_MAP).reduce(
    (result, [fullwidth, halfwidth]) => result.replace(new RegExp(fullwidth, 'g'), halfwidth),
    text
  )
}

const translateContent = async (
  content: string,
  targetLocale: string,
  sourceLocale: string,
  script = false
): Promise<string | null> => {
  const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=${encodeURIComponent(sourceLocale)}&tl=${encodeURIComponent(targetLocale)}`

  const response = await fetch(translateUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'q=' + encodeURIComponent(content)
  })

  if (!response.ok) {
    if (script) {
      throw new Error(`Translation API error: ${response.status} ${response.statusText}`)
    }
    return null
  }

  const data: any[] = await response.json()
  const translatedSegments: string[] = Array.isArray(data?.[0]) ? data[0].map((item: any[]) => item?.[0] ?? '') : []
  const translatedText = translatedSegments.join('').trim()

  return translatedText ? normalizeText(translatedText) : null
}

const translateFields = async (
  text: string,
  targetLocale: string,
  sourceLocale: string,
  script: boolean
): Promise<string | null> => translateContent(text, targetLocale, sourceLocale, script)

export const getOrCreatePostTranslation = async (
  {
    postId,
    content,
    targetLocale,
    sourceLocale,
    originalTitle,
    originalSummary,
    coverImageUrl
  }: TranslatePostParams,
  script = false
): Promise<TranslationResult | null> => {
  const trimmedTarget = targetLocale.trim().toLowerCase()
  const trimmedSource = (sourceLocale.trim() || 'auto').toLowerCase()

  if (!trimmedTarget || trimmedTarget === trimmedSource) {
    return null
  }

  const db = createDb()

  const existingTranslation = await db
    .select()
    .from(postTranslations)
    .where(and(eq(postTranslations.postId, postId), eq(postTranslations.locale, trimmedTarget)))
    .limit(1)

  if (existingTranslation.length > 0) {
    const translation = existingTranslation[0]
    return {
      title: translation.title,
      summary: translation.summary,
      content: translation.content,
      coverImageUrl: translation.coverImageUrl,
      locale: trimmedTarget
    }
  }

  const [translatedText, translatedTitle, translatedSummary] = await Promise.all([
    translateContent(content, trimmedTarget, trimmedSource, script),
    translateFields(originalTitle, trimmedTarget, trimmedSource, script),
    translateFields(originalSummary, trimmedTarget, trimmedSource, script)
  ])

  if (!translatedText) {
    return null
  }

  await db.insert(postTranslations).values({
    postId,
    locale: trimmedTarget,
    content: translatedText,
    title: translatedTitle || originalTitle,
    summary: translatedSummary || originalSummary,
    coverImageUrl,
    createdAt: new Date(),
    updatedAt: new Date()
  })

  return {
    title: translatedTitle || originalTitle,
    summary: translatedSummary || originalSummary,
    content: translatedText,
    coverImageUrl,
    locale: trimmedTarget
  }
}
