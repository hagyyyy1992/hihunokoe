import { NextRequest } from 'next/server'
import { GetPostUseCase } from '@api/usecases/posts/GetPostUseCase'
import { GetPostsUseCase } from '@api/usecases/posts/GetPostsUseCase'
import { CreatePostUseCase } from '@api/usecases/posts/CreatePostUseCase'
import { UpdatePostUseCase } from '@api/usecases/posts/UpdatePostUseCase'
import { DeletePostUseCase } from '@api/usecases/posts/DeletePostUseCase'
import { PostRepositoryImpl } from '@api/interface-adapters/repositories/PostRepositoryImpl'
import { UserRepositoryImpl } from '@api/interface-adapters/repositories/UserRepositoryImpl'
import { EmpathyRepositoryImpl } from '@api/interface-adapters/repositories/EmpathyRepositoryImpl'
import { CommentRepositoryImpl } from '@api/interface-adapters/repositories/CommentRepositoryImpl'
import { GraphQLContext } from '@/graphql/context'

export class GraphQLPostController {
  private postRepository: PostRepositoryImpl
  private userRepository: UserRepositoryImpl
  private empathyRepository: EmpathyRepositoryImpl
  private commentRepository: CommentRepositoryImpl

  constructor() {
    this.postRepository = new PostRepositoryImpl()
    this.userRepository = new UserRepositoryImpl()
    this.empathyRepository = new EmpathyRepositoryImpl()
    this.commentRepository = new CommentRepositoryImpl()
  }

  async getPost(args: { id: string }, context: GraphQLContext) {
    const getPostUseCase = new GetPostUseCase(this.postRepository)

    try {
      const { post } = await getPostUseCase.execute({
        postId: args.id,
        requestUserId: context.userId || undefined,
      })

      return post
    } catch (error) {
      throw new Error((error as Error).message)
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
    const getPostsUseCase = new GetPostsUseCase(this.postRepository)

    // Convert GraphQL args to use case input
    const limit = args.first || 10
    const skip = args.after ? parseInt(args.after) : 0

    const filters: any = {}
    if (args.filter) {
      if (args.filter.skinType) filters.skinType = args.filter.skinType
      if (args.filter.cosmeticCategory) filters.category = args.filter.cosmeticCategory
      if (args.filter.search) filters.search = args.filter.search
    }

    const orderBy = args.orderBy || 'createdAt'

    try {
      const { posts, totalCount } = await getPostsUseCase.execute({
        limit,
        skip,
        filters,
        orderBy,
      })

      // Convert to GraphQL Connection format
      const edges = posts.map((post, index) => ({
        cursor: (skip + index + 1).toString(),
        node: post,
      }))

      const hasNextPage = posts.length === limit
      const hasPreviousPage = skip > 0

      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage,
          startCursor: edges[0]?.cursor,
          endCursor: edges[edges.length - 1]?.cursor,
        },
        totalCount,
      }
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async createPost(
    args: {
      input: {
        title: string
        content: string
        productName?: string
        brandName?: string
        imageUrl?: string
        category?: string
      }
    },
    context: GraphQLContext
  ) {
    if (!context.userId) {
      throw new Error('Authentication required')
    }

    const createPostUseCase = new CreatePostUseCase(this.postRepository)

    try {
      const { post } = await createPostUseCase.execute({
        userId: context.userId,
        title: args.input.title,
        content: args.input.content,
        productName: args.input.productName,
        brandName: args.input.brandName,
        imageUrl: args.input.imageUrl,
        category: args.input.category,
      })

      return post
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async updatePost(
    args: {
      id: string
      input: {
        title?: string
        content?: string
        productName?: string
        brandName?: string
        imageUrl?: string
        category?: string
      }
    },
    context: GraphQLContext
  ) {
    if (!context.userId) {
      throw new Error('Authentication required')
    }

    const updatePostUseCase = new UpdatePostUseCase(this.postRepository)

    try {
      const { post } = await updatePostUseCase.execute({
        postId: args.id,
        userId: context.userId,
        title: args.input.title,
        content: args.input.content,
        productName: args.input.productName,
        brandName: args.input.brandName,
        imageUrl: args.input.imageUrl,
        category: args.input.category,
      })

      return post
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async deletePost(args: { id: string }, context: GraphQLContext) {
    if (!context.userId) {
      throw new Error('Authentication required')
    }

    const deletePostUseCase = new DeletePostUseCase(this.postRepository)

    try {
      await deletePostUseCase.execute({
        postId: args.id,
        userId: context.userId,
      })

      return { success: true }
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }
}
