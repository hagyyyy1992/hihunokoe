import { Post } from '@api/domain/entities/Post'
import {
  IPostRepository,
  CreatePostData,
  UpdatePostData,
  FindPostsFilter,
  FindPostsResult,
} from '@api/domain/repositories/PostRepository'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { Post as PrismaPost } from '@prisma/client'
import { MOCK_POSTS } from '@/lib/mock-data'
import { memoryCache } from '@/lib/cache/memory-cache'

export class PostRepository implements IPostRepository {
  async findById(id: string): Promise<Post | null> {
    if (!isDatabaseAvailable()) {
      // Mock mode
      const mockPost = MOCK_POSTS.find(p => p.id === id)
      if (!mockPost) return null

      return new Post(
        mockPost.id,
        mockPost.userId,
        mockPost.title,
        mockPost.content,
        mockPost.cosmeticName,
        null, // brandName
        null, // imageUrl
        mockPost.cosmeticCategory,
        mockPost.status === 'published',
        mockPost.publishedAt,
        mockPost.status,
        mockPost.cosmeticName,
        mockPost.cosmeticCategory,
        mockPost.skinType,
        mockPost.moodTag,
        mockPost.viewCount || 0,
        mockPost.empathyCount || 0,
        mockPost._count?.comments || 0,
        mockPost.createdAt,
        mockPost.updatedAt,
        mockPost.usageSituation,
        mockPost.experienceDetails,
        mockPost.user
          ? {
              id: mockPost.user.id,
              userName: mockPost.user.userName,
            }
          : null
      )
    }

    if (!prisma) throw new Error('Database connection not available')

    const prismaPost = await prisma.post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
          },
        },
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
    // キャッシュキーの生成
    const cacheKey = `posts:${JSON.stringify({
      offset: filter.offset,
      limit: filter.limit,
      category: filter.category,
      skinType: filter.skinType,
      moodTag: filter.moodTag,
      search: filter.search,
      sortBy: filter.sortBy,
      publishedOnly: filter.publishedOnly,
    })}`

    // キャッシュから取得を試行（検索時以外）
    if (!filter.search && isDatabaseAvailable()) {
      const cached = memoryCache.get(cacheKey)
      if (cached) {
        return cached as FindPostsResult
      }
    }

    if (!isDatabaseAvailable()) {
      // Mock mode
      let filteredPosts = [...MOCK_POSTS]

      if (filter.publishedOnly) {
        filteredPosts = filteredPosts.filter(p => p.status === 'published')
      }

      if (filter.userId) {
        filteredPosts = filteredPosts.filter(p => p.userId === filter.userId)
      }

      if (filter.category) {
        filteredPosts = filteredPosts.filter(p => p.cosmeticCategory === filter.category)
      }

      if (filter.skinType) {
        filteredPosts = filteredPosts.filter(p => p.skinType === filter.skinType)
      }

      if (filter.moodTag) {
        filteredPosts = filteredPosts.filter(p => p.moodTag === filter.moodTag)
      }

      if (filter.search) {
        const searchLower = filter.search.toLowerCase()
        filteredPosts = filteredPosts.filter(
          p =>
            p.title.toLowerCase().includes(searchLower) ||
            p.content.toLowerCase().includes(searchLower) ||
            p.cosmeticName.toLowerCase().includes(searchLower)
        )
      }

      // Sort
      if (filter.sortBy === 'popular') {
        filteredPosts.sort((a, b) => (b.empathyCount || 0) - (a.empathyCount || 0))
      } else {
        filteredPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      }

      // Pagination
      const totalCount = filteredPosts.length
      const paginatedPosts = filteredPosts.slice(filter.offset, filter.offset + filter.limit)

      // Convert to domain entities
      const posts = paginatedPosts.map(
        mockPost =>
          new Post(
            mockPost.id,
            mockPost.userId,
            mockPost.title,
            mockPost.content,
            mockPost.cosmeticName,
            null, // brandName
            null, // imageUrl
            mockPost.cosmeticCategory,
            mockPost.status === 'published',
            mockPost.publishedAt,
            mockPost.status,
            mockPost.cosmeticName,
            mockPost.cosmeticCategory,
            mockPost.skinType,
            mockPost.moodTag,
            mockPost.viewCount || 0,
            mockPost.empathyCount || 0,
            mockPost._count?.comments || 0,
            mockPost.createdAt,
            mockPost.updatedAt,
            mockPost.usageSituation,
            mockPost.experienceDetails,
            mockPost.user
              ? {
                  id: mockPost.user.id,
                  userName: mockPost.user.userName,
                }
              : null
          )
      )

      return {
        posts,
        totalCount,
      }
    }

    if (!prisma) throw new Error('Database connection not available')

    const where: any = {}

    if (filter.publishedOnly) {
      where.status = 'published'
    }

    // userIdフィルタは特定のユーザーの投稿のみを取得する場合に使用
    // 通常の投稿一覧では使用しない
    if (filter.userId) {
      where.userId = filter.userId
    }

    if (filter.category) {
      where.cosmeticCategory = filter.category
    }

    if (filter.skinType) {
      where.skinType = filter.skinType
    }

    if (filter.moodTag) {
      where.moodTag = filter.moodTag
    }

    if (filter.search) {
      // PostgreSQLの全文検索を使用（パフォーマンス向上）
      const searchTerm = filter.search.trim()
      if (searchTerm) {
        where.OR = [
          { title: { search: searchTerm, mode: 'insensitive' } },
          { content: { search: searchTerm, mode: 'insensitive' } },
          { cosmeticName: { search: searchTerm, mode: 'insensitive' } },
          // フォールバック用（全文検索が使えない場合）
          { title: { contains: filter.search, mode: 'insensitive' } },
          { content: { contains: filter.search, mode: 'insensitive' } },
          { cosmeticName: { contains: filter.search, mode: 'insensitive' } },
        ]
      }
    }

    const orderBy: any = {}
    if (filter.sortBy === 'popular') {
      orderBy.empathies = { _count: 'desc' }
    } else {
      orderBy.createdAt = 'desc'
    }

    // 並列実行でパフォーマンス向上
    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        skip: filter.offset,
        take: filter.limit,
        include: {
          user: {
            select: {
              id: true,
              userName: true,
            },
          },
          _count: {
            select: {
              empathies: true,
              comments: true,
            },
          },
        },
      }),
      // totalCountは軽量化（検索時のみ正確な値が必要）
      filter.search ? prisma.post.count({ where }) : Promise.resolve(-1),
    ])

    const result = {
      posts: posts.map(post => this.toDomainPost(post)),
      totalCount,
    }

    // 結果をキャッシュに保存（検索時以外、5分間）
    if (!filter.search && isDatabaseAvailable()) {
      memoryCache.set(cacheKey, result, 300000) // 5分
    }

    return result
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
        user: {
          select: {
            id: true,
            userName: true,
          },
        },
        _count: {
          select: {
            empathies: true,
            comments: true,
          },
        },
      },
    })

    // 投稿作成時はキャッシュを無効化
    this.invalidatePostsCache()

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
        user: {
          select: {
            id: true,
            userName: true,
          },
        },
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
        user: {
          select: {
            id: true,
            userName: true,
          },
        },
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
        user: {
          select: {
            id: true,
            userName: true,
          },
        },
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

  // Methods for test compatibility
  async findByUserId(userId: string, options?: { includeUnpublished?: boolean }): Promise<Post[]> {
    if (!prisma) throw new Error('Database connection not available')

    const where: any = { userId }
    if (!options?.includeUnpublished) {
      where.status = 'published'
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
          },
        },
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

  async findAll(options?: {
    limit?: number
    offset?: number
    category?: string
    skinType?: string
    moodTag?: string
  }): Promise<Post[]> {
    if (!prisma) throw new Error('Database connection not available')

    const where: any = { status: 'published' }
    if (options?.category) where.cosmeticCategory = options.category
    if (options?.skinType) where.skinType = options.skinType
    if (options?.moodTag) where.moodTag = options.moodTag

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: options?.offset,
      take: options?.limit,
      include: {
        user: {
          select: {
            id: true,
            userName: true,
          },
        },
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

  async search(
    keyword: string,
    options?: { category?: string; skinType?: string; limit?: number }
  ): Promise<Post[]> {
    if (!prisma) throw new Error('Database connection not available')

    const where: any = {
      status: 'published',
      OR: [
        { title: { contains: keyword, mode: 'insensitive' } },
        { content: { contains: keyword, mode: 'insensitive' } },
        { cosmeticName: { contains: keyword, mode: 'insensitive' } },
      ],
    }

    if (options?.category) where.cosmeticCategory = options.category
    if (options?.skinType) where.skinType = options.skinType

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit,
      include: {
        user: {
          select: {
            id: true,
            userName: true,
          },
        },
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

  private toDomainPost(
    prismaPost: PrismaPost & {
      user?: {
        id: string
        userName: string
      }
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
      prismaPost.experienceDetails,
      prismaPost.user || null,
      // Additional properties for test compatibility
      null, // fragranceType (not in current schema)
      null, // fragranceIntensity (not in current schema)
      null, // textureType (not in current schema)
      null, // finishType (not in current schema)
      null, // applicationEase (not in current schema)
      null, // longevity (not in current schema)
      null, // valueForMoney (not in current schema)
      null, // overallRating (not in current schema)
      null // repurchaseIntention (not in current schema)
    )
  }

  // キャッシュ無効化メソッド
  private invalidatePostsCache(): void {
    // posts:で始まるキーをすべて削除
    memoryCache.deletePattern('^posts:')
  }
}
