/**
 * Core i18n translation utilities.
 * Uses an AI model to automatically translate message files.
 */
import fs from 'fs/promises'
import path from 'path'
import 'dotenv/config'

import { locales } from '@/i18n/routing'
import { extractKeys, findMissingKeys, deepMerge } from './utils'

/**
 * Translation modes
 * - missing: translate only missing keys
 * - keys: translate the explicitly provided keys
 */
export type TranslationMode = 'missing' | 'keys'

/**
 * Translation options
 */
export type TranslationOptions = {
  /** Selected translation mode */
  mode: TranslationMode
  /** Target locales; defaults to translating all locales */
  targetLocales?: string[]
  /** Keys to translate when using the 'keys' mode */
  keys?: string[]
  /** Model identifier to use for translation */
  model?: string
  /** Keys that should be copied without translation (e.g. brand names) */
  noTranslateKeys?: string[]
}

/**
 * Translation result
 */
export type TranslationResult = {
  /** Whether translation succeeded */
  success: boolean
  /** Locale code */
  locale: string
  /** Success message */
  message?: string
  /** Keys that were translated */
  translatedKeys?: string[]
  /** Keys that were copied without translation */
  copiedKeys?: string[]
  /** Error message if translation failed */
  error?: string
}

export async function translateMessages(options: TranslationOptions): Promise<TranslationResult[]> {
  const {
    mode = 'missing',
    targetLocales,
    keys = [],
    model = '@cf/google/gemma-3-12b-it',
    noTranslateKeys = []
  } = options

  const results: TranslationResult[] = []

  try {
    // Read English messages as the source
    const messagesDir = path.join(process.cwd(), 'messages')
    const englishMessagesPath = path.join(messagesDir, 'en.json')
    const englishMessagesText = await fs.readFile(englishMessagesPath, 'utf-8')
    const englishMessages = JSON.parse(englishMessagesText)

    // Determine which locales to translate
    const localesToTranslate = targetLocales
      ? locales.filter((l) => targetLocales.includes(l.code) && l.code !== 'en')
      : locales.filter((l) => l.code !== 'en')

    if (localesToTranslate.length === 0) {
      return [{ success: false, locale: 'all', error: '没有找到要翻译的目标语言' }]
    }

    // Decide what to translate based on the selected mode
    let sourceToTranslate: any
    let missingKeysByLocale: Record<string, string[]> = {}

    switch (mode) {
      case 'keys':
        if (keys.length === 0) {
          throw new Error('Keys模式需要至少一个要翻译的键')
        }
        // Filter out keys that should not be translated
        const keysToTranslate = keys.filter((key) => !noTranslateKeys.includes(key))
        sourceToTranslate = extractKeys(englishMessages, keysToTranslate)
        break

      case 'missing':
        // Collect missing keys for each locale
        for (const locale of localesToTranslate) {
          let existingTranslations = {}
          const localeFilePath = path.join(messagesDir, `${locale.code}.json`)

          try {
            const existingContent = await fs.readFile(localeFilePath, 'utf-8')
            existingTranslations = JSON.parse(existingContent)
          } catch (err) {
            console.log(`未找到 ${locale.code} 的现有翻译，将创建新文件。`)
          }

          const missingKeys = findMissingKeys(englishMessages, existingTranslations)
          if (missingKeys.length > 0) {
            // Skip keys that should not be translated but keep them for later merging
            missingKeysByLocale[locale.code] = missingKeys
          }
        }

        // If no locales have missing keys, exit early
        if (Object.keys(missingKeysByLocale).length === 0) {
          return localesToTranslate.map((locale) => ({
            success: true,
            locale: locale.code,
            message: `${locale.name} 没有发现缺失的键`,
            translatedKeys: []
          }))
        }

        // Use every missing key across locales as the source set
        const allMissingKeys = [...new Set(Object.values(missingKeysByLocale).flat())]
        // Remove keys that should not be translated
        const missingKeysToTranslate = allMissingKeys.filter((key) => !noTranslateKeys.includes(key))
        sourceToTranslate = extractKeys(englishMessages, missingKeysToTranslate)
        break
    }

    // Prepare translation payload
    let translationPayload: Record<string, any> = {}
    let translationNeeded = false
    // Track keys that should be copied per locale
    let noTranslateKeysByLocale: Record<string, string[]> = {}

    if (mode === 'missing') {
      // In missing mode, include only keys that are absent for each locale
      for (const locale of localesToTranslate) {
        const localeCode = locale.code
        const missingKeys = missingKeysByLocale[localeCode] || []

        // Split translatable vs non-translatable keys
        const keysToTranslate = missingKeys.filter((key) => !noTranslateKeys.includes(key))
        const keysNotToTranslate = missingKeys.filter((key) => noTranslateKeys.includes(key))

        // Track keys that should be copied
        if (keysNotToTranslate.length > 0) {
          noTranslateKeysByLocale[localeCode] = keysNotToTranslate
        }

        if (keysToTranslate.length > 0) {
          translationPayload[localeCode] = extractKeys(englishMessages, keysToTranslate)
          translationNeeded = true
        }
      }
    } else {
      // In keys mode, use the same source set for every locale
      // Split translatable vs non-translatable keys
      const keysToTranslate = keys.filter((key) => !noTranslateKeys.includes(key))
      const keysNotToTranslate = keys.filter((key) => noTranslateKeys.includes(key))

      for (const locale of localesToTranslate) {
        const localeCode = locale.code

        // Track keys that should be copied
        if (keysNotToTranslate.length > 0) {
          noTranslateKeysByLocale[localeCode] = keysNotToTranslate
        }

        if (keysToTranslate.length > 0) {
          translationPayload[localeCode] = extractKeys(englishMessages, keysToTranslate)
          translationNeeded = true
        }
      }
    }

    // Handle keys that should be copied without translation
    for (const locale of localesToTranslate) {
      const localeCode = locale.code
      const keysNotToTranslate = noTranslateKeysByLocale[localeCode] || []

      if (keysNotToTranslate.length > 0) {
        // Load existing translations if present
        let existingTranslations = {}
        const localeFilePath = path.join(messagesDir, `${localeCode}.json`)

        try {
          const existingContent = await fs.readFile(localeFilePath, 'utf-8')
          existingTranslations = JSON.parse(existingContent)
        } catch (err) {
          // If the file is missing, it will be created
        }

        // Copy the non-translated keys from English
        const untranslatedContent = extractKeys(englishMessages, keysNotToTranslate)
        const mergedContent = deepMerge(existingTranslations, untranslatedContent)

        // Persist to disk
        await fs.writeFile(localeFilePath, JSON.stringify(mergedContent, null, 2), 'utf-8')

        // If nothing needs translation, record the result now
        if (!translationPayload[localeCode]) {
          results.push({
            success: true,
            locale: localeCode,
            message: `${locale.name} 只有不需要翻译的内容`,
            translatedKeys: [],
            copiedKeys: keysNotToTranslate
          })
        }
      }
    }

    // Exit early if there is no translation work left
    if (!translationNeeded) {
      // Filter out locales already handled
      const remainingLocales = localesToTranslate.filter((locale) => !results.some((r) => r.locale === locale.code))

      return [
        ...results,
        ...remainingLocales.map((locale) => ({
          success: true,
          locale: locale.code,
          message: `${locale.name} 没有需要翻译的内容`,
          translatedKeys: []
        }))
      ]
    }

    // Prepare the multi-language translation prompt
    const languagesToTranslate = localesToTranslate
      .filter((l) => translationPayload[l.code]) // Include only locales that need translation
      .map((l) => `${l.code}: ${l.name}`)

    const languageList = languagesToTranslate.join(', ')

    console.log(languageList, 'languageList')

    const prompt = `
    I need to translate JSON structures from English to multiple languages: ${languageList}.
    
    The input is a JSON object where each top-level key is a language code, and the value contains
    the specific messages that need to be translated for that language.
    
    Rules:
    1. Preserve all placeholders like {name}, {count}, etc.
    2. Maintain the exact same JSON structure for each language
    3. Only translate the values, not the keys
    
    Source JSON:
    ${JSON.stringify(translationPayload, null, 2)}
    
    Please respond with a JSON object with the same structure, where each language code contains its translated content.
    Return only the JSON without any additional text or explanations.
    `

    console.log(JSON.stringify(translationPayload, null, 2))

    // Invoke the AI model for batch translation
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          stream: false,
          max_tokens: 13000
        })
      }
    )

    if (!response.ok) {
      throw new Error(`API调用失败: ${response.status} ${response.statusText}`)
    }

    const { result }: { result: { response: string } } = await response.json()

    console.log(result.response)

    // Extract the JSON response
    const jsonMatch = result.response?.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('响应中未找到有效的JSON')
    }

    const jsonString = jsonMatch[0]
    const allTranslations = JSON.parse(jsonString)

    // Process translations per locale
    for (const locale of localesToTranslate) {
      try {
        const localeCode = locale.code

        // Skip locales without translation payload
        if (!translationPayload[localeCode]) {
          // If we already handled copy-only keys, skip
          if (!results.some((r) => r.locale === localeCode)) {
            results.push({
              success: true,
              locale: localeCode,
              message: `${locale.name} 没有需要翻译的内容`,
              translatedKeys: []
            })
          }
          continue
        }

        const translatedContent = allTranslations[localeCode]

        if (!translatedContent) {
          results.push({
            success: false,
            locale: localeCode,
            error: `未找到 ${locale.name} 的翻译结果`
          })
          continue
        }

        // Load existing translations if present
        let existingTranslations = {}
        const localeFilePath = path.join(messagesDir, `${localeCode}.json`)

        try {
          const existingContent = await fs.readFile(localeFilePath, 'utf-8')
          existingTranslations = JSON.parse(existingContent)
        } catch (err) {
          // If the file is missing, create it
        }

        // Merge final content
        let finalContent = deepMerge(existingTranslations, translatedContent)

        // Write merged content to disk
        await fs.writeFile(localeFilePath, JSON.stringify(finalContent, null, 2), 'utf-8')

        // Determine which keys were translated
        let translatedKeys: string[]
        if (mode === 'keys') {
          translatedKeys = keys.filter((key) => !noTranslateKeys.includes(key))
        } else {
          // missing mode
          translatedKeys = (missingKeysByLocale[localeCode] || []).filter((key) => !noTranslateKeys.includes(key))
        }

        // Capture keys that were copied without translation
        const copiedKeys = noTranslateKeysByLocale[localeCode] || []

        results.push({
          success: true,
          locale: localeCode,
          message: `成功将 ${translatedKeys.length} 个键翻译为 ${locale.name}${copiedKeys.length > 0 ? `，并复制了 ${copiedKeys.length} 个不需要翻译的键` : ''}`,
          translatedKeys,
          copiedKeys
        })
      } catch (error) {
        console.error(`处理 ${locale.code} 时出错:`, error)
        results.push({
          success: false,
          locale: locale.code,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return results
  } catch (error) {
    console.error('翻译过程失败:', error)
    return [
      {
        success: false,
        locale: 'all',
        error: error instanceof Error ? error.message : String(error)
      }
    ]
  }
}

/**
 * Remove specified keys from every locale file.
 * @param keys Keys to remove (dot notation for nested access)
 * @returns Deletion results per locale
 */
export async function deleteKeysFromMessages(keys: string[]): Promise<Record<string, any>> {
  if (!keys || keys.length === 0) {
    throw new Error('必须提供至少一个要删除的键')
  }

  const results: Record<string, any> = {
    success: true,
    deletedKeys: {},
    errors: {}
  }

  try {
    const messagesDir = path.join(process.cwd(), 'messages')

    // Get all JSON message files
    const files = await fs.readdir(messagesDir)
    const jsonFiles = files.filter((file) => file.endsWith('.json'))

    for (const file of jsonFiles) {
      const locale = file.replace('.json', '')
      results.deletedKeys[locale] = []

      try {
        const filePath = path.join(messagesDir, file)
        const content = await fs.readFile(filePath, 'utf-8')
        const messages = JSON.parse(content)

        let modified = false

        // Attempt to delete each key
        for (const key of keys) {
          const deleted = removeKey(messages, key)
          if (deleted) {
            modified = true
            results.deletedKeys[locale].push(key)
          }
        }

        // Write file back if it was modified
        if (modified) {
          await fs.writeFile(filePath, JSON.stringify(messages, null, 2), 'utf-8')
        }
      } catch (error) {
        results.success = false
        results.errors[locale] = error instanceof Error ? error.message : String(error)
      }
    }

    return results
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      deletedKeys: {},
      errors: {}
    }
  }
}

function removeKey(obj: any, key: string): boolean {
  const parts = key.split('.')
  let current = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (current[part] == null) {
      return false
    }
    current = current[part]
  }
  const lastPart = parts[parts.length - 1]
  if (current[lastPart] != null) {
    delete current[lastPart]
    return true
  }
  return false
}
