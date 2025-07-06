import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { GraphQLContext } from '@/graphql/context'

export const userResolvers = {
  Query: {
    async user(_: any, { id }: { id: string }) {
      if (!isDatabaseAvailable() || !prisma) {
        throw new Error('Database unavailable')
      }

      const user = await prisma.user.findUnique({
        where: { id },
      })

      if (!user) {
        throw new Error('User not found')
      }

      return user
    },

    async currentUser(_: any, __: any, context: GraphQLContext) {
      if (!context.userId) {
        throw new Error('Unauthorized')
      }

      if (!isDatabaseAvailable() || !prisma) {
        throw new Error('Database unavailable')
      }

      const user = await prisma.user.findUnique({
        where: { id: context.userId },
      })

      if (!user) {
        throw new Error('User not found')
      }

      return user
    },
  },

  User: {
    posts: async (parent: any) => {
      if (!isDatabaseAvailable() || !prisma) return []
      return prisma.post.findMany({
        where: { userId: parent.id },
        orderBy: { createdAt: 'desc' },
      })
    },

    empathies: async (parent: any) => {
      if (!isDatabaseAvailable() || !prisma) return []
      return prisma.empathy.findMany({
        where: { userId: parent.id },
        include: { post: true },
      })
    },

    comments: async (parent: any) => {
      if (!isDatabaseAvailable() || !prisma) return []
      return prisma.comment.findMany({
        where: { userId: parent.id },
        include: { post: true },
      })
    },
  },
}