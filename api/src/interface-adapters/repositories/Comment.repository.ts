import { Comment } from '@api/domain/entities/Comment'
import { ICommentRepository } from '@api/domain/repositories/CommentRepository'
import { prisma } from '@/lib/prisma'
import { Comment as PrismaComment } from '@prisma/client'

export class CommentRepository implements ICommentRepository {
  async create(
    postId: string,
    userId: string,
    content: string,
    parentCommentId?: string | null
  ): Promise<Comment> {
    if (!prisma) throw new Error('Database connection not available')

    const prismaComment = await prisma.comment.create({
      data: {
        postId,
        userId,
        content,
        parentCommentId: parentCommentId || null,
        isActive: true,
      },
    })

    return this.toDomainComment(prismaComment)
  }

  async findById(id: string): Promise<Comment | null> {
    if (!prisma) throw new Error('Database connection not available')

    const prismaComment = await prisma.comment.findUnique({
      where: { id },
    })

    if (!prismaComment) return null
    return this.toDomainComment(prismaComment)
  }

  async findByPostId(
    postId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<Comment[]> {
    if (!prisma) throw new Error('Database connection not available')

    const prismaComments = await prisma.comment.findMany({
      where: {
        postId,
        isActive: true,
      },
      orderBy: { createdAt: 'asc' },
      skip: options?.offset,
      take: options?.limit,
    })

    return prismaComments.map(comment => this.toDomainComment(comment))
  }

  async findByUserId(userId: string): Promise<Comment[]> {
    if (!prisma) throw new Error('Database connection not available')

    const prismaComments = await prisma.comment.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return prismaComments.map(comment => this.toDomainComment(comment))
  }

  async findRepliesByParentId(parentCommentId: string): Promise<Comment[]> {
    if (!prisma) throw new Error('Database connection not available')

    const prismaComments = await prisma.comment.findMany({
      where: {
        parentCommentId,
        isActive: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    return prismaComments.map(comment => this.toDomainComment(comment))
  }

  async update(id: string, content: string): Promise<Comment | null> {
    if (!prisma) throw new Error('Database connection not available')

    const prismaComment = await prisma.comment.update({
      where: { id },
      data: {
        content,
        updatedAt: new Date(),
      },
    })

    return this.toDomainComment(prismaComment)
  }

  async delete(id: string): Promise<boolean> {
    if (!prisma) throw new Error('Database connection not available')

    try {
      await prisma.comment.delete({
        where: { id },
      })
      return true
    } catch (error) {
      return false
    }
  }

  async softDelete(id: string): Promise<boolean> {
    if (!prisma) throw new Error('Database connection not available')

    try {
      await prisma.comment.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      })
      return true
    } catch (error) {
      return false
    }
  }

  async exists(id: string): Promise<boolean> {
    if (!prisma) throw new Error('Database connection not available')

    const count = await prisma.comment.count({
      where: { id },
    })

    return count > 0
  }

  async existsAndIsActive(id: string): Promise<boolean> {
    if (!prisma) throw new Error('Database connection not available')

    const count = await prisma.comment.count({
      where: {
        id,
        isActive: true,
      },
    })

    return count > 0
  }

  async countByPostId(postId: string): Promise<number> {
    if (!prisma) throw new Error('Database connection not available')

    return await prisma.comment.count({
      where: {
        postId,
        isActive: true,
        parentCommentId: null, // トップレベルコメントのみ
      },
    })
  }

  async countRepliesByParentId(parentCommentId: string): Promise<number> {
    if (!prisma) throw new Error('Database connection not available')

    return await prisma.comment.count({
      where: {
        parentCommentId,
        isActive: true,
      },
    })
  }

  async findByPostIdWithPagination(
    postId: string,
    skip: number,
    limit: number
  ): Promise<Comment[]> {
    if (!prisma) throw new Error('Database connection not available')

    const prismaComments = await prisma.comment.findMany({
      where: {
        postId,
        isActive: true,
        parentCommentId: null, // トップレベルコメントのみ
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    return prismaComments.map(comment => this.toDomainComment(comment))
  }

  private toDomainComment(prismaComment: PrismaComment): Comment {
    return new Comment(
      prismaComment.id,
      prismaComment.postId,
      prismaComment.userId,
      prismaComment.content,
      prismaComment.parentCommentId,
      prismaComment.isActive,
      prismaComment.createdAt,
      prismaComment.updatedAt
    )
  }
}
