import { GraphQLContext } from '@/graphql/context'
import { GraphQLPostController } from '@api/framework/graphql/GraphQLPostController'
import { UserRepository } from '@api/interface-adapters/repositories/User.repository'
import { CommentRepository } from '@api/interface-adapters/repositories/Comment.repository'

const postController = new GraphQLPostController()
const userRepository = new UserRepository()
const commentRepository = new CommentRepository()

export const postResolvers = {
  Query: {
    async post(_: unknown, { id }: { id: string }, context: GraphQLContext) {
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
      return postController.getPosts({ first, after, filter, orderBy }, context)
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
      return postController.updatePost({ id, input }, context)
    },

    async deletePost(_: unknown, { id }: { id: string }, context: GraphQLContext) {
      return postController.deletePost({ id }, context)
    },
  },

  Post: {
    // Field resolvers for Post type
    user: async (parent: { userId: string }) => {
      try {
        const user = await userRepository.findById(parent.userId)
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

    empathies: async (parent: { id: string }) => {
      // TODO: Implement empathy loading for posts
      void parent
      return []
    },

    comments: async (parent: { id: string }) => {
      // TODO: Implement comment loading for posts
      void parent
      return []
    },

    commentCount: async (parent: { id: string }) => {
      try {
        const comments = await commentRepository.findByPostId(parent.id)
        return comments.length
      } catch (error) {
        console.error('Error loading comment count for post:', error)
        return 0
      }
    },
  },
}
