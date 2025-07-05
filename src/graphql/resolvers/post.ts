import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import type { QueryResolvers, MutationResolvers, PostResolvers } from '@/generated/graphql'

export const postResolvers = {
  Query: {
    async post(_, { id }) {
      if (!isDatabaseAvailable() || !prisma) {
        return null
      }
      return await prisma.post.findUnique({
        where: { id },
        include: {
          user: true,
          comments: {
            include: { user: true },
            orderBy: { createdAt: 'desc' },
          },
          empathies: {
            include: { user: true },
          },
        },
      })
    },

    async posts(_, { first, after, filter, orderBy }) {
      const where: Prisma.PostWhereInput = {
        status: 'published',
      }

      if (filter) {
        if (filter.skinType) where.skinType = filter.skinType
        if (filter.cosmeticCategory) where.cosmeticCategory = filter.cosmeticCategory
        if (filter.moodTag) where.moodTag = filter.moodTag
        if (filter.search) {
          where.OR = [
            { title: { contains: filter.search, mode: 'insensitive' } },
            { content: { contains: filter.search, mode: 'insensitive' } },
            { cosmeticName: { contains: filter.search, mode: 'insensitive' } },
          ]
        }
      }

      const orderByClause = (() => {
        switch (orderBy) {
          case 'CREATED_AT_ASC':
            return { createdAt: 'asc' as const }
          case 'EMPATHY_COUNT_DESC':
            return { empathyCount: 'desc' as const }
          case 'VIEW_COUNT_DESC':
            return { viewCount: 'desc' as const }
          default:
            return { createdAt: 'desc' as const }
        }
      })()

      if (!isDatabaseAvailable() || !prisma) {
        return {
          edges: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          totalCount: 0,
        }
      }

      const totalCount = await prisma.post.count({ where })

      let skip = 0
      const take = first || 10

      if (after) {
        const cursor = await prisma.post.findUnique({ where: { id: after } })
        if (cursor) {
          skip = 1
        }
      }

      const posts = await prisma.post.findMany({
        where,
        orderBy: orderByClause,
        skip,
        take: take + 1,
        cursor: after ? { id: after } : undefined,
        include: {
          user: true,
          comments: {
            include: { user: true },
            orderBy: { createdAt: 'desc' },
          },
          empathies: {
            include: { user: true },
          },
        },
      })

      const hasNextPage = posts.length > take
      if (hasNextPage) posts.pop()

      const edges = posts.map(post => ({
        node: post,
        cursor: post.id,
      }))

      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage: skip > 0,
          startCursor: edges[0]?.cursor || null,
          endCursor: edges[edges.length - 1]?.cursor || null,
        },
        totalCount,
      }
    },
  } satisfies QueryResolvers,

  Mutation: {
    async createPost(_, { input }, context) {
      if (!context.userId) {
        throw new Error('Unauthorized')
      }

      if (!isDatabaseAvailable() || !prisma) {
        throw new Error('Database unavailable')
      }

      const post = await prisma.post.create({
        data: {
          title: input.title,
          content: input.content,
          cosmeticName: input.cosmeticName,
          cosmeticCategory: input.cosmeticCategory || null,
          skinType: input.skinType || null,
          moodTag: input.moodTag || null,
          usageSituation: input.usageSituation || undefined,
          experienceDetails: input.experienceDetails || undefined,
          userId: context.userId,
          publishedAt: new Date(),
        },
        include: {
          user: true,
          comments: {
            include: { user: true },
          },
          empathies: {
            include: { user: true },
          },
        },
      })

      return post
    },

    async updatePost(_, { id, input }, context) {
      if (!context.userId) {
        throw new Error('Unauthorized')
      }

      if (!isDatabaseAvailable() || !prisma) {
        throw new Error('Database unavailable')
      }

      const existingPost = await prisma.post.findUnique({
        where: { id },
      })

      if (!existingPost) {
        throw new Error('Post not found')
      }

      if (existingPost.userId !== context.userId) {
        throw new Error('Forbidden')
      }

      const updateData: Prisma.PostUpdateInput = {}
      if (input.title !== undefined && input.title !== null) updateData.title = input.title
      if (input.content !== undefined && input.content !== null) updateData.content = input.content
      if (input.cosmeticName !== undefined && input.cosmeticName !== null)
        updateData.cosmeticName = input.cosmeticName
      if (input.cosmeticCategory !== undefined) updateData.cosmeticCategory = input.cosmeticCategory
      if (input.skinType !== undefined) updateData.skinType = input.skinType
      if (input.moodTag !== undefined) updateData.moodTag = input.moodTag
      if (input.usageSituation !== undefined && input.usageSituation !== null)
        updateData.usageSituation = input.usageSituation
      if (input.experienceDetails !== undefined && input.experienceDetails !== null)
        updateData.experienceDetails = input.experienceDetails
      if (input.status !== undefined && input.status !== null) updateData.status = input.status

      const post = await prisma.post.update({
        where: { id },
        data: updateData,
        include: {
          user: true,
          comments: {
            include: { user: true },
          },
          empathies: {
            include: { user: true },
          },
        },
      })

      return post
    },

    async deletePost(_, { id }, context) {
      if (!context.userId) {
        throw new Error('Unauthorized')
      }

      if (!isDatabaseAvailable() || !prisma) {
        throw new Error('Database unavailable')
      }

      const existingPost = await prisma.post.findUnique({
        where: { id },
      })

      if (!existingPost) {
        throw new Error('Post not found')
      }

      if (existingPost.userId !== context.userId) {
        throw new Error('Forbidden')
      }

      await prisma.post.delete({
        where: { id },
      })

      return true
    },
  } satisfies MutationResolvers,

  Post: {
    user: async parent => {
      if (!isDatabaseAvailable() || !prisma) throw new Error('Database unavailable')
      const user = await prisma.user.findUnique({
        where: { id: parent.userId },
      })
      if (!user) throw new Error('User not found')
      return user
    },
    comments: async parent => {
      if (!isDatabaseAvailable() || !prisma) return []
      return await prisma.comment.findMany({
        where: { postId: parent.id },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      })
    },
    empathies: async parent => {
      if (!isDatabaseAvailable() || !prisma) return []
      return await prisma.empathy.findMany({
        where: { postId: parent.id },
        include: { user: true },
      })
    },
  } satisfies PostResolvers,
}
