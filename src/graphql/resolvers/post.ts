import { GraphQLContext } from '@/graphql/context'
import { ControllerFactory } from '@api/framework/factories/ControllerFactory'
import { GraphQLPostController } from '@api/framework/graphql/GraphQLPostController'

let postController: GraphQLPostController | null = null

try {
  postController = ControllerFactory.createGraphQLPostController()
} catch (error) {
  console.error('Failed to initialize GraphQL post resolvers:', error)
}

export const postResolvers = {
  Query: {
    async post(_: unknown, { id }: { id: string }, context: GraphQLContext) {
      if (!postController) {
        throw new Error(
          'データベース接続エラーが発生しました。しばらく時間を置いてから再度お試しください。'
        )
      }
      return postController.getPost({ id }, context)
    },

    async posts(
      _: unknown,
      {
        first,
        after,
        filter,
        orderBy,
      }: {
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
      if (!postController) {
        throw new Error(
          'データベース接続エラーが発生しました。しばらく時間を置いてから再度お試しください。'
        )
      }
      return postController.getPosts({ first, after, filter, orderBy }, context)
    },

    async postComments(
      _: unknown,
      { postId, first, after }: { postId: string; first?: number; after?: string },
      context: GraphQLContext
    ) {
      if (!postController) {
        throw new Error(
          'データベース接続エラーが発生しました。しばらく時間を置いてから再度お試しください。'
        )
      }
      return postController.getPostComments({ postId, first, after }, context)
    },

    async postEmpathies(
      _: unknown,
      { postId, first, after }: { postId: string; first?: number; after?: string },
      context: GraphQLContext
    ) {
      if (!postController) {
        throw new Error(
          'データベース接続エラーが発生しました。しばらく時間を置いてから再度お試しください。'
        )
      }
      return postController.getPostEmpathies({ postId, first, after }, context)
    },
  },

  Mutation: {
    async createPost(
      _: unknown,
      {
        input,
      }: {
        input: {
          title: string
          content: string
          cosmeticName: string
          cosmeticCategory?: string
          skinType?: string
          usageSituation?: {
            season?: string
            timeOfDay?: string
            menstrualCycle?: string
            skinCondition?: string
            weatherCondition?: string
          }
          experienceDetails?: {
            fragrance?: {
              type?: string
              intensity?: string
              description?: string
            }
            texture?: {
              type?: string
              spreadability?: string
              absorption?: string
              description?: string
            }
            afterUse?: {
              moisture?: string
              texture?: string
              comfort?: string
              duration?: string
              description?: string
            }
          }
          moodTag?: string
        }
      },
      context: GraphQLContext
    ) {
      if (!postController) {
        throw new Error(
          'データベース接続エラーが発生しました。しばらく時間を置いてから再度お試しください。'
        )
      }
      return postController.createPost({ input }, context)
    },

    async updatePost(
      _: unknown,
      {
        id,
        input,
      }: {
        id: string
        input: {
          title?: string
          content?: string
          cosmeticName?: string
          cosmeticCategory?: string
          skinType?: string
          usageSituation?: {
            season?: string
            timeOfDay?: string
            menstrualCycle?: string
            skinCondition?: string
            weatherCondition?: string
          }
          experienceDetails?: {
            fragrance?: {
              type?: string
              intensity?: string
              description?: string
            }
            texture?: {
              type?: string
              spreadability?: string
              absorption?: string
              description?: string
            }
            afterUse?: {
              moisture?: string
              texture?: string
              comfort?: string
              duration?: string
              description?: string
            }
          }
          moodTag?: string
        }
      },
      context: GraphQLContext
    ) {
      if (!postController) {
        throw new Error(
          'データベース接続エラーが発生しました。しばらく時間を置いてから再度お試しください。'
        )
      }
      return postController.updatePost({ id, input }, context)
    },

    async deletePost(_: unknown, { id }: { id: string }, context: GraphQLContext) {
      if (!postController) {
        throw new Error(
          'データベース接続エラーが発生しました。しばらく時間を置いてから再度お試しください。'
        )
      }
      return postController.deletePost({ id }, context)
    },
  },

  Post: {
    // Field resolvers for Post type
    user: async (parent: { userId: string }, _: unknown, context: GraphQLContext) => {
      try {
        const user = await context.userLoader.load(parent.userId)
        if (!user) {
          return { id: parent.userId, displayName: 'Unknown User', userName: 'Unknown User' }
        }
        return {
          id: user.id,
          displayName: user.userName, // Use userName as displayName for now
          userName: user.userName,
          profileImageUrl: null,
          bio: null,
        }
      } catch (error) {
        console.error('Error loading user for post:', error)
        return { id: parent.userId, displayName: 'Unknown User', userName: 'Unknown User' }
      }
    },

    empathies: async (parent: { id: string }, _: unknown, context: GraphQLContext) => {
      try {
        const empathies = await context.empathyLoader.load(parent.id)
        return empathies
      } catch (error) {
        console.error('Error loading empathies for post:', error)
        return []
      }
    },

    comments: async (parent: { id: string }, _: unknown, context: GraphQLContext) => {
      try {
        const comments = await context.commentLoader.load(parent.id)
        return comments
      } catch (error) {
        console.error('Error loading comments for post:', error)
        return []
      }
    },
  },
}
