import { Comment } from '@api/domain/entities/Comment'
import { CommentRepository } from '@api/domain/repositories/CommentRepository'

export interface GetCommentInput {
  commentId: string
  userId?: string
}

export interface GetCommentOutput {
  comment: Comment
}

export class GetCommentUseCase {
  constructor(private commentRepository: CommentRepository) {}

  async execute(input: GetCommentInput): Promise<GetCommentOutput> {
    // コメントの存在確認
    const comment = await this.commentRepository.findById(input.commentId)
    if (!comment) {
      throw new Error('コメントが見つかりませんでした')
    }

    if (!comment.isActive) {
      throw new Error('このコメントは削除されています')
    }

    return { comment }
  }
}
