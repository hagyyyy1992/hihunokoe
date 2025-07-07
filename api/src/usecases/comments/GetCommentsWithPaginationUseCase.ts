import { Comment } from '@api/domain/entities/Comment'
import { User } from '@api/domain/entities/User'
import { CommentRepository } from '@api/domain/repositories/CommentRepository'
import { PostRepository } from '@api/domain/repositories/PostRepository'
import { UserRepository } from '@api/domain/repositories/UserRepository'

export interface GetCommentsWithPaginationInput {
  postId: string
  page: number
  limit: number
  userId?: string
}

export interface CommentWithUser {
  comment: Comment
  user: User
  replies?: CommentWithUser[]
}

export interface GetCommentsWithPaginationOutput {
  comments: CommentWithUser[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

export class GetCommentsWithPaginationUseCase {
  constructor(
    private commentRepository: CommentRepository,
    private postRepository: PostRepository,
    private userRepository: UserRepository
  ) {}

  async execute(input: GetCommentsWithPaginationInput): Promise<GetCommentsWithPaginationOutput> {
    // 投稿の存在確認
    const post = await this.postRepository.findById(input.postId)
    if (!post) {
      throw new Error('投稿が見つかりませんでした')
    }

    if (!post.isPublished) {
      throw new Error('この投稿のコメントは表示できません')
    }

    // トップレベルコメント数の取得（parentCommentIdがnullのもののみ）
    const totalComments = await this.commentRepository.countByPostId(input.postId)

    // ページネーション計算
    const skip = (input.page - 1) * input.limit

    // コメント取得（ページネーション付き）
    const topLevelComments = await this.commentRepository.findByPostIdWithPagination(
      input.postId,
      skip,
      input.limit
    )

    // コメントとユーザー情報を組み立て
    const commentsWithUsers: CommentWithUser[] = []

    for (const comment of topLevelComments) {
      const user = await this.userRepository.findById(comment.userId)
      if (!user) continue

      // 返信を取得
      const replies = await this.commentRepository.findRepliesByParentId(comment.id)
      const repliesWithUsers: CommentWithUser[] = []

      for (const reply of replies) {
        const replyUser = await this.userRepository.findById(reply.userId)
        if (replyUser) {
          repliesWithUsers.push({
            comment: reply,
            user: replyUser,
          })
        }
      }

      commentsWithUsers.push({
        comment,
        user,
        replies: repliesWithUsers,
      })
    }

    const hasMore = skip + topLevelComments.length < totalComments

    return {
      comments: commentsWithUsers,
      pagination: {
        page: input.page,
        limit: input.limit,
        total: totalComments,
        hasMore,
      },
    }
  }
}
