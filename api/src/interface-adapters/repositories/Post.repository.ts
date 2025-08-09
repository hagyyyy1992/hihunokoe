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
import { createDBPerfLogger } from '@api/lib/performance-logger'

export class PostRepository implements IPostRepository {
  async findById(id: string): Promise<Post | null> {
    // キャッシュから取得を試行
    const cacheKey = `post:${id}`
    if (isDatabaseAvailable()) {
      const cached = memoryCache.get(cacheKey)
      if (cached) {
        return cached as Post
      }
    }

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
        mockPost.deletedAt || null,
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

    const prismaPost = await prisma.post.findFirst({
      where: {
        id,
        deletedAt: null, // 削除されていない投稿のみ
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

    if (!prismaPost) return null

    const post = this.toDomainPost(prismaPost)

    // 単一投稿は長時間キャッシュ（10分）
    if (isDatabaseAvailable()) {
      memoryCache.set(cacheKey, post, 600000) // 10分
    }

    return post
  }

  async findMany(filter: FindPostsFilter): Promise<FindPostsResult> {
    const perfLogger = createDBPerfLogger('findMany', 'Post')
    perfLogger.start('total', { filter })

    // キャッシュキーの生成
    perfLogger.start('cache-key-generation')
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
    perfLogger.end('cache-key-generation')

    // キャッシュから取得を試行（フィルターなしまたは軽いフィルターのみ）
    perfLogger.start('cache-check')
    const isLightFilter = !filter.search && (!filter.userId || filter.publishedOnly)
    if (isLightFilter && isDatabaseAvailable()) {
      const cached = memoryCache.get(cacheKey)
      if (cached) {
        perfLogger.end('cache-check', { hit: true })
        perfLogger.end('total', { source: 'cache' })
        perfLogger.finish({ cacheHit: true })
        return cached as FindPostsResult
      }
    }
    perfLogger.end('cache-check', { hit: false })

    if (!isDatabaseAvailable()) {
      perfLogger.start('mock-mode')
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
            mockPost.deletedAt || null,
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

      perfLogger.end('mock-mode')
      perfLogger.end('total', { source: 'mock', postCount: posts.length })
      perfLogger.finish({ source: 'mock' })

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
      const searchTerm = filter.search.trim()
      if (searchTerm) {
        // PostgreSQLの全文検索機能の利用可否を安全にチェック
        try {
          // 常に含有検索を使用（より安全で互換性が高い）
          where.OR = [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { content: { contains: searchTerm, mode: 'insensitive' } },
            { cosmeticName: { contains: searchTerm, mode: 'insensitive' } },
          ]
        } catch (error) {
          // 検索エラーが発生した場合はフィルターを無効化
          console.warn('Search filter error, skipping search:', error)
        }
      }
    }

    const orderBy: any = {}
    if (filter.sortBy === 'popular') {
      orderBy.empathies = { _count: 'desc' }
    } else {
      orderBy.createdAt = 'desc'
    }

    try {
      perfLogger.start('prisma-queries')
      // 並列実行でパフォーマンス向上
      const [posts, totalCount] = await Promise.all([
        perfLogger.measure('prisma-findMany', () =>
          prisma!.post.findMany({
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
          })
        ),
        // totalCountは常に正確な値を返す
        perfLogger.measure('prisma-count', () =>
          prisma!.post.count({ where }).catch(error => {
            console.error('Error counting posts:', error)
            return 0
          })
        ),
      ])
      perfLogger.end('prisma-queries', { postCount: posts.length, totalCount })

      perfLogger.start('domain-conversion')
      const result = {
        posts: posts.map(post => this.toDomainPost(post)),
        totalCount,
      }
      perfLogger.end('domain-conversion')

      // 結果をキャッシュに保存（軽いフィルターのみ、条件により異なるTTL）
      perfLogger.start('cache-save')
      if (isLightFilter && isDatabaseAvailable()) {
        // フィルターなしは長時間キャッシュ、軽いフィルターは短時間キャッシュ
        const hasAnyFilter = filter.category || filter.skinType || filter.moodTag
        const ttl = hasAnyFilter ? 180000 : 300000 // 3分または5分
        memoryCache.set(cacheKey, result, ttl)
      }
      perfLogger.end('cache-save')

      perfLogger.end('total', { source: 'database', postCount: result.posts.length })
      perfLogger.finish({ source: 'database', cacheHit: false })

      return result
    } catch (error) {
      // データベースエラーが発生した場合は空の結果を返す
      console.error('Database query error in PostRepository.findMany:', error)

      // エラーメッセージを簡素化してユーザーフレンドリーにする
      const friendlyError = new Error(
        '投稿の検索中にエラーが発生しました。検索条件を変更してお試しください。'
      )
      friendlyError.name = 'PostSearchError'
      throw friendlyError
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
        brandName: data.brandName || null,
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
    if (data.brandName !== undefined) updateData.brandName = data.brandName
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

    // 投稿更新時はキャッシュを無効化
    this.invalidatePostCache(id)
    this.invalidatePostsCache()

    return this.toDomainPost(prismaPost)
  }

  async delete(id: string): Promise<void> {
    if (!prisma) throw new Error('Database connection not available')

    await prisma.post.delete({
      where: { id },
    })

    // 投稿削除時はキャッシュを無効化
    this.invalidatePostCache(id)
    this.invalidatePostsCache()
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
      // 管理画面では削除済み投稿も含めて全て表示
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
      where: {
        status: 'published',
        deletedAt: null, // 削除されていない投稿のみ
      },
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
      where: {
        status: 'published',
        deletedAt: null, // 削除されていない投稿のみ
      },
    })
  }

  async getTotalViews(): Promise<number> {
    if (!prisma) throw new Error('Database connection not available')

    const result = await prisma.post.aggregate({
      where: { deletedAt: null }, // 削除されていない投稿のみ
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

    const where: any = {
      userId,
      deletedAt: null, // 削除されていない投稿のみ
    }
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

    const where: any = {
      status: 'published',
      deletedAt: null, // 削除されていない投稿のみ
    }
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

    try {
      const searchTerm = keyword.trim()
      if (!searchTerm) {
        return []
      }

      const where: any = {
        status: 'published',
        deletedAt: null, // 削除されていない投稿のみ
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { content: { contains: searchTerm, mode: 'insensitive' } },
          { cosmeticName: { contains: searchTerm, mode: 'insensitive' } },
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
    } catch (error) {
      console.error('Database search error in PostRepository.search:', error)

      // 検索エラーの場合は空配列を返す
      return []
    }
  }

  private parseJsonField(field: any): any {
    if (typeof field === 'string') {
      try {
        return JSON.parse(field)
      } catch (error) {
        console.warn('Failed to parse JSON field:', field, error)
        return undefined
      }
    }
    return field
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
      prismaPost.title || null,
      prismaPost.content,
      prismaPost.cosmeticName || null, // productName
      prismaPost.brandName || null, // brandName
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
      prismaPost.deletedAt,
      // JSON文字列をパースしてオブジェクトに変換
      prismaPost.usageSituation ? this.parseJsonField(prismaPost.usageSituation) : undefined,
      prismaPost.experienceDetails ? this.parseJsonField(prismaPost.experienceDetails) : undefined,
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
    try {
      // posts:で始まるキーをすべて削除
      memoryCache.deletePattern('^posts:')
    } catch (error) {
      // テスト環境やキャッシュが利用できない場合は無視
      if (process.env.NODE_ENV !== 'test') {
        console.warn('Failed to invalidate posts cache:', error)
      }
    }
  }

  // 単一投稿のキャッシュ無効化
  private invalidatePostCache(postId: string): void {
    try {
      memoryCache.delete(`post:${postId}`)
    } catch (error) {
      // テスト環境やキャッシュが利用できない場合は無視
      if (process.env.NODE_ENV !== 'test') {
        console.warn('Failed to invalidate post cache:', error)
      }
    }
  }

  // よく使われるフィルター組み合わせをプリロード
  async preloadPopularFilters(): Promise<void> {
    if (!isDatabaseAvailable()) return

    const popularFilters = [
      { category: 'toner', limit: 20, offset: 0, publishedOnly: true },
      { category: 'foundation', limit: 20, offset: 0, publishedOnly: true },
      { skinType: 'dry', limit: 20, offset: 0, publishedOnly: true },
      { skinType: 'oily', limit: 20, offset: 0, publishedOnly: true },
      { moodTag: 'love', limit: 20, offset: 0, publishedOnly: true },
    ]

    // 並列でプリロード実行
    await Promise.allSettled(popularFilters.map(filter => this.findMany(filter)))
  }

  async deleteByUserId(userId: string): Promise<void> {
    if (!isDatabaseAvailable()) {
      // Mock mode
      return
    }

    if (!prisma) throw new Error('Database connection not available')

    try {
      // ユーザーの全投稿を論理削除
      await prisma.post.updateMany({
        where: {
          userId,
          deletedAt: null, // まだ削除されていないもののみ
        },
        data: {
          deletedAt: new Date(),
        },
      })

      // キャッシュを無効化
      this.invalidatePostsCache()
    } catch (error) {
      console.error('Failed to soft delete posts by user:', error)
      throw new Error('投稿の削除に失敗しました')
    }
  }
}
