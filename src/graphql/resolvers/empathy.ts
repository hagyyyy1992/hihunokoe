import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { GraphQLContext, ResolverParent } from '@/graphql/types'

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

      const existingEmpathy = await prisma.empathy.findFirst({
        where: {
          postId,
          userId: context.userId,
        },
      })

      if (existingEmpathy) {
        throw new Error('Already added empathy')
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

      await prisma.post.update({
        where: { id: postId },
        data: { empathyCount: { decrement: 1 } },
      })

      return true
    },
  },

  Empathy: {
    post: (parent: ResolverParent) => parent.post,
    user: (parent: ResolverParent) => parent.user,
  },
}
