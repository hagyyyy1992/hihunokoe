export interface CachedPost {
  id: string
  userId: string
  title: string
  content: string
  cosmeticName: string | null
  cosmeticCategory: string | null
  skinType: string | null
  moodTag: string | null
  viewCount: number
  empathyCount: number
  commentCount: number
  createdAt: Date | string
  updatedAt: Date | string
  publishedAt: Date | string | null
  usageSituation?: unknown
  experienceDetails?: unknown
  user: {
    id: string
    userName: string
  } | null
  userHasEmpathy?: boolean
}

export interface CachedPostsResponse {
  posts: CachedPost[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}
