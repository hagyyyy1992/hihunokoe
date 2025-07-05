import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { GraphQLContext, ResolverParent } from '@/graphql/types'

export const userResolvers = {
  Query: {
    async user(_: unknown, { id }: { id: string }) {
      if (!isDatabaseAvailable() || !prisma) {
        return null
      }
      return await prisma.user.findUnique({
        where: { id },
        include: {
          posts: {
            where: { status: 'published' },
            orderBy: { createdAt: 'desc' },
          },
          empathies: {
            include: { post: true },
            orderBy: { createdAt: 'desc' },
          },
          comments: {
            include: { post: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      })
    },

    async currentUser(_: unknown, __: unknown, context: GraphQLContext) {
      if (!context.userId) {
        return null
      }

      if (!isDatabaseAvailable() || !prisma) {
        return null
      }

      return await prisma.user.findUnique({
        where: { id: context.userId },
        include: {
          posts: {
            orderBy: { createdAt: 'desc' },
          },
          empathies: {
            include: { post: true },
            orderBy: { createdAt: 'desc' },
          },
          comments: {
            include: { post: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      })
    },
  },

  User: {
    posts: (parent: ResolverParent) => parent.posts || [],
    empathies: (parent: ResolverParent) => parent.empathies || [],
    comments: (parent: ResolverParent) => parent.comments || [],
  },
}
