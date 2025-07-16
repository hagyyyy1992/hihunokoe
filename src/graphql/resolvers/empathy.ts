import { GraphQLContext } from '@/graphql/context'
import { GraphQLEmpathyController } from '@api/framework/graphql/GraphQLEmpathyController'

const empathyController = new GraphQLEmpathyController()

export const empathyResolvers = {
  Mutation: {
    async addEmpathy(
      _: unknown,
      { input }: { input: { postId: string; empathyType: string } },
      context: GraphQLContext
    ) {
      return empathyController.addEmpathy({ input }, context)
    },

    async removeEmpathy(
      _: unknown,
      { input }: { input: { postId: string; empathyType: string } },
      context: GraphQLContext
    ) {
      return empathyController.removeEmpathy({ input }, context)
    },
  },

  Empathy: {
    post: async (parent: { postId: string }) => {
      // Note: These field resolvers would typically also be moved to use cases
      // but for simplicity in this migration, we'll leave them as-is for now
      // TODO: Consider moving these to use cases if needed
      void parent
      return null
    },
    user: async (parent: { userId: string }, _: unknown, context: GraphQLContext) => {
      try {
        const user = await context.userLoader.load(parent.userId)
        if (!user) {
          return { id: parent.userId, displayName: 'Unknown User', userName: 'Unknown User' }
        }
        return {
          id: user.id,
          displayName: user.userName,
          userName: user.userName,
          email: user.email,
          profileImageUrl: null,
          bio: null,
        }
      } catch (error) {
        console.error('Error loading user for empathy:', error)
        return { id: parent.userId, displayName: 'Unknown User', userName: 'Unknown User' }
      }
    },
  },
}
