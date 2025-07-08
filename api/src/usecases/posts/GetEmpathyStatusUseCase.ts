import { EmpathyRepository } from '@api/domain/repositories/EmpathyRepository'
import { PostRepository } from '@api/domain/repositories/PostRepository'
import { UserRepository } from '@api/domain/repositories/UserRepository'
import { EmpathyType } from '@api/domain/entities/Empathy'

export interface GetEmpathyStatusInputData {
  postId: string
  userId: string
}

export interface GetEmpathyStatusOutputData {
  hasEmpathized: boolean
  empathyType: EmpathyType | null
  totalCount: number
}

export class GetEmpathyStatusUseCase {
  constructor(
    private empathyRepository: EmpathyRepository,
    private postRepository: PostRepository,
    private userRepository: UserRepository
  ) {}

  async execute(inputData: GetEmpathyStatusInputData): Promise<GetEmpathyStatusOutputData> {
    const { postId, userId } = inputData

    // Validate user exists and is active
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    if (!user.isActive || user.deletedAt) {
      throw new Error('User account is inactive')
    }

    // Validate post exists and is published
    const post = await this.postRepository.findById(postId)
    if (!post) {
      throw new Error('Post not found')
    }

    if (!post.isPublished) {
      throw new Error('Post not found')
    }

    // Check if user already gave empathy
    const existingEmpathy = await this.empathyRepository.findByUserAndPost(userId, postId)

    // Get total empathy count for this post
    const totalCount = await this.empathyRepository.countByPost(postId)

    return {
      hasEmpathized: !!existingEmpathy,
      empathyType: existingEmpathy?.empathyType || null,
      totalCount,
    }
  }
}
