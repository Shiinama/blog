import { translateMessages, TranslationOptions, TranslationResult } from './translate'
import fs from 'fs/promises'
import path from 'path'
import 'dotenv/config'
import { locales } from '@/i18n/routing'

/**
 * Recursively find missing or empty keys.
 * @param source Source object (usually the English messages)
 * @param target Target object (another locale)
 * @param prefix Current path prefix
 * @returns Missing or empty keys in dot notation
 */
function findMissingOrEmptyKeys(source: Record<string, any>, target: Record<string, any>, prefix = ''): string[] {
  const missingOrEmptyKeys: string[] = []

  for (const key in source) {
    const currentPath = prefix ? `${prefix}.${key}` : key
    const sourceValue = source[key]

    if (!(key in target)) {
      // Key is completely missing
      if (typeof sourceValue === 'object' && sourceValue !== null) {
        // If it's an object, add all leaf nodes recursively
        const leafKeys = extractAllKeys(sourceValue, currentPath)
        missingOrEmptyKeys.push(...leafKeys)
      } else {
        // For leaf nodes, add directly
        missingOrEmptyKeys.push(currentPath)
      }
    } else {
      const targetValue = target[key]

      if (typeof sourceValue === 'object' && sourceValue !== null) {
        if (typeof targetValue !== 'object' || targetValue === null) {
          // Type mismatch: source is an object but target is not
          // Add all leaf nodes instead of the parent
          const leafKeys = extractAllKeys(sourceValue, currentPath)
          missingOrEmptyKeys.push(...leafKeys)
        } else {
          // Recurse into nested objects
          const nestedMissing = findMissingOrEmptyKeys(sourceValue, targetValue, currentPath)
          missingOrEmptyKeys.push(...nestedMissing)
        }
      } else if (
        // Handle empty values or type mismatches
        targetValue === '' ||
        targetValue === null ||
        targetValue === undefined ||
        typeof sourceValue !== typeof targetValue
      ) {
        missingOrEmptyKeys.push(currentPath)
      }
    }
  }

  return missingOrEmptyKeys
}

/**
 * Recursively extract all keys using dot notation.
 * @param obj Source object
 * @param prefix Current prefix
 * @returns Array of keys
 */
function extractAllKeys(obj: any, prefix = ''): string[] {
  let keys: string[] = []

  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = [...keys, ...extractAllKeys(obj[key], newKey)]
    } else {
      keys.push(newKey)
    }
  }

  return keys
}

/**
 * Translate all keys sequentially.
 * @param options Translation options
 */
export async function sequentialTranslate(options: Omit<TranslationOptions, 'mode' | 'keys'> = {}): Promise<void> {
  try {
    // Load the English messages as the baseline
    const messagesDir = path.join(process.cwd(), 'messages')
    const englishMessagesPath = path.join(messagesDir, 'en.json')
    const englishMessagesText = await fs.readFile(englishMessagesPath, 'utf-8')
    const englishMessages = JSON.parse(englishMessagesText)

    // Determine which target locales to translate
    const { targetLocales } = options
    const localesToTranslate = targetLocales
      ? locales.filter((l) => targetLocales.includes(l.code) && l.code !== 'en')
      : locales.filter((l) => l.code !== 'en')

    if (localesToTranslate.length === 0) {
      console.log('没有找到要翻译的目标语言')
      return
    }

    // Extract every key from the English file
    const allKeys = extractAllKeys(englishMessages)
    console.log(`英文文件中共有 ${allKeys.length} 个键`)

    let allMissingKeys: string[] = []

    console.log('开始检查各语言文件中缺失的键...')
    for (const locale of localesToTranslate) {
      const localeFilePath = path.join(messagesDir, `${locale.code}.json`)

      // Check whether the locale file exists
      let existingTranslations = {}
      let fileExists = true

      try {
        const existingContent = await fs.readFile(localeFilePath, 'utf-8')
        try {
          existingTranslations = JSON.parse(existingContent)
        } catch (parseErr) {
          console.log(`⚠️ ${locale.code} 文件解析失败，将视为空文件`)
          fileExists = false
        }
      } catch (err) {
        console.log(`⚠️ 未找到 ${locale.code} 的现有翻译文件，将创建新文件`)
        fileExists = false
      }

      // Determine missing keys
      let missingKeys: string[] = []

      if (!fileExists || Object.keys(existingTranslations).length === 0) {
        // If the file is missing or empty, every key is missing
        missingKeys = [...allKeys]
        console.log(`📝 ${locale.code}: 需要翻译所有 ${missingKeys.length} 个键`)
      } else {
        // Recursively find missing keys
        missingKeys = findMissingOrEmptyKeys(englishMessages, existingTranslations)
        if (missingKeys.length > 0) {
          console.log(`📝 ${locale.code}: 需要翻译 ${missingKeys.length} 个键`)
        } else {
          console.log(`✅ ${locale.code}: 已包含所有键，无需翻译`)
        }
      }

      // Record missing keys for this locale
      if (missingKeys.length > 0) {
        allMissingKeys = [...new Set([...allMissingKeys, ...missingKeys])]
      }
    }

    // Exit early if nothing is missing
    if (allMissingKeys.length === 0) {
      console.log('✨ 所有语言文件都已包含所有键，无需翻译')
      return
    }

    console.log(`\n总共发现 ${allMissingKeys.length} 个不同的键需要翻译`)

    // Set batch size for translation
    const batchSize = 3 // Process three keys per batch; adjust if needed
    const batches = []

    // Split keys into batches
    for (let i = 0; i < allMissingKeys.length; i += batchSize) {
      batches.push(allMissingKeys.slice(i, i + batchSize))
    }

    console.log(`将分 ${batches.length} 批进行翻译\n`)

    // Translate each batch sequentially
    let successCount = 0
    let failureCount = 0
    let skippedCount = 0

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      console.log(`🔄 开始翻译批次 ${i + 1}/${batches.length}，包含键: ${batch.join(', ')}`)

      const translationOptions: TranslationOptions = {
        mode: 'keys',
        keys: batch,
        ...options
      }

      try {
        const results = await translateMessages(translationOptions)

        // Handle results
        for (const result of results) {
          if (result.success) {
            if (result.translatedKeys && result.translatedKeys.length > 0) {
              console.log(`✅ ${result.locale}: ${result.message}`)
              successCount += result.translatedKeys.length
            } else if (result.message?.includes('没有需要翻译的内容')) {
              console.log(`ℹ️ ${result.locale}: ${result.message}`)
              skippedCount += batch.length
            }
          } else {
            console.log(`❌ ${result.locale}: ${result.error}`)
            failureCount += batch.length
          }
        }
      } catch (error) {
        console.error(`❌ 批次 ${i + 1} 翻译失败:`, error)
        failureCount += batch.length
      }
    }

    console.log('\n✨ 翻译完成!')
    console.log('====================')
    console.log(`📊 总计键数: ${allKeys.length}`)
    console.log(`✅ 成功翻译: ${successCount}`)
    console.log(`⏭️ 跳过翻译: ${skippedCount}`)
    console.log(`❌ 失败翻译: ${failureCount}`)
  } catch (error) {
    console.error('❌ 顺序翻译过程失败:', error)
    throw error
  }
}
