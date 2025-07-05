import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import type { MutationResolvers, EmpathyResolvers } from '@/generated/graphql'

export const empathyResolvers = {
  Mutation: {
    async addEmpathy(_, { postId, type }, context) {
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

    async removeEmpathy(_, { postId }, context) {
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
  } satisfies Partial<MutationResolvers>,

  Empathy: {
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
  } satisfies EmpathyResolvers,
}
