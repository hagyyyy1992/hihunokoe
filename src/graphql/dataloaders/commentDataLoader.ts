import DataLoader from 'dataloader'
import { Prisma } from '@prisma/client'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'

type CommentWithRelations = Prisma.CommentGetPayload<{
  include: {
    user: true
  }
}>

/**
 * DataLoader for batching and caching comment queries
 * This helps prevent N+1 query problems when loading comments for multiple posts
 */
export const createCommentDataLoader = () => {
  return new DataLoader<string, CommentWithRelations[]>(
    async (postIds: readonly string[]) => {
      // Check if database is available
      if (!isDatabaseAvailable() || !prisma) {
        return postIds.map(() => [])
      }

      // Batch fetch all comments for the given post IDs
      const comments = await prisma.comment.findMany({
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

      // Group comments by postId
      const commentsByPostId = comments.reduce(
        (acc, comment) => {
          if (!acc[comment.postId]) {
            acc[comment.postId] = []
          }
          acc[comment.postId].push(comment)
          return acc
        },
        {} as Record<string, CommentWithRelations[]>
      )

      // Return comments in the same order as the input postIds
      return postIds.map(postId => commentsByPostId[postId] || [])
    },
    {
      // Cache results for the duration of the request
      cache: true,
    }
  )
}

/**
 * DataLoader for fetching individual comments by ID
 */
export const createCommentByIdDataLoader = () => {
  return new DataLoader<string, CommentWithRelations | null>(
    async (commentIds: readonly string[]) => {
      // Check if database is available
      if (!isDatabaseAvailable() || !prisma) {
        return commentIds.map(() => null)
      }

      const comments = await prisma.comment.findMany({
        where: {
          id: {
            in: [...commentIds],
          },
        },
        include: {
          user: true,
        },
      })

      // Create a map for quick lookup
      const commentMap = new Map(comments.map(comment => [comment.id, comment]))

      // Return comments in the same order as the input IDs
      return commentIds.map(id => commentMap.get(id) || null)
    },
    {
      cache: true,
    }
  )
}
