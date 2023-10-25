import type { Site, SocialObjects, Friends } from './types'

export const SITE: Site = {
  website: 'https://example.com/',
  author: 'test',
  email: 'example@gmail.com',
  description: '这里是网站描述',
  title: 'My Blog',
  headerTitle: 'Blog',
  postPerPage: 10,
  siteLogo: '/static/images/logo.png',
  socialBanner: '/static/images/twitter-card.png',
  search: {
    provider: 'kbar', // kbar or algolia
    kbarConfig: {
      searchDocumentsPath: 'search.json', // path to load documents to search
    },
  },
}

export const SOCIALS: SocialObjects = [
  {
    name: 'Github',
    href: 'https://github.com',
    linkTitle: `my Github`,
    active: true,
  },
  {
    name: 'Mail',
    href: 'mailto:example@gmail.com',
    linkTitle: `Send an email to me`,
    active: true,
  },
  {
    name: 'Twitter',
    href: 'https://twitter.com/liruifengv',
    linkTitle: `My Twitter`,
    active: true,
  },
]

export const FRIENDS: Friends = [
  {
    name: 'antfu',
    link: 'https://antfu.me',
  },
  {
    name: 'hux',
    link: 'https://huangxuan.me/',
  },
  {
    name: 'liruifengv',
    link: 'https://liruifengv.com',
  },
]

export const CND_URL: string = ''

export const HTTP_URL: string = ''
