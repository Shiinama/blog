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

export type SocialIcons = {
  [social in SocialMedia]: string
}

export type SocialMedia =
  | 'Mail'
  | 'GitHub'
  | 'Facebook'
  | 'LinkedIn'
  | 'YouTube'
  | 'Twitter'
  | 'Mastodon'

export type SocialObjects = {
  name: SocialMedia
  href: string
  active: boolean
  linkTitle: string
}[]

export type Friend = {
  name: string
  link: string
}

export type Friends = Friend[]
