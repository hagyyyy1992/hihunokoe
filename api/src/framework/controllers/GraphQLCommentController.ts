import {
  CommentManagementUseCase,
  CommentRetrievalUseCase,
} from '@api/usecases/comments/interactor'
import type {
  CreateCommentInputPort,
  GetCommentsWithPaginationInputPort,
} from '@api/usecases/comments/input-port'
import { CommentRepositoryImpl } from '@api/interface-adapters/repositories/CommentRepositoryImpl'
import { PostRepositoryImpl } from '@api/interface-adapters/repositories/PostRepositoryImpl'
import { UserRepositoryImpl } from '@api/interface-adapters/repositories/UserRepositoryImpl'
import { RateLimitServiceImpl } from '@api/interface-adapters/services/RateLimitServiceImpl'
import { GraphQLContext } from '@/graphql/context'

export class GraphQLCommentController {
  private commentManagementUseCase: CommentManagementUseCase
  private commentRetrievalUseCase: CommentRetrievalUseCase

  constructor() {
    const commentRepository = new CommentRepositoryImpl()
    const postRepository = new PostRepositoryImpl()
    const userRepository = new UserRepositoryImpl()
    const rateLimitService = new RateLimitServiceImpl()

    this.commentManagementUseCase = new CommentManagementUseCase(
      commentRepository,
      postRepository,
      userRepository,
      rateLimitService
    )
    this.commentRetrievalUseCase = new CommentRetrievalUseCase(commentRepository)
  }

  async createComment(
    args: {
      input: {
        postId: string
        content: string
        parentId?: string
      }
    },
    context: GraphQLContext
  ) {
    if (!context.userId) {
      throw new Error('Authentication required')
    }

    const input: CreateCommentInputPort = {
      postId: args.input.postId,
      userId: context.userId,
      content: args.input.content,
    }

    try {
      const { comment } = await this.commentManagementUseCase.createComment(input)

      return comment
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async getComments(
    args: {
      postId: string
      first?: number
      after?: string
    },
    context: GraphQLContext
  ) {
    const limit = args.first || 10
    const page = args.after ? Math.floor(parseInt(args.after) / limit) + 1 : 1

    const input: GetCommentsWithPaginationInputPort = {
      postId: args.postId,
      page,
      limit,
      userId: context.userId || undefined,
    }

    try {
      const { comments } = await this.commentRetrievalUseCase.getCommentsWithPagination(input)

      // Convert to GraphQL Connection format
      const edges = comments.map((commentWithUser: any, index: number) => ({
        cursor: ((page - 1) * limit + index + 1).toString(),
        node: {
          ...commentWithUser.comment,
          user: commentWithUser.user,
          replies:
            commentWithUser.replies?.map((reply: any) => ({
              ...reply.comment,
              user: reply.user,
            })) || [],
        },
      }))

      const hasNextPage = comments.length === limit
      const hasPreviousPage = page > 1

      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage,
          startCursor: edges[0]?.cursor,
          endCursor: edges[edges.length - 1]?.cursor,
        },
      }
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }
}
