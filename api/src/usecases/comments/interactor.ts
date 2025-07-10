import { Comment } from '@api/domain/entities/Comment'
import { ICommentRepository } from '@api/domain/repositories/CommentRepository'
import { IPostRepository } from '@api/domain/repositories/PostRepository'
import { IUserRepository } from '@api/domain/repositories/UserRepository'
import { RateLimitService } from '@api/domain/services/RateLimitService'
import {
  ICommentManagementUseCase,
  ICommentRetrievalUseCase,
  CreateCommentInputPort,
  CreateReplyInputPort,
  UpdateCommentInputPort,
  DeleteCommentInputPort,
  GetCommentInputPort,
  GetCommentsInputPort,
  GetCommentsWithPaginationInputPort,
} from './input-port'
import {
  CreateCommentOutputPort,
  CreateReplyOutputPort,
  UpdateCommentOutputPort,
  DeleteCommentOutputPort,
  GetCommentOutputPort,
  GetCommentsOutputPort,
  GetCommentsWithPaginationOutputPort,
} from './output-port'

export class CommentManagementUseCase implements ICommentManagementUseCase {
  constructor(
    private commentRepository: ICommentRepository,
    private postRepository: IPostRepository,
    private userRepository: IUserRepository,
    private rateLimitService?: RateLimitService
  ) {}

  async createComment(input: CreateCommentInputPort): Promise<CreateCommentOutputPort> {
    // レート制限チェック（5秒に1回まで）
    if (this.rateLimitService) {
      const canProceed = this.rateLimitService.checkRateLimit(
        input.userId,
        'create_comment',
        5 * 1000, // 5秒
        1 // 1回まで
      )
      if (!canProceed) {
        throw new Error('投稿間隔を空けてください（5秒に1回まで）')
      }
    }

    // バリデーション
    if (!input.content.trim()) {
      throw new Error('コメント内容は必須です')
    }

    if (input.content.length > 1000) {
      throw new Error('コメントは1000文字以内で入力してください')
    }

    // 投稿の存在確認
    const post = await this.postRepository.findById(input.postId)
    if (!post) {
      throw new Error('投稿が見つかりませんでした')
    }

    if (!post.isPublished) {
      throw new Error('この投稿にはコメントできません')
    }

    // ユーザーの存在確認
    const user = await this.userRepository.findById(input.userId)
    if (!user) {
      throw new Error('ユーザーが見つかりませんでした')
    }

    if (!user.active || user.deletedAt) {
      throw new Error('無効なアカウントです')
    }

    // コメント作成
    const comment = await this.commentRepository.create(
      input.postId,
      input.userId,
      input.content.trim()
    )

    return {
      comment,
      message: 'コメントを投稿しました',
    }
  }

  async createReply(input: CreateReplyInputPort): Promise<CreateReplyOutputPort> {
    // レート制限チェック（5秒に1回まで）
    if (this.rateLimitService) {
      const canProceed = this.rateLimitService.checkRateLimit(
        input.userId,
        'create_comment',
        5 * 1000, // 5秒
        1 // 1回まで
      )
      if (!canProceed) {
        throw new Error('投稿間隔を空けてください（5秒に1回まで）')
      }
    }

    // バリデーション
    if (!input.content.trim()) {
      throw new Error('返信内容は必須です')
    }

    if (input.content.length > 1000) {
      throw new Error('返信は1000文字以内で入力してください')
    }

    // 親コメントの存在確認
    const parentComment = await this.commentRepository.findById(input.parentCommentId)
    if (!parentComment) {
      throw new Error('返信先のコメントが見つかりませんでした')
    }

    // 2階層までのチェック
    if (parentComment.parentCommentId) {
      throw new Error('返信は2階層までしか投稿できません')
    }

    // 投稿の存在確認
    const post = await this.postRepository.findById(parentComment.postId)
    if (!post) {
      throw new Error('投稿が見つかりませんでした')
    }

    if (!post.isPublished) {
      throw new Error('この投稿にはコメントできません')
    }

    // ユーザーの存在確認
    const user = await this.userRepository.findById(input.userId)
    if (!user) {
      throw new Error('ユーザーが見つかりませんでした')
    }

    if (!user.active || user.deletedAt) {
      throw new Error('無効なアカウントです')
    }

    // 返信作成
    const comment = await this.commentRepository.create(
      parentComment.postId,
      input.userId,
      input.content.trim(),
      input.parentCommentId
    )

    return {
      comment,
      message: '返信を投稿しました',
    }
  }

  async updateComment(input: UpdateCommentInputPort): Promise<UpdateCommentOutputPort> {
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

    // 権限確認（作成者のみ編集可能）
    if (comment.userId !== input.userId) {
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

    return {
      comment: updatedComment,
      message: 'コメントを更新しました',
    }
  }

  async deleteComment(input: DeleteCommentInputPort): Promise<DeleteCommentOutputPort> {
    // コメントの存在確認
    const comment = await this.commentRepository.findById(input.commentId)
    if (!comment) {
      throw new Error('コメントが見つかりませんでした')
    }

    // 権限確認（作成者のみ削除可能）
    if (comment.userId !== input.userId) {
      throw new Error('このコメントを削除する権限がありません')
    }

    // コメント削除
    await this.commentRepository.delete(input.commentId)

    return {
      commentId: input.commentId,
      message: 'コメントを削除しました',
    }
  }
}

export class CommentRetrievalUseCase implements ICommentRetrievalUseCase {
  constructor(private commentRepository: ICommentRepository) {}

  async getComment(input: GetCommentInputPort): Promise<GetCommentOutputPort> {
    const comment = await this.commentRepository.findById(input.commentId)
    if (!comment) {
      throw new Error('コメントが見つかりませんでした')
    }

    return { comment }
  }

  async getComments(input: GetCommentsInputPort): Promise<GetCommentsOutputPort> {
    const comments = await this.commentRepository.findByPostId(input.postId)

    return {
      comments,
      total: comments.length,
    }
  }

  async getCommentsWithPagination(
    input: GetCommentsWithPaginationInputPort
  ): Promise<GetCommentsWithPaginationOutputPort> {
    const page = input.page || 1
    const limit = input.limit || 20
    const offset = (page - 1) * limit

    const comments = await this.commentRepository.findByPostIdWithPagination(
      input.postId,
      offset,
      limit
    )
    const total = await this.commentRepository.countByPostId(input.postId)

    const hasNext = offset + comments.length < total

    return {
      comments,
      total,
      page,
      limit,
      hasNext,
    }
  }
}
