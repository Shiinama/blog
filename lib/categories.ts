import { CATEGORY_PRESETS } from '@/constant/category-presets'

const CATEGORY_TRANSLATION_KEYS = new Map(CATEGORY_PRESETS.map((category) => [category.folder, category.i18nKey]))

export function getCategoryTranslationKey(key?: string | null) {
  if (!key) {
    return ''
  }

  return CATEGORY_TRANSLATION_KEYS.get(key) ?? key
}

export function formatCategoryLabel(key?: string | null) {
  if (!key) {
    return ''
  }

  const spaced = key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()

  if (!spaced) {
    return key
  }

  return spaced
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
