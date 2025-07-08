import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { GraphQLContext } from '@/graphql/context'

export const userResolvers = {
  Query: {
    async user(_: unknown, { id }: { id: string }) {
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

    async currentUser(_: unknown, __: unknown, context: GraphQLContext) {
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
    displayName: (parent: { userName?: string; displayName?: string }) => {
      // Map userName to displayName for backward compatibility
      return parent.displayName || parent.userName || 'Unknown User'
    },

    posts: async (parent: { id: string }) => {
      if (!isDatabaseAvailable() || !prisma) return []
      return prisma.post.findMany({
        where: { userId: parent.id },
        orderBy: { createdAt: 'desc' },
      })
    },

    empathies: async (parent: { id: string }) => {
      if (!isDatabaseAvailable() || !prisma) return []
      return prisma.empathy.findMany({
        where: { userId: parent.id },
        include: { post: true },
      })
    },

    comments: async (parent: { id: string }) => {
      if (!isDatabaseAvailable() || !prisma) return []
      return prisma.comment.findMany({
        where: { userId: parent.id },
        include: { post: true },
      })
    },
  },
}
