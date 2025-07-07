import { Post } from '@api/domain/entities/Post'
import {
  PostRepository,
  CreatePostData,
  UpdatePostData,
  FindPostsFilter,
  FindPostsResult,
} from '@api/domain/repositories/PostRepository'
import { prisma } from '@/lib/prisma'
import { Post as PrismaPost } from '@prisma/client'

export class PostRepositoryImpl implements PostRepository {
  async findById(id: string): Promise<Post | null> {
    if (!prisma) throw new Error('Database connection not available')

    const prismaPost = await prisma.post.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            empathies: true,
            comments: true,
          },
        },
      },
    })

    if (!prismaPost) return null
    return this.toDomainPost(prismaPost)
  }

  async findMany(filter: FindPostsFilter): Promise<FindPostsResult> {
    if (!prisma) throw new Error('Database connection not available')

    const where: any = {}

    if (filter.publishedOnly) {
      where.isPublished = true
    }

    if (filter.userId) {
      where.userId = filter.userId
    }

    if (filter.category) {
      where.category = filter.category
    }

    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { content: { contains: filter.search, mode: 'insensitive' } },
        { productName: { contains: filter.search, mode: 'insensitive' } },
        { brandName: { contains: filter.search, mode: 'insensitive' } },
      ]
    }

    const orderBy: any = {}
    if (filter.sortBy === 'popular') {
      orderBy.empathies = { _count: 'desc' }
    } else {
      orderBy.createdAt = 'desc'
    }

    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        skip: filter.offset,
        take: filter.limit,
        include: {
          _count: {
            select: {
              empathies: true,
              comments: true,
            },
          },
        },
      }),
      prisma.post.count({ where }),
    ])

    return {
      posts: posts.map(post => this.toDomainPost(post)),
      totalCount,
    }
  }

  async create(data: CreatePostData): Promise<Post> {
    if (!prisma) throw new Error('Database connection not available')

    const prismaPost = await prisma.post.create({
      data: {
        userId: data.userId,
        title: data.title,
        content: data.content,
        productName: data.productName || null,
        brandName: data.brandName || null,
        imageUrl: data.imageUrl || null,
        category: data.category || null,
        isPublished: data.isPublished || false,
      },
      include: {
        _count: {
          select: {
            empathies: true,
            comments: true,
          },
        },
      },
    })

    return this.toDomainPost(prismaPost)
  }

  async update(id: string, data: UpdatePostData): Promise<Post> {
    if (!prisma) throw new Error('Database connection not available')

    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.content !== undefined) updateData.content = data.content
    if (data.productName !== undefined) updateData.productName = data.productName
    if (data.brandName !== undefined) updateData.brandName = data.brandName
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
    if (data.category !== undefined) updateData.category = data.category
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished

    const prismaPost = await prisma.post.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            empathies: true,
            comments: true,
          },
        },
      },
    })

    return this.toDomainPost(prismaPost)
  }

  async delete(id: string): Promise<void> {
    if (!prisma) throw new Error('Database connection not available')

    await prisma.post.delete({
      where: { id },
    })
  }

  async incrementEmpathyCount(id: string): Promise<void> {
    // This is handled by the database relationships and _count
    // No need to manually increment as Prisma handles this automatically
  }

  async decrementEmpathyCount(id: string): Promise<void> {
    // This is handled by the database relationships and _count
    // No need to manually decrement as Prisma handles this automatically
  }

  async incrementCommentCount(id: string): Promise<void> {
    // This is handled by the database relationships and _count
    // No need to manually increment as Prisma handles this automatically
  }

  async decrementCommentCount(id: string): Promise<void> {
    // This is handled by the database relationships and _count
    // No need to manually decrement as Prisma handles this automatically
  }

  // Admin-specific methods
  async findAllForAdmin(): Promise<Post[]> {
    if (!prisma) throw new Error('Database connection not available')

    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            empathies: true,
            comments: true,
          },
        },
      },
    })

    return posts.map(post => this.toDomainPost(post))
  }

  async findRecentPosts(limit: number): Promise<Post[]> {
    if (!prisma) throw new Error('Database connection not available')

    const posts = await prisma.post.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        _count: {
          select: {
            empathies: true,
            comments: true,
          },
        },
      },
    })

    return posts.map(post => this.toDomainPost(post))
  }

  async countPublishedPosts(): Promise<number> {
    if (!prisma) throw new Error('Database connection not available')

    return await prisma.post.count({
      where: { isPublished: true },
    })
  }

  async getTotalViews(): Promise<number> {
    if (!prisma) throw new Error('Database connection not available')

    const result = await prisma.post.aggregate({
      _sum: {
        viewCount: true,
      },
    })

    return result._sum.viewCount || 0
  }

  async updatePublishStatus(id: string, isPublished: boolean): Promise<void> {
    if (!prisma) throw new Error('Database connection not available')

    await prisma.post.update({
      where: { id },
      data: { isPublished },
    })
  }

  private toDomainPost(
    prismaPost: PrismaPost & {
      _count: {
        empathies: number
        comments: number
      }
    }
  ): Post {
    return new Post(
      prismaPost.id,
      prismaPost.userId,
      prismaPost.title,
      prismaPost.content,
      prismaPost.productName,
      prismaPost.brandName,
      prismaPost.imageUrl,
      prismaPost.category,
      prismaPost.isPublished,
      prismaPost._count.empathies,
      prismaPost._count.comments,
      prismaPost.createdAt,
      prismaPost.updatedAt
    )
  }
}
