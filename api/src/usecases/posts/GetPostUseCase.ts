import { Post } from '@api/domain/entities/Post'
import { PostRepository } from '@api/domain/repositories/PostRepository'

export interface GetPostInputData {
  postId: string
  requestUserId?: string
}

export interface GetPostOutputData {
  post: Post
}

export class GetPostUseCase {
  constructor(private postRepository: PostRepository) {}

  async execute(inputData: GetPostInputData): Promise<GetPostOutputData> {
    const { postId, requestUserId } = inputData

    const post = await this.postRepository.findById(postId)

    if (!post) {
      throw new Error('Post not found')
    }

    // Check if post is published or if user is the owner
    if (!post.isPublished && post.userId !== requestUserId) {
      throw new Error('Post not found')
    }

    return { post }
  }
}
