import { GraphQLContext } from '@/graphql/context'
import { GraphQLCommentController } from '@api/framework/graphql/GraphQLCommentController'

const commentController = new GraphQLCommentController()

export const commentResolvers = {
  Mutation: {
    async addComment(
      _: unknown,
      { input }: { input: { postId: string; content: string; parentId?: string } },
      context: GraphQLContext
    ) {
      return commentController.createComment({ input }, context)
    },

    async updateComment(
      _: unknown,
      { id, content }: { id: string; content: string },
      context: GraphQLContext
    ) {
      // TODO: Implement UpdateCommentUseCase
      void _
      void id
      void content
      void context
      throw new Error('updateComment not yet implemented in clean architecture')
    },

    async deleteComment(_: unknown, { id }: { id: string }, context: GraphQLContext) {
      // TODO: Implement DeleteCommentUseCase
      void _
      void id
      void context
      throw new Error('deleteComment not yet implemented in clean architecture')
    },
  },

  Comment: {
    post: async (parent: { postId: string }) => {
      // Note: These field resolvers would typically also be moved to use cases
      // but for simplicity in this migration, we'll leave them as-is for now
      // TODO: Consider moving these to use cases if needed
      void parent
      return null
    },
    user: async (parent: { userId: string }) => {
      void parent
      return null
    },
  },
}
