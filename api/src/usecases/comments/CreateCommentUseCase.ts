import { Comment } from '@api/domain/entities/Comment'
import { CommentRepository } from '@api/domain/repositories/CommentRepository'
import { PostRepository } from '@api/domain/repositories/PostRepository'
import { UserRepository } from '@api/domain/repositories/UserRepository'

export interface CreateCommentInput {
  postId: string
  userId: string
  content: string
}

export interface CreateCommentOutput {
  comment: Comment
}

export class CreateCommentUseCase {
  constructor(
    private commentRepository: CommentRepository,
    private postRepository: PostRepository,
    private userRepository: UserRepository
  ) {}

  async execute(input: CreateCommentInput): Promise<CreateCommentOutput> {
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

    // コメント作成
    const comment = await this.commentRepository.create(
      input.postId,
      input.userId,
      input.content.trim()
    )

    return { comment }
  }
}
