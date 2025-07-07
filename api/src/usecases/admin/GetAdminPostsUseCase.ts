import { PostRepository } from '@api/domain/repositories/PostRepository'
import { UserRepository } from '@api/domain/repositories/UserRepository'

export interface AdminPostItem {
  id: string
  title: string
  content: string
  userName: string
  status: string
  empathyCount: number
  viewCount: number
  createdAt: string
  cosmeticName: string | null
}

export class GetAdminPostsUseCase {
  constructor(
    private postRepository: PostRepository,
    private userRepository: UserRepository
  ) {}

  async execute(): Promise<AdminPostItem[]> {
    try {
      // Get all posts for admin view (including unpublished)
      const posts = await this.postRepository.findAllForAdmin()

      // Get user information for each post
      const postsWithUsers = await Promise.all(
        posts.map(async post => {
          const user = await this.userRepository.findById(post.userId)
          return {
            id: post.id,
            title: post.title,
            content: post.content,
            userName: user?.username || 'Unknown',
            status: post.isPublished ? 'published' : 'hidden',
            empathyCount: post.empathyCount,
            viewCount: post.commentCount, // Using commentCount as viewCount placeholder
            createdAt: post.createdAt.toISOString(),
            cosmeticName: post.productName,
          }
        })
      )

      return postsWithUsers
    } catch (error) {
      console.error('Get admin posts error:', error)
      throw new Error('Failed to fetch posts')
    }
  }
}
