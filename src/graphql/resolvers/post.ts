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
}
