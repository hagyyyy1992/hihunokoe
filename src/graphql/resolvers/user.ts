import { GraphQLContext } from '@/graphql/context'
import { GraphQLUserController } from '@api/framework/controllers/GraphQLUserController'

const userController = new GraphQLUserController()

export const userResolvers = {
  Query: {
    async user(_: unknown, { id }: { id: string }, context: GraphQLContext) {
      return userController.getUser({ id }, context)
    },

    async currentUser(_: unknown, __: unknown, context: GraphQLContext) {
      return userController.getCurrentUser(context)
    },
  },

  User: {
    displayName: (parent: { userName?: string; displayName?: string }) => {
      // Map userName to displayName for backward compatibility
      return parent.displayName || parent.userName || 'Unknown User'
    },

    posts: async (parent: { id: string }) => {
      // Note: These field resolvers would typically also be moved to use cases
      // but for simplicity in this migration, we'll leave them as-is for now
      // TODO: Consider moving these to use cases if needed
      void parent
      return []
    },

    empathies: async (parent: { id: string }) => {
      void parent
      return []
    },

    comments: async (parent: { id: string }) => {
      void parent
      return []
    },
  },
}
