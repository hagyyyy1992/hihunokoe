import { Comment } from '@api/domain/entities/Comment'
import { CommentRepository } from '@api/domain/repositories/CommentRepository'
import { PostRepository } from '@api/domain/repositories/PostRepository'

export interface GetCommentsInput {
  postId: string
  userId?: string
}

export interface GetCommentsOutput {
  comments: Comment[]
}

export class GetCommentsUseCase {
  constructor(
    private commentRepository: CommentRepository,
    private postRepository: PostRepository
  ) {}

  async execute(input: GetCommentsInput): Promise<GetCommentsOutput> {
    // 投稿の存在確認
    const post = await this.postRepository.findById(input.postId)
    if (!post) {
      throw new Error('投稿が見つかりませんでした')
    }

    if (!post.isPublished) {
      throw new Error('この投稿のコメントは表示できません')
    }

    // コメント取得
    const comments = await this.commentRepository.findByPostId(input.postId)

    return { comments }
  }
}
