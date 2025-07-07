import { Comment } from '@api/domain/entities/Comment'
import { CommentRepository } from '@api/domain/repositories/CommentRepository'
import { PostRepository } from '@api/domain/repositories/PostRepository'
import { UserRepository } from '@api/domain/repositories/UserRepository'

export interface CreateReplyInput {
  parentCommentId: string
  userId: string
  content: string
}

export interface CreateReplyOutput {
  reply: Comment
}

export class CreateReplyUseCase {
  constructor(
    private commentRepository: CommentRepository,
    private postRepository: PostRepository,
    private userRepository: UserRepository
  ) {}

  async execute(input: CreateReplyInput): Promise<CreateReplyOutput> {
    // バリデーション
    if (!input.content.trim()) {
      throw new Error('コメント内容は必須です')
    }

    if (input.content.length > 1000) {
      throw new Error('コメントは1000文字以内で入力してください')
    }

    // 親コメントの存在確認
    const parentComment = await this.commentRepository.findById(input.parentCommentId)
    if (!parentComment) {
      throw new Error('コメントが見つかりませんでした')
    }

    if (!parentComment.isActive) {
      throw new Error('このコメントは削除されています')
    }

    // 返信の階層制限（最大2階層まで）
    if (!parentComment.canBeRepliedTo()) {
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

    // 返信作成
    const reply = await this.commentRepository.create(
      parentComment.postId,
      input.userId,
      input.content.trim(),
      input.parentCommentId
    )

    return { reply }
  }
}
