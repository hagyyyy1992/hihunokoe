import { PostRepository } from '@api/domain/repositories/PostRepository'
import { UserRepository } from '@api/domain/repositories/UserRepository'

export interface UnpublishPostRequest {
  postId: string
  adminUserId: string
  ipAddress: string
  userAgent: string
}

export interface UnpublishPostResponse {
  message: string
  post: {
    id: string
    title: string
    userName: string
  }
}

export class UnpublishPostUseCase {
  constructor(
    private postRepository: PostRepository,
    private userRepository: UserRepository
  ) {}

  async execute(request: UnpublishPostRequest): Promise<UnpublishPostResponse> {
    const { postId, adminUserId, ipAddress, userAgent } = request

    // Verify admin user exists and has admin privileges
    const adminUser = await this.userRepository.findById(adminUserId)
    if (!adminUser || !adminUser.isAdmin()) {
      throw new Error('Admin privileges required')
    }

    // Find the post to unpublish
    const post = await this.postRepository.findById(postId)
    if (!post) {
      throw new Error('Post not found')
    }

    // Get post owner information for logging
    const postOwner = await this.userRepository.findById(post.userId)
    const postOwnerName = postOwner?.username || 'Unknown'

    // Update post status to hidden
    await this.postRepository.updatePublishStatus(postId, false)

    // Get the updated post
    const updatedPost = await this.postRepository.findById(postId)
    if (!updatedPost) {
      throw new Error('Failed to update post')
    }

    return {
      message: 'Post unpublished successfully',
      post: {
        id: updatedPost.id,
        title: updatedPost.title,
        userName: postOwnerName,
      },
    }
  }
}
