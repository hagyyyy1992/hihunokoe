import {
  PostRetrievalUseCase,
  PostManagementUseCase,
  EmpathyManagementUseCase,
} from '@api/usecases/posts/interactor'
import type {
  GetPostInputPort,
  GetPostsInputPort,
  CreatePostInputPort,
  UpdatePostInputPort,
  DeletePostInputPort,
} from '@api/usecases/posts/input-port'
import type { IUserRepository } from '@api/domain/repositories/UserRepository'
import type { IPostRepository } from '@api/domain/repositories/PostRepository'
import type { IEmpathyRepository } from '@api/domain/repositories/EmpathyRepository'
import type { ICommentRepository } from '@api/domain/repositories/CommentRepository'
import { PostValidator } from '@api/framework/validators/PostValidator'
import { ApplicationError } from '@api/framework/errors/ApplicationError'
import { GraphQLContext } from '@/graphql/context'
import { PerformanceLogger } from '@api/lib/performance-logger'

export class GraphQLPostController {
  constructor(
    private postRetrievalUseCase: PostRetrievalUseCase,
    private postManagementUseCase: PostManagementUseCase,
    private empathyManagementUseCase: EmpathyManagementUseCase,
    private userRepository: IUserRepository,
    private postRepository: IPostRepository,
    private empathyRepository: IEmpathyRepository,
    private commentRepository: ICommentRepository
  ) {}

