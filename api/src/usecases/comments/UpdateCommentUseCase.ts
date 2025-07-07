import { Comment } from '@api/domain/entities/Comment'
import { CommentRepository } from '@api/domain/repositories/CommentRepository'

export interface UpdateCommentInput {
  commentId: string
  userId: string
  content: string
}

export interface UpdateCommentOutput {
  comment: Comment
}

export class UpdateCommentUseCase {
  constructor(private commentRepository: CommentRepository) {}

  async execute(input: UpdateCommentInput): Promise<UpdateCommentOutput> {
    // バリデーション
    if (!input.content.trim()) {
      throw new Error('コメント内容は必須です')
    }

    if (input.content.length > 1000) {
      throw new Error('コメントは1000文字以内で入力してください')
    }

    // コメントの存在確認
    const comment = await this.commentRepository.findById(input.commentId)
    if (!comment) {
      throw new Error('コメントが見つかりませんでした')
    }

    // 編集権限チェック
    if (!comment.canBeEditedBy(input.userId)) {
      throw new Error('このコメントを編集する権限がありません')
    }

    // コメント更新
    const updatedComment = await this.commentRepository.update(
      input.commentId,
      input.content.trim()
    )

    if (!updatedComment) {
      throw new Error('コメントの更新に失敗しました')
    }

    return { comment: updatedComment }
  }
}
