import { CommentRepository } from '@api/domain/repositories/CommentRepository'

export interface DeleteCommentInput {
  commentId: string
  userId: string
}

export interface DeleteCommentOutput {
  success: boolean
}

export class DeleteCommentUseCase {
  constructor(private commentRepository: CommentRepository) {}

  async execute(input: DeleteCommentInput): Promise<DeleteCommentOutput> {
    // コメントの存在確認
    const comment = await this.commentRepository.findById(input.commentId)
    if (!comment) {
      throw new Error('コメントが見つかりませんでした')
    }

    // 削除権限チェック
    if (!comment.canBeDeletedBy(input.userId)) {
      throw new Error('このコメントを削除する権限がありません')
    }

    // コメント削除（ソフトデリート）
    const success = await this.commentRepository.softDelete(input.commentId)

    if (!success) {
      throw new Error('コメントの削除に失敗しました')
    }

    return { success }
  }
}
