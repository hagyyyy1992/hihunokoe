import { PostRepository } from '@api/domain/repositories/PostRepository'
import { UserRepository } from '@api/domain/repositories/UserRepository'

export interface AdminDeletePostRequest {
  postId: string
  adminUserId: string
  ipAddress: string
  userAgent: string
}

export interface AdminDeletePostResponse {
  message: string
  post: {
    id: string
    title: string
    userName: string
  }
}

export class AdminDeletePostUseCase {
  constructor(
    private postRepository: PostRepository,
    private userRepository: UserRepository
  ) {}

  async execute(request: AdminDeletePostRequest): Promise<AdminDeletePostResponse> {
    const { postId, adminUserId, ipAddress, userAgent } = request

    // Verify admin user exists and has admin privileges
    const adminUser = await this.userRepository.findById(adminUserId)
    if (!adminUser || !adminUser.isAdmin()) {
      throw new Error('Admin privileges required')
    }

    // Find the post to delete
    const post = await this.postRepository.findById(postId)
    if (!post) {
      throw new Error('Post not found')
    }

    // Get post owner information for logging
    const postOwner = await this.userRepository.findById(post.userId)
    const postOwnerName = postOwner?.username || 'Unknown'

    // Delete the post
    await this.postRepository.delete(postId)

    // Note: Admin action logging should be handled by the controller or a separate service
    // to maintain separation of concerns

    return {
      message: 'Post deleted successfully',
      post: {
        id: post.id,
        title: post.title,
        userName: postOwnerName,
      },
    }
  }
}
