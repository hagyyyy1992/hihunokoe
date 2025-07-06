import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { MOCK_POSTS } from '@/lib/mock-data'
import { GraphQLContext } from '@/graphql/context'
import { Prisma } from '@prisma/client'

export const postResolvers = {
  Query: {
    async post(_: unknown, { id }: { id: string }) {
      if (!isDatabaseAvailable() || !prisma) {
        const post = MOCK_POSTS.find((p: { id: string }) => p.id === id)
        if (!post) throw new Error('Post not found')
        return post
      }

      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          user: true,
          empathies: { include: { user: true } },
          comments: { include: { user: true } },
        },
      })
      if (!post) throw new Error('Post not found')
      return post
    },

    async posts(
      _: unknown,
      {
        first,
        after,
        filter,
        orderBy,
      }: {
        first?: number
        after?: string
        filter?: {
          skinType?: string
          cosmeticCategory?: string
          moodTag?: string
          search?: string
        }
        orderBy?: string
      }
    ) {
      if (!isDatabaseAvailable() || !prisma) {
        // Return mock data when database is unavailable
        let filteredPosts = [...MOCK_POSTS]

        if (filter) {
          if (filter.skinType) {
            filteredPosts = filteredPosts.filter(p => p.skinType === filter.skinType)
          }
          if (filter.cosmeticCategory) {
            filteredPosts = filteredPosts.filter(
              p => p.cosmeticCategory === filter.cosmeticCategory
            )
          }
          if (filter.moodTag) {
            filteredPosts = filteredPosts.filter(p => p.moodTag === filter.moodTag)
          }
          if (filter.search) {
            const search = filter.search.toLowerCase()
            filteredPosts = filteredPosts.filter(
              p =>
                p.title.toLowerCase().includes(search) ||
                p.content.toLowerCase().includes(search) ||
                p.cosmeticName.toLowerCase().includes(search)
            )
          }
        }

        // Sort
        if (orderBy === 'CREATED_AT_DESC') {
          filteredPosts.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        } else if (orderBy === 'EMPATHY_DESC') {
          filteredPosts.sort((a, b) => b.empathyCount - a.empathyCount)
        }

        // Pagination
        const startIndex = after ? filteredPosts.findIndex(p => p.id === after) + 1 : 0
        const endIndex = startIndex + (first || 10)
        const paginatedPosts = filteredPosts.slice(startIndex, endIndex)

        return {
          edges: paginatedPosts.map(post => ({
            node: post,
            cursor: post.id,
          })),
          pageInfo: {
            hasNextPage: endIndex < filteredPosts.length,
            endCursor: paginatedPosts[paginatedPosts.length - 1]?.id || null,
          },
          totalCount: filteredPosts.length,
        }
      }

      // Build where clause
      const where: Record<string, unknown> = {}

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

      const posts = await prisma.post.findMany({
        where,
        take: first || 10,
        skip: after ? 1 : 0,
        cursor: after ? { id: after } : undefined,
        orderBy: orderBy === 'EMPATHY_DESC' ? { empathyCount: 'desc' } : { createdAt: 'desc' },
        include: {
          user: true,
          empathies: true,
          _count: { select: { comments: true } },
        },
      })

      const totalCount = await prisma.post.count({ where })
      const hasNextPage = posts.length === (first || 10)

      return {
        edges: posts.map(post => ({
          node: post,
          cursor: post.id,
        })),
        pageInfo: {
          hasNextPage,
          endCursor: posts[posts.length - 1]?.id || null,
        },
        totalCount,
      }
    },
  },

  Mutation: {
    async createPost(
      _: unknown,
      {
        input,
      }: {
        input: {
          title: string
          content: string
          cosmeticName: string
          cosmeticCategory?: string
          skinType?: string
          moodTag?: string
          usageSituation?: unknown
          experienceDetails?: unknown
        }
      },
      context: GraphQLContext
    ) {
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
          usageSituation: input.usageSituation || Prisma.JsonNull,
          experienceDetails: input.experienceDetails || Prisma.JsonNull,
        },
        include: {
          user: true,
          empathies: { include: { user: true } },
          comments: { include: { user: true } },
        },
      })

      return post
    },

    async updatePost(
      _: unknown,
      {
        id,
        input,
      }: {
        id: string
        input: {
          title?: string
          content?: string
          cosmeticName?: string
          cosmeticCategory?: string
          skinType?: string
          moodTag?: string
          usageSituation?: unknown
          experienceDetails?: unknown
        }
      },
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
        data: {
          ...input,
          usageSituation:
            input.usageSituation !== undefined
              ? input.usageSituation
                ? (input.usageSituation as Prisma.InputJsonValue)
                : Prisma.JsonNull
              : existingPost.usageSituation,
          experienceDetails:
            input.experienceDetails !== undefined
              ? input.experienceDetails
                ? (input.experienceDetails as Prisma.InputJsonValue)
                : Prisma.JsonNull
              : existingPost.experienceDetails,
        },
        include: {
          user: true,
          empathies: { include: { user: true } },
          comments: { include: { user: true } },
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
    user: async (parent: { userId: string }) => {
      if (!isDatabaseAvailable() || !prisma) throw new Error('Database unavailable')
      const user = await prisma.user.findUnique({
        where: { id: parent.userId },
      })
      if (!user) throw new Error('User not found')
      return user
    },

    empathies: async (parent: { id: string }) => {
      if (!isDatabaseAvailable() || !prisma) return []
      return prisma.empathy.findMany({
        where: { postId: parent.id },
        include: { user: true },
      })
    },

    comments: async (parent: { id: string }) => {
      if (!isDatabaseAvailable() || !prisma) return []
      return prisma.comment.findMany({
        where: { postId: parent.id },
        include: { user: true },
      })
    },
  },
}
