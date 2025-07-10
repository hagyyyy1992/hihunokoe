import { Post } from '@api/domain/entities/Post'

export interface CreatePostData {
  userId: string
  title: string
  content: string
  productName?: string | null
  brandName?: string | null
  imageUrl?: string | null
  category?: string | null
  skinType?: string | null
  moodTag?: string | null
  usageSituation?: any | null
  experienceDetails?: any | null
  isPublished?: boolean
}

export interface UpdatePostData {
  title?: string
  content?: string
  productName?: string | null
  brandName?: string | null
  imageUrl?: string | null
  category?: string | null
  skinType?: string | null
  moodTag?: string | null
  usageSituation?: any | null
  experienceDetails?: any | null
  isPublished?: boolean
}

export interface FindPostsFilter {
  offset: number
  limit: number
  category?: string
  skinType?: string
  moodTag?: string
  search?: string
  sortBy?: 'recent' | 'popular'
  userId?: string
  publishedOnly?: boolean
  createdAfter?: Date
}

export interface FindPostsResult {
  posts: Post[]
  totalCount: number
}

export interface PostRepository {
  findById(id: string): Promise<Post | null>
  findMany(filter: FindPostsFilter): Promise<FindPostsResult>
  create(data: CreatePostData): Promise<Post>
  update(id: string, data: UpdatePostData): Promise<Post>
  delete(id: string): Promise<void>
  incrementEmpathyCount(id: string): Promise<void>
  decrementEmpathyCount(id: string): Promise<void>
  incrementCommentCount(id: string): Promise<void>
  decrementCommentCount(id: string): Promise<void>

  // Admin-specific methods
  findAllForAdmin(): Promise<Post[]>
  findRecentPosts(limit: number): Promise<Post[]>
  countPublishedPosts(): Promise<number>
  getTotalViews(): Promise<number>
  updatePublishStatus(id: string, isPublished: boolean): Promise<void>
}
