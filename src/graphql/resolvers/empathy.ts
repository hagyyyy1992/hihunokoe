import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { GraphQLContext } from '@/graphql/context'

export const empathyResolvers = {
  Mutation: {
    async addEmpathy(
      _: unknown,
      { postId, type }: { postId: string; type: string },
      context: GraphQLContext
    ) {
      if (!context.userId) {
        throw new Error('Unauthorized')
      }

      if (!isDatabaseAvailable() || !prisma) {
        throw new Error('Database unavailable')
      }

      // Check if empathy already exists
      const existingEmpathy = await prisma.empathy.findFirst({
        where: {
          postId,
          userId: context.userId,
        },
      })

      if (existingEmpathy) {
        throw new Error('Already empathized')
      }

      const empathy = await prisma.empathy.create({
        data: {
          postId,
          userId: context.userId,
          empathyType: type,
        },
        include: {
          post: true,
          user: true,
        },
      })

      // Update empathy count
      await prisma.post.update({
        where: { id: postId },
        data: { empathyCount: { increment: 1 } },
      })

      return empathy
    },

    async removeEmpathy(_: unknown, { postId }: { postId: string }, context: GraphQLContext) {
      if (!context.userId) {
        throw new Error('Unauthorized')
      }

      if (!isDatabaseAvailable() || !prisma) {
        throw new Error('Database unavailable')
      }

      const empathy = await prisma.empathy.findFirst({
        where: {
          postId,
          userId: context.userId,
        },
      })

      if (!empathy) {
        throw new Error('Empathy not found')
      }

      await prisma.empathy.delete({
        where: { id: empathy.id },
      })

      // Update empathy count
      await prisma.post.update({
        where: { id: postId },
        data: { empathyCount: { decrement: 1 } },
      })

      return true
    },
  },

  Empathy: {
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
