import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import type { MutationResolvers, CommentResolvers } from '@/generated/graphql'

export const commentResolvers = {
  Mutation: {
    async addComment(_, { postId, content }, context) {
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

    async updateComment(_, { id, content }, context) {
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

    async deleteComment(_, { id }, context) {
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
  } satisfies Partial<MutationResolvers>,

  Comment: {
    post: async parent => {
      if (!isDatabaseAvailable() || !prisma) throw new Error('Database unavailable')
      const post = await prisma.post.findUnique({
        where: { id: parent.postId },
      })
      if (!post) throw new Error('Post not found')
      return post
    },
    user: async parent => {
      if (!isDatabaseAvailable() || !prisma) throw new Error('Database unavailable')
      const user = await prisma.user.findUnique({
        where: { id: parent.userId },
      })
      if (!user) throw new Error('User not found')
      return user
    },
  } satisfies CommentResolvers,
}
