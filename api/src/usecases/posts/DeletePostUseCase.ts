import { PostRepository } from '@api/domain/repositories/PostRepository'

export interface DeletePostInputData {
  postId: string
  userId: string
}

export interface DeletePostOutputData {
  success: boolean
}

export class DeletePostUseCase {
  constructor(private postRepository: PostRepository) {}

  async execute(inputData: DeletePostInputData): Promise<DeletePostOutputData> {
    const { postId, userId } = inputData

    const post = await this.postRepository.findById(postId)

    if (!post) {
      throw new Error('Post not found')
    }

    // Check if user is the owner
    if (post.userId !== userId) {
      throw new Error('Not authorized to delete this post')
    }

    await this.postRepository.delete(postId)

    return { success: true }
  }
}
