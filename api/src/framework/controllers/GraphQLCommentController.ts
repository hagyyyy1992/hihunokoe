import { CreateCommentUseCase } from '@api/usecases/comments/CreateCommentUseCase'
import { GetCommentsWithPaginationUseCase } from '@api/usecases/comments/GetCommentsWithPaginationUseCase'
import { CommentRepositoryImpl } from '@api/interface-adapters/repositories/CommentRepositoryImpl'
import { UserRepositoryImpl } from '@api/interface-adapters/repositories/UserRepositoryImpl'
import { GraphQLContext } from '@/graphql/context'

export class GraphQLCommentController {
  private commentRepository: CommentRepositoryImpl
  private userRepository: UserRepositoryImpl

  constructor() {
    this.commentRepository = new CommentRepositoryImpl()
    this.userRepository = new UserRepositoryImpl()
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

    const createCommentUseCase = new CreateCommentUseCase(this.commentRepository)

    try {
      const { comment } = await createCommentUseCase.execute({
        postId: args.input.postId,
        userId: context.userId,
        content: args.input.content,
        parentId: args.input.parentId,
      })

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
    const getCommentsUseCase = new GetCommentsWithPaginationUseCase(
      this.commentRepository,
      this.userRepository
    )

    const limit = args.first || 10
    const skip = args.after ? parseInt(args.after) : 0

    try {
      const { comments } = await getCommentsUseCase.execute({
        postId: args.postId,
        skip,
        limit,
      })

      // Convert to GraphQL Connection format
      const edges = comments.map((commentWithUser, index) => ({
        cursor: (skip + index + 1).toString(),
        node: {
          ...commentWithUser.comment,
          user: commentWithUser.user,
          replies:
            commentWithUser.replies?.map(reply => ({
              ...reply.comment,
              user: reply.user,
            })) || [],
        },
      }))

      const hasNextPage = comments.length === limit
      const hasPreviousPage = skip > 0

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
