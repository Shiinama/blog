import { Category, Post } from '@/drizzle/schema'

export type CategorySummary = Pick<Category, 'id' | 'key' | 'sortOrder' | 'isVisible'>
export type SidebarPost = Pick<Post, 'id' | 'title' | 'sortOrder' | 'publishedAt' | 'createdAt' | 'status'>
export type ExplorerSortOption = 'newest' | 'oldest' | 'alphabetical'

export interface ExplorerFilterInput {
  search?: string
  categoryId?: string
  sortBy?: ExplorerSortOption
  locale?: string
  page?: number
  pageSize?: number
}

export interface ExplorerPostsResponse {
  posts: ExplorerPostRecord[]
  total: number
}

export interface ExplorerPostRecord {
  id: string
  title: string
  summary: string | null
  coverImageUrl: string | null
  categoryId: string | null
  categoryKey: string | null
  categoryLabel: string
  publishedAt: string | null
  createdAt: string | null
  sortTimestamp: number
}

export type PostAuthorSummary = {
  id: string
  name: string | null
  email: string | null
}

export interface PostDetails extends Post {
  category: CategorySummary | null
  author: PostAuthorSummary | null
}

export interface PaginatedPostListItem {
  id: string
  title: string
  status: Post['status']
  publishedAt: Post['publishedAt']
  updatedAt: Post['updatedAt']
  createdAt: Post['createdAt']
  isSubscriptionOnly: Post['isSubscriptionOnly']
  categoryId: Post['categoryId']
}

export interface PaginatedPostsResult {
  posts: PaginatedPostListItem[]
  total: number
  page: number
  pageSize: number
}
