import { EmpathyRepository } from '@api/domain/repositories/EmpathyRepository'
import { PostRepository } from '@api/domain/repositories/PostRepository'

export interface RemoveEmpathyInputData {
  postId: string
  userId: string
}

export interface RemoveEmpathyOutputData {
  success: boolean
  empathyCount: number
}

export class RemoveEmpathyUseCase {
  constructor(
    private empathyRepository: EmpathyRepository,
    private postRepository: PostRepository
  ) {}

  async execute(inputData: RemoveEmpathyInputData): Promise<RemoveEmpathyOutputData> {
    const { postId, userId } = inputData

    // Validate post exists
    const post = await this.postRepository.findById(postId)
    if (!post) {
      throw new Error('Post not found')
    }

    // Check if user gave empathy
    const existingEmpathy = await this.empathyRepository.findByUserAndPost(userId, postId)
    if (!existingEmpathy) {
      throw new Error('No empathy found for this post')
    }

    // Remove empathy
    await this.empathyRepository.delete(existingEmpathy.id)

    // Get updated empathy count
    const empathyCount = await this.empathyRepository.countByPost(postId)

    return {
      success: true,
      empathyCount,
    }
  }
}