  async getPost(args: { id: string }, context: GraphQLContext) {
    try {
      const postId = PostValidator.validatePostId(args.id)
      const input: GetPostInputPort = {
        postId,
        userId: context.userId || undefined,
      }
      const { post } = await this.postRetrievalUseCase.getPost(input)
      return post
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw new Error(error.message)
      }
      console.error('Error in GraphQLPostController.getPost:', error)
      throw new Error('投稿の取得中にエラーが発生しました。')
    }
  }

  async getPosts(
    args: {
      first?: number
      after?: string
      filter?: {
        skinType?: string
        cosmeticCategory?: string
        moodTag?: string
        search?: string
      }
      orderBy?: string
    },
    context: GraphQLContext
  ) {
    const perfLogger = new PerformanceLogger('GraphQLPostController.getPosts', { args })
    try {
      // Convert GraphQL args to use case input
      perfLogger.start('args-conversion')
      const limit = args.first || 10
      const skip = args.after ? parseInt(args.after) : 0
      // GraphQL orderBy to internal format conversion
      let internalOrderBy: string | null = null
      if (args.orderBy === 'CREATED_AT_DESC') {
        internalOrderBy = 'recent'
      } else if (args.orderBy === 'EMPATHY_COUNT_DESC') {
        internalOrderBy = 'popular'
      }
      perfLogger.end('args-conversion')
      // バリデーション
      perfLogger.start('validation')
      const { page } = PostValidator.validatePagination(Math.floor(skip / limit) + 1, limit)
      const category = PostValidator.validateCategory(args.filter?.cosmeticCategory || null)
      const skinType = PostValidator.validateSkinType(args.filter?.skinType || null)
      const moodTag = PostValidator.validateMoodTag(args.filter?.moodTag || null)
      const search = PostValidator.validateSearch(args.filter?.search || null)
      const sortBy = PostValidator.validateSortBy(internalOrderBy)
      perfLogger.end('validation')
      const input: GetPostsInputPort = {
        page,
        limit,
        category,
        skinType,
        moodTag,
        search,
        sortBy,
        userId: context.userId || undefined,
      }
      perfLogger.start('usecase-getPosts')
      const { posts, total } = await this.postRetrievalUseCase.getPosts(input)
      perfLogger.end('usecase-getPosts', { postCount: posts.length, total })
      // Convert to GraphQL Connection format
      perfLogger.start('graphql-conversion')
      const edges = posts.map((post, index) => ({
        cursor: (skip + index + 1).toString(),
        node: post,
      }))
      const hasNextPage = posts.length === limit
      const hasPreviousPage = skip > 0
      const result = {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage,
          startCursor: edges[0]?.cursor,
          endCursor: edges[edges.length - 1]?.cursor,
        },
        totalCount: total,
      }
      perfLogger.end('graphql-conversion')
      perfLogger.finish({ success: true, resultCount: edges.length })
      return result
    } catch (error) {
      perfLogger.finish({ success: false, error: (error as Error).message })
      if (error instanceof ApplicationError) {
        throw new Error(error.message)
      }
      console.error('Error in GraphQLPostController.getPosts:', error)
      // 検索エラーの場合は特別なメッセージ
      if (args.filter?.search && (error as Error).name === 'PostSearchError') {
        throw new Error('検索中にエラーが発生しました。検索条件を変更してお試しください。')
      }
      // その他のエラーはユーザーフレンドリーなメッセージ
      throw new Error('投稿の取得中にエラーが発生しました。しばらく待ってから再度お試しください。')
    }
  }

  async createPost(
    args: {
      input: {
        title?: string
        content: string
        cosmeticName?: string
        brandName?: string
        color?: string
        cosmeticCategory?: string
        skinType?: string
        usageSituation?: any
        experienceDetails?: any
        moodTag?: string
      }
    },
    context: GraphQLContext
  ) {
    try {
      if (!context.userId) throw ApplicationError.unauthorized()
      const validatedData = PostValidator.validateCreatePost({
        userId: context.userId,
        title: args.input.title,
        content: args.input.content,
        productName: args.input.cosmeticName,
        brandName: args.input.brandName,
        color: args.input.color,
        imageUrl: undefined,
        category: args.input.cosmeticCategory,
        skinType: args.input.skinType,
        moodTag: args.input.moodTag,
        usageSituation: args.input.usageSituation,
        experienceDetails: args.input.experienceDetails,
      })
      const input: CreatePostInputPort = validatedData
      const { post } = await this.postManagementUseCase.createPost(input)
      return post
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw new Error(error.message)
      }
      throw new Error((error as Error).message)
    }
  }

  async updatePost(
    args: {
      id: string
      input: {
        title?: string
        content?: string
        cosmeticName?: string
        brandName?: string
        color?: string
        cosmeticCategory?: string
        skinType?: string
        usageSituation?: any
        experienceDetails?: any
        moodTag?: string
      }
    },
    context: GraphQLContext
  ) {
    try {
      if (!context.userId) throw ApplicationError.unauthorized()
      const postId = PostValidator.validatePostId(args.id)
      console.log('GraphQL updatePost input data:', JSON.stringify(args.input, null, 2))
      const validatedData = PostValidator.validateUpdatePost({
        postId,
        userId: context.userId,
        title: args.input.title,
        content: args.input.content,
        productName: args.input.cosmeticName,
        brandName: args.input.brandName,
        color: args.input.color,
        category: args.input.cosmeticCategory,
        skinType: args.input.skinType,
        moodTag: args.input.moodTag,
        usageSituation: args.input.usageSituation,
        experienceDetails: args.input.experienceDetails,
      })
      const input: UpdatePostInputPort = validatedData
      const { post } = await this.postManagementUseCase.updatePost(input)
      return post
    } catch (error) {
      if (error instanceof ApplicationError) {
        console.error('GraphQL updatePost validation error:', error.details)
        const detailsStr = error.details ? ` (詳細: ${JSON.stringify(error.details)})` : ''
        throw new Error(`${error.message}${detailsStr}`)
      }
      console.error('GraphQL updatePost error:', error)
      throw new Error((error as Error).message)
    }
  }

  async deletePost(args: { id: string }, context: GraphQLContext) {
    try {
      if (!context.userId) throw ApplicationError.unauthorized()
      const postId = PostValidator.validatePostId(args.id)
      const input: DeletePostInputPort = {
        postId,
        userId: context.userId,
      }
      await this.postManagementUseCase.deletePost(input)
      return true
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw new Error(error.message)
      }
      throw new Error((error as Error).message)
    }
  }

  async getPostComments(
    args: { postId: string; first?: number; after?: string },
    context: GraphQLContext
  ) {
    try {
      const limit = args.first || 10
      const offset = args.after ? parseInt(args.after) : 0
      const comments = await this.commentRepository.findByPostId(args.postId)
      const edges = comments.map((comment, index) => ({
        cursor: (offset + index + 1).toString(),
        node: comment,
      }))
      return {
        edges,
        pageInfo: {
          hasNextPage: comments.length === limit,
          hasPreviousPage: offset > 0,
          startCursor: edges[0]?.cursor,
          endCursor: edges[edges.length - 1]?.cursor,
        },
        totalCount: comments.length, // TODO: 正確な総数を取得する場合は別途カウントクエリ
      }
    } catch (error) {
      console.error('Error in GraphQLPostController.getPostComments:', error)
      throw new Error('コメントの取得中にエラーが発生しました。')
    }
  }

  async getPostEmpathies(
    args: { postId: string; first?: number; after?: string },
    context: GraphQLContext
  ) {
    try {
      const limit = args.first || 10
      const offset = args.after ? parseInt(args.after) : 0

      const empathies = await this.empathyRepository.findByPost(args.postId)

      const edges = empathies.map((empathy: any, index: number) => ({
        cursor: (offset + index + 1).toString(),
        node: empathy,
      }))

      return {
        edges,
        pageInfo: {
          hasNextPage: empathies.length === limit,
          hasPreviousPage: offset > 0,
          startCursor: edges[0]?.cursor,
          endCursor: edges[edges.length - 1]?.cursor,
        },
        totalCount: empathies.length, // TODO: 正確な総数を取得する場合は別途カウントクエリ
      }
    } catch (error) {
      console.error('Error in GraphQLPostController.getPostEmpathies:', error)
      throw new Error('共感の取得中にエラーが発生しました。')
    }
  }
}
