import { NextRequest } from 'next/server'
import { PostRetrievalUseCase, PostManagementUseCase } from '@api/usecases/posts/interactor'
import type {
  GetPostInputPort,
  GetPostsInputPort,
  CreatePostInputPort,
  UpdatePostInputPort,
  DeletePostInputPort,
} from '@api/usecases/posts/input-port'
import { PostRepository } from '@api/interface-adapters/repositories/Post.repository'
import { UserRepository } from '@api/interface-adapters/repositories/User.repository'
import { EmpathyRepository } from '@api/interface-adapters/repositories/Empathy.repository'
import { CommentRepository } from '@api/interface-adapters/repositories/Comment.repository'
import { GraphQLContext } from '@/graphql/context'

export class GraphQLPostController {
  private postRetrievalUseCase: PostRetrievalUseCase
  private postManagementUseCase: PostManagementUseCase

  constructor() {
    const postRepository = new PostRepository()
    const userRepository = new UserRepository()
    const empathyRepository = new EmpathyRepository()
    const commentRepository = new CommentRepository()

    this.postRetrievalUseCase = new PostRetrievalUseCase(
      postRepository,
      empathyRepository,
      commentRepository
    )
    this.postManagementUseCase = new PostManagementUseCase(postRepository, userRepository)
  }

  async getPost(args: { id: string }, context: GraphQLContext) {
    const input: GetPostInputPort = {
      postId: args.id,
      userId: context.userId || undefined,
    }

    try {
      const { post } = await this.postRetrievalUseCase.getPost(input)
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
    // Convert GraphQL args to use case input
    const limit = args.first || 10
    const skip = args.after ? parseInt(args.after) : 0

    const input: GetPostsInputPort = {
      page: Math.floor(skip / limit) + 1,
      limit,
      category: args.filter?.cosmeticCategory,
      skinType: args.filter?.skinType,
      moodTag: args.filter?.moodTag,
      search: args.filter?.search,
      sortBy: (args.orderBy === 'popular' ? 'empathyCount' : 'createdAt') as
        | 'createdAt'
        | 'empathyCount',
      userId: context.userId || undefined,
    }

    try {
      const { posts, total } = await this.postRetrievalUseCase.getPosts(input)

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
        totalCount: total,
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
        cosmeticName: string
        cosmeticCategory?: string
        skinType?: string
        usageSituation?: any
        experienceDetails?: any
        moodTag?: string
      }
    },
    context: GraphQLContext
  ) {
    if (!context.userId) {
      throw new Error('Authentication required')
    }

    const input: CreatePostInputPort = {
      userId: context.userId,
      title: args.input.title,
      content: args.input.content,
      productName: args.input.cosmeticName,
      brandName: undefined,
      imageUrl: undefined,
      category: args.input.cosmeticCategory,
      skinType: args.input.skinType,
      moodTag: args.input.moodTag,
      usageSituation: args.input.usageSituation,
      experienceDetails: args.input.experienceDetails,
    }

    try {
      const { post } = await this.postManagementUseCase.createPost(input)
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
        cosmeticName?: string
        cosmeticCategory?: string
        skinType?: string
        usageSituation?: any
        experienceDetails?: any
        moodTag?: string
      }
    },
    context: GraphQLContext
  ) {
    if (!context.userId) {
      throw new Error('Authentication required')
    }

    const input: UpdatePostInputPort = {
      postId: args.id,
      userId: context.userId,
      title: args.input.title,
      content: args.input.content,
      productName: args.input.cosmeticName,
      brandName: undefined,
      imageUrl: undefined,
      category: args.input.cosmeticCategory,
      skinType: args.input.skinType,
      moodTag: args.input.moodTag,
      usageSituation: args.input.usageSituation,
      experienceDetails: args.input.experienceDetails,
    }

    try {
      const { post } = await this.postManagementUseCase.updatePost(input)
      return post
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async deletePost(args: { id: string }, context: GraphQLContext) {
    if (!context.userId) {
      throw new Error('Authentication required')
    }

    const input: DeletePostInputPort = {
      postId: args.id,
      userId: context.userId,
    }

    try {
      await this.postManagementUseCase.deletePost(input)
      return { success: true }
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }
}
