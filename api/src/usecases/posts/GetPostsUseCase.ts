import { Post } from '@api/domain/entities/Post'
import { PostRepository } from '@api/domain/repositories/PostRepository'

export interface GetPostsInputData {
  page?: number
  limit?: number
  category?: string
  search?: string
  sortBy?: 'recent' | 'popular'
  userId?: string
}

export interface GetPostsOutputData {
  posts: Post[]
  totalCount: number
  currentPage: number
  totalPages: number
}

export class GetPostsUseCase {
  constructor(private postRepository: PostRepository) {}

  async execute(inputData: GetPostsInputData): Promise<GetPostsOutputData> {
    const { page = 1, limit = 10, category, search, sortBy = 'recent', userId } = inputData

    // Validate pagination parameters
    if (page < 1) {
      throw new Error('Page must be greater than 0')
    }

    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100')
    }

    const offset = (page - 1) * limit

    // Get posts with filters
    const result = await this.postRepository.findMany({
      offset,
      limit,
      category: category?.trim() || undefined,
      search: search?.trim() || undefined,
      sortBy,
      userId,
      publishedOnly: !userId, // If no userId specified, only show published posts
    })

    const totalPages = Math.ceil(result.totalCount / limit)

    return {
      posts: result.posts,
      totalCount: result.totalCount,
      currentPage: page,
      totalPages,
    }
  }
}
