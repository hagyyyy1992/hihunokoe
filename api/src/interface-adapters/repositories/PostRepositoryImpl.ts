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
      where.status = 'published'
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
        { cosmeticName: { contains: filter.search, mode: 'insensitive' } },
        { cosmeticCategory: { contains: filter.search, mode: 'insensitive' } },
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
        cosmeticName: data.productName || '',
        cosmeticCategory: data.category || null,
        skinType: data.skinType || null,
        moodTag: data.moodTag || null,
        usageSituation: data.usageSituation || null,
        experienceDetails: data.experienceDetails || null,
        status: data.isPublished ? 'published' : 'draft',
        publishedAt: data.isPublished ? new Date() : null,
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
    if (data.productName !== undefined) updateData.cosmeticName = data.productName
    if (data.category !== undefined) updateData.cosmeticCategory = data.category
    if (data.skinType !== undefined) updateData.skinType = data.skinType
    if (data.moodTag !== undefined) updateData.moodTag = data.moodTag
    if (data.usageSituation !== undefined) updateData.usageSituation = data.usageSituation
    if (data.experienceDetails !== undefined) updateData.experienceDetails = data.experienceDetails
    if (data.isPublished !== undefined) {
      updateData.status = data.isPublished ? 'published' : 'draft'
      updateData.publishedAt = data.isPublished ? new Date() : null
    }

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
      where: { status: 'published' },
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
      where: { status: 'published' },
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
      data: {
        status: isPublished ? 'published' : 'draft',
        publishedAt: isPublished ? new Date() : null,
      },
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
      prismaPost.cosmeticName || null, // productName
      null, // brandName (not in current schema)
      null, // imageUrl (not in current schema)
      prismaPost.cosmeticCategory || null, // category
      prismaPost.status === 'published', // isPublished
      prismaPost.publishedAt,
      prismaPost.status,
      prismaPost.cosmeticName,
      prismaPost.cosmeticCategory,
      prismaPost.skinType,
      prismaPost.moodTag,
      prismaPost.viewCount || 0,
      prismaPost._count.empathies,
      prismaPost._count.comments,
      prismaPost.createdAt,
      prismaPost.updatedAt,
      prismaPost.usageSituation,
      prismaPost.experienceDetails
    )
  }
}
