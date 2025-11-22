export interface CategoryPreset {
  folder: string
  i18nKey: string
  sortOrder: number
  isVisible: boolean
}

export const CATEGORY_PRESETS: CategoryPreset[] = [
  { folder: 'timeline', i18nKey: 'timeline', sortOrder: 1, isVisible: true },
  { folder: 'seo', i18nKey: 'seo', sortOrder: 2, isVisible: true },
  { folder: 'easy-ai-technology', i18nKey: 'faqAndPath', sortOrder: 3, isVisible: true },
  { folder: 'react-source-code', i18nKey: 'reactSourceCode', sortOrder: 4, isVisible: true },
  { folder: 'react-native', i18nKey: 'reactNative', sortOrder: 5, isVisible: true },
  { folder: 'business', i18nKey: 'business', sortOrder: 6, isVisible: true },
  { folder: 'independent-development', i18nKey: 'independentDevelopment', sortOrder: 7, isVisible: true },
  { folder: 'vue', i18nKey: 'vue', sortOrder: 8, isVisible: true },
  { folder: 'sdk', i18nKey: 'sdk', sortOrder: 9, isVisible: true },
  { folder: 'font-end', i18nKey: 'fontEnd', sortOrder: 10, isVisible: true },
  { folder: 'interview', i18nKey: 'interview', sortOrder: 11, isVisible: true },
  { folder: 'flutter', i18nKey: 'flutter', sortOrder: 12, isVisible: true },
  { folder: 'app', i18nKey: 'app', sortOrder: 13, isVisible: false },
  { folder: 'ai-audio', i18nKey: 'aiAudio', sortOrder: 14, isVisible: false },
  { folder: 'backend', i18nKey: 'backend', sortOrder: 15, isVisible: false },
  { folder: 'common-base-projuct', i18nKey: 'commonBaseProject', sortOrder: 16, isVisible: false },
  { folder: 'discord-development', i18nKey: 'discordDevelopment', sortOrder: 17, isVisible: false },
  { folder: 'issue', i18nKey: 'issue', sortOrder: 18, isVisible: false },
  { folder: 'nextjs', i18nKey: 'nextjs', sortOrder: 19, isVisible: false },
  { folder: 'other', i18nKey: 'other', sortOrder: 20, isVisible: true }
]
