import { EmpathyRepository } from '@api/domain/repositories/EmpathyRepository'
import { PostRepository } from '@api/domain/repositories/PostRepository'
import { UserRepository } from '@api/domain/repositories/UserRepository'

export interface AddEmpathyInputData {
  postId: string
  userId: string
}

export interface AddEmpathyOutputData {
  success: boolean
  empathyCount: number
}

export class AddEmpathyUseCase {
  constructor(
    private empathyRepository: EmpathyRepository,
    private postRepository: PostRepository,
    private userRepository: UserRepository
  ) {}

  async execute(inputData: AddEmpathyInputData): Promise<AddEmpathyOutputData> {
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
    if (existingEmpathy) {
      throw new Error('Already gave empathy to this post')
    }

    // Add empathy
    await this.empathyRepository.create({
      userId,
      postId,
    })

    // Get updated empathy count
    const empathyCount = await this.empathyRepository.countByPost(postId)

    return {
      success: true,
      empathyCount,
    }
  }
}
