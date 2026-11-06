import type messages from '@/messages/en.json'

type CategoryKey = keyof (typeof messages)['categories']
type CategoryTranslator = { (key: CategoryKey): string; has(key: CategoryKey): boolean }

/** Category keys come from the database; fall back to the raw key when no message exists. */
export function categoryLabel(t: CategoryTranslator, key: string) {
  return t.has(key as CategoryKey) ? t(key as CategoryKey) : key
}
