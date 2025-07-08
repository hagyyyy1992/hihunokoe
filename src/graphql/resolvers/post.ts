import { GraphQLContext } from '@/graphql/context'
import { GraphQLPostController } from '@api/framework/controllers/GraphQLPostController'

const postController = new GraphQLPostController()

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
          productName?: string
          brandName?: string
          imageUrl?: string
          category?: string
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
          productName?: string
          brandName?: string
          imageUrl?: string
          category?: string
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
      // TODO: Implement user loading for posts
      // For now, return basic structure to avoid GraphQL errors
      return { id: parent.userId, displayName: 'Unknown User' }
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
  },
}
