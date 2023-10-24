export type Site = {
  website: string
  author: string
  email: string
  description: string
  title: string
  headerTitle: string
  postPerPage: number
  siteLogo: string
  socialBanner: string
  search?: {
    provider: 'kbar' | 'algolia'
    kbarConfig?: {
      searchDocumentsPath: string
    }
  }
}

export type SocialObjects = {
  name: SocialMedia
  href: string
  active: boolean
  linkTitle: string
}[]

export type SocialIcons = {
  [social in SocialMedia]: string
}

export type SocialMedia =
  | 'Github'
  | 'Facebook'
  | 'Instagram'
  | 'LinkedIn'
  | 'Mail'
  | 'Twitter'
  | 'Twitch'
  | 'YouTube'
  | 'WhatsApp'
  | 'Snapchat'
  | 'Pinterest'
  | 'TikTok'
  | 'CodePen'
  | 'Discord'
  | 'GitLab'
  | 'Reddit'
  | 'Skype'
  | 'Steam'
  | 'Telegram'
  | 'Mastodon'
