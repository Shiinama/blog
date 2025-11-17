export interface CategoryPreset {
  folder: string
  slug: string
  name: string
  i18nKey?: string | null
  sortOrder?: number
  isVisible?: boolean
}

export const CATEGORY_PRESETS: CategoryPreset[] = [
  { folder: 'timeline', slug: 'timeline', name: '时间线', i18nKey: 'timeline', sortOrder: 1, isVisible: true },
  { folder: 'blog', slug: 'blog', name: '生活记录', i18nKey: 'life', sortOrder: 2, isVisible: true },
  { folder: 'seo', slug: 'seo', name: 'SEO', i18nKey: 'seo', sortOrder: 3, isVisible: true },
  {
    folder: 'easy-ai-technology',
    slug: 'easyAiTechnology',
    name: '轻松搞定 AI',
    i18nKey: 'faqAndPath',
    sortOrder: 4,
    isVisible: true
  },
  {
    folder: 'react-source-code',
    slug: 'reactSourceCode',
    name: 'React 源码',
    i18nKey: 'reactSourceCode',
    sortOrder: 5,
    isVisible: true
  },
  {
    folder: 'react-native',
    slug: 'reactNative',
    name: 'React Native',
    i18nKey: 'reactNative',
    sortOrder: 6,
    isVisible: true
  },
  { folder: 'business', slug: 'business', name: '商业策略', i18nKey: 'business', sortOrder: 7, isVisible: true },
  {
    folder: 'independent-development',
    slug: 'independentDevelopment',
    name: '独立开发',
    i18nKey: 'independentDevelopment',
    sortOrder: 8,
    isVisible: true
  },
  { folder: 'vue', slug: 'vue', name: 'Vue', i18nKey: 'vue', sortOrder: 9, isVisible: true },
  { folder: 'sdk', slug: 'sdk', name: 'SDK', i18nKey: 'sdk', sortOrder: 10, isVisible: true },
  { folder: 'font-end', slug: 'fontEnd', name: '前端工程', i18nKey: 'fontEnd', sortOrder: 11, isVisible: true },
  { folder: 'interview', slug: 'interview', name: '面试题', i18nKey: 'interview', sortOrder: 12, isVisible: true },
  { folder: 'flutter', slug: 'flutter', name: 'Flutter', i18nKey: 'flutter', sortOrder: 13, isVisible: true },
  { folder: 'app', slug: 'app', name: 'App 实战', sortOrder: 14, isVisible: false },
  { folder: 'ai-audio', slug: 'aiAudio', name: 'AI 音频', sortOrder: 15, isVisible: false },
  { folder: 'backend', slug: 'backend', name: '后端', sortOrder: 16, isVisible: false },
  { folder: 'common-base-projuct', slug: 'commonBaseProject', name: '基础项目', sortOrder: 17, isVisible: false },
  { folder: 'discord-development', slug: 'discordDevelopment', name: 'Discord 研发', sortOrder: 18, isVisible: false },
  { folder: 'issue', slug: 'issue', name: 'Issue 记录', sortOrder: 19, isVisible: false },
  { folder: 'nextjs', slug: 'nextjs', name: 'Next.js', sortOrder: 20, isVisible: false }
]
