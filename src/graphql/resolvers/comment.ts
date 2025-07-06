import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { GraphQLContext } from '@/graphql/context'

export const commentResolvers = {
  Mutation: {
    async addComment(
      _: unknown,
      { postId, content }: { postId: string; content: string },
      context: GraphQLContext
    ) {
      if (!context.userId) {
        throw new Error('Unauthorized')
      }

      if (!isDatabaseAvailable() || !prisma) {
        throw new Error('Database unavailable')
      }

      const comment = await prisma.comment.create({
        data: {
          postId,
          userId: context.userId,
          content,
        },
        include: {
          post: true,
          user: true,
        },
      })

      return comment
    },

    async updateComment(
      _: unknown,
      { id, content }: { id: string; content: string },
      context: GraphQLContext
    ) {
      if (!context.userId) {
        throw new Error('Unauthorized')
      }

      if (!isDatabaseAvailable() || !prisma) {
        throw new Error('Database unavailable')
      }

      const existingComment = await prisma.comment.findUnique({
        where: { id },
      })

      if (!existingComment) {
        throw new Error('Comment not found')
      }

      if (existingComment.userId !== context.userId) {
        throw new Error('Forbidden')
      }

      const comment = await prisma.comment.update({
        where: { id },
        data: { content },
        include: {
          post: true,
          user: true,
        },
      })

      return comment
    },

    async deleteComment(_: unknown, { id }: { id: string }, context: GraphQLContext) {
      if (!context.userId) {
        throw new Error('Unauthorized')
      }

      if (!isDatabaseAvailable() || !prisma) {
        throw new Error('Database unavailable')
      }

      const existingComment = await prisma.comment.findUnique({
        where: { id },
      })

      if (!existingComment) {
        throw new Error('Comment not found')
      }

      if (existingComment.userId !== context.userId) {
        throw new Error('Forbidden')
      }

      await prisma.comment.delete({
        where: { id },
      })

      return true
    },
  },

  Comment: {
    post: async (parent: { postId: string }) => {
      if (!isDatabaseAvailable() || !prisma) throw new Error('Database unavailable')
      const post = await prisma.post.findUnique({
        where: { id: parent.postId },
      })
      if (!post) throw new Error('Post not found')
      return post
    },
    user: async (parent: { userId: string }) => {
      if (!isDatabaseAvailable() || !prisma) throw new Error('Database unavailable')
      const user = await prisma.user.findUnique({
        where: { id: parent.userId },
      })
      if (!user) throw new Error('User not found')
      return user
    },
  },
}
