import { components } from '@/components/social-icons'

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
  name: keyof typeof components
  href: string
  active: boolean
  linkTitle: string
}[]

export type Friend = {
  name: string
  link: string
}

export type Friends = Friend[]
