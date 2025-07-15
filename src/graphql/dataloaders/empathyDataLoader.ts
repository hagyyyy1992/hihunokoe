import DataLoader from 'dataloader'
import { Prisma } from '@prisma/client'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'

type EmpathyWithRelations = Prisma.EmpathyGetPayload<{
  include: {
    user: true
  }
}>

/**
 * DataLoader for batching and caching empathy queries
 * This helps prevent N+1 query problems when loading empathies for multiple posts
 */
export const createEmpathyDataLoader = () => {
  return new DataLoader<string, EmpathyWithRelations[]>(
    async (postIds: readonly string[]) => {
      // Check if database is available
      if (!isDatabaseAvailable() || !prisma) {
        return postIds.map(() => [])
      }

      // Batch fetch all empathies for the given post IDs
      const empathies = await prisma.empathy.findMany({
        where: {
          postId: {
            in: [...postIds],
          },
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      // Group empathies by postId
      const empathiesByPostId = empathies.reduce(
        (acc, empathy) => {
          if (!acc[empathy.postId]) {
            acc[empathy.postId] = []
          }
          acc[empathy.postId].push(empathy)
          return acc
        },
        {} as Record<string, EmpathyWithRelations[]>
      )

      // Return empathies in the same order as the input postIds
      return postIds.map(postId => empathiesByPostId[postId] || [])
    },
    {
      // Cache results for the duration of the request
      cache: true,
    }
  )
}

/**
 * DataLoader for checking if a specific user has empathized with posts
 */
export const createUserEmpathyDataLoader = (userId: string | null) => {
  if (!userId) {
    // Return a DataLoader that always returns false if no user is logged in
    return new DataLoader<string, boolean>(async (postIds: readonly string[]) => {
      return postIds.map(() => false)
    })
  }

  return new DataLoader<string, boolean>(
    async (postIds: readonly string[]) => {
      // Check if database is available
      if (!isDatabaseAvailable() || !prisma) {
        return postIds.map(() => false)
      }

      const empathies = await prisma.empathy.findMany({
        where: {
          userId,
          postId: {
            in: [...postIds],
          },
        },
        select: {
          postId: true,
        },
      })

      // Create a set for quick lookup
      const empathizedPostIds = new Set(empathies.map(e => e.postId))

      // Return boolean values in the same order as the input postIds
      return postIds.map(postId => empathizedPostIds.has(postId))
    },
    {
      cache: true,
    }
  )
}
