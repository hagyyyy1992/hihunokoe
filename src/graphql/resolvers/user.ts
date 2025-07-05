import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import type { QueryResolvers, UserResolvers } from '@/generated/graphql'

export const userResolvers = {
  Query: {
    async user(_, { id }) {
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

    async currentUser(_, __, context) {
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
  } satisfies Partial<QueryResolvers>,

  User: {
    posts: async parent => {
      if (!isDatabaseAvailable() || !prisma) return []
      return await prisma.post.findMany({
        where: { userId: parent.id },
        orderBy: { createdAt: 'desc' },
      })
    },
    empathies: async parent => {
      if (!isDatabaseAvailable() || !prisma) return []
      return await prisma.empathy.findMany({
        where: { userId: parent.id },
        include: { post: true },
        orderBy: { createdAt: 'desc' },
      })
    },
    comments: async parent => {
      if (!isDatabaseAvailable() || !prisma) return []
      return await prisma.comment.findMany({
        where: { userId: parent.id },
        include: { post: true },
        orderBy: { createdAt: 'desc' },
      })
    },
  } satisfies UserResolvers,
}
