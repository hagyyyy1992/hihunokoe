import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { GraphQLContext, PostInput, PostArgs, ResolverParent } from '@/graphql/types'

export const postResolvers = {
  Query: {
    async post(_: unknown, { id }: { id: string }) {
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

    async posts(_: unknown, { first, after, filter, orderBy }: PostArgs) {
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
  },

  Mutation: {
    async createPost(_: unknown, { input }: { input: PostInput }, context: GraphQLContext) {
      if (!context.userId) {
        throw new Error('Unauthorized')
      }

      if (!isDatabaseAvailable() || !prisma) {
        throw new Error('Database unavailable')
      }

      const post = await prisma.post.create({
        data: {
          ...input,
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

    async updatePost(
      _: unknown,
      { id, input }: { id: string; input: PostInput },
      context: GraphQLContext
    ) {
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

      const post = await prisma.post.update({
        where: { id },
        data: input,
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

    async deletePost(_: unknown, { id }: { id: string }, context: GraphQLContext) {
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
  },

  Post: {
    user: (parent: ResolverParent) => parent.user,
    comments: (parent: ResolverParent) => parent.comments || [],
    empathies: (parent: ResolverParent) => parent.empathies || [],
  },
}
