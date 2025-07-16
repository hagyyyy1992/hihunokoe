import { NextRequest } from 'next/server'
import { ControllerFactory } from '@api/framework/factories/ControllerFactory'
import { prisma } from '@/lib/prisma'
import { categoryLabels, skincareCategories } from '@/lib/constants/categories'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    post: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    empathy: {
      count: jest.fn().mockResolvedValue(0),
    },
    comment: {
      count: jest.fn().mockResolvedValue(0),
    },
  },
  isDatabaseAvailable: jest.fn().mockReturnValue(true),
}))

jest.mock('@api/interface-adapters/services/TokenService', () => ({
  TokenServiceImpl: jest.fn().mockImplementation(() => ({
    verifyToken: jest.fn().mockResolvedValue({ userId: 'test-user-id' }),
  })),
}))

jest.mock('@api/interface-adapters/services/AuthService', () => ({
  AuthServiceImpl: jest.fn().mockImplementation(() => ({
    getUserIdFromRequest: jest.fn().mockResolvedValue('test-user-id'),
    requireAuth: jest.fn().mockResolvedValue('test-user-id'),
  })),
}))

jest.mock('@api/interface-adapters/services/CacheService', () => ({
  CacheServiceImpl: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockReturnValue(null),
    set: jest.fn(),
    deletePattern: jest.fn(),
  })),
}))

jest.mock('@api/interface-adapters/services/FieldMappingService', () => ({
  FieldMappingServiceImpl: jest.fn().mockImplementation(() => ({
    mapLegacyPostFields: jest.fn().mockImplementation(body => ({
      ...body,
      productName: body.productName || body.cosmeticName,
      category: body.category || body.cosmeticCategory,
    })),
  })),
}))

jest.mock('@/lib/cache/memory-cache', () => ({
  memoryCache: {
    get: jest.fn(() => null),
    set: jest.fn(),
    delete: jest.fn(),
    deletePattern: jest.fn(),
  },
}))

// リポジトリのモック
jest.mock('@api/interface-adapters/repositories/User.repository')
jest.mock('@api/interface-adapters/repositories/Post.repository')
jest.mock('@api/interface-adapters/repositories/Comment.repository')
jest.mock('@api/interface-adapters/repositories/Empathy.repository')

// サービスのモック
jest.mock('@api/interface-adapters/services/PasswordHashService')
jest.mock('@api/interface-adapters/services/RateLimitService')

jest.mock('@api/interface-adapters/services/AuthService', () => ({
  AuthServiceImpl: jest.fn().mockImplementation(() => ({
    getUserIdFromRequest: jest.fn().mockResolvedValue('test-user-id'),
    requireAuth: jest.fn().mockResolvedValue('test-user-id'),
  })),
}))

// PostPresenterのモック
jest.mock('@api/framework/presenters/PostPresenter', () => ({
  PostPresenter: {
    toResponse: jest
      .fn()
      .mockImplementation((post, user, empathyCount, commentCount, userHasEmpathy) => ({
        id: post.id,
        userId: post.userId,
        title: post.title,
        content: post.content,
        productName: post.productName || post.cosmeticName || '',
        category: post.category || post.cosmeticCategory || '',
        skinType: post.skinType,
        moodTag: post.moodTag,
        status: post.status,
        viewCount: post.viewCount,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        publishedAt: post.publishedAt?.toISOString() || null,
        user: {
          id: user.id,
          email: user.email,
          userName: user.userName,
        },
        empathyCount,
        commentCount,
        userHasEmpathy: userHasEmpathy || false,
      })),
    toResponseWithMetadata: jest.fn().mockImplementation(postWithMetadata => ({
      id: postWithMetadata.post.id,
      userId: postWithMetadata.post.userId,
      title: postWithMetadata.post.title,
      content: postWithMetadata.post.content,
      productName: postWithMetadata.post.cosmeticName,
      category: postWithMetadata.post.cosmeticCategory,
      skinType: postWithMetadata.post.skinType,
      moodTag: postWithMetadata.post.moodTag,
      status: postWithMetadata.post.status,
      viewCount: postWithMetadata.post.viewCount,
      createdAt: postWithMetadata.post.createdAt.toISOString(),
      updatedAt: postWithMetadata.post.updatedAt.toISOString(),
      publishedAt: postWithMetadata.post.publishedAt?.toISOString() || null,
      user: {
        id: postWithMetadata.user.id,
        email: postWithMetadata.user.email,
        userName: postWithMetadata.user.userName,
      },
      empathyCount: postWithMetadata.empathyCount,
      commentCount: postWithMetadata.commentCount,
      userHasEmpathy: postWithMetadata.userHasEmpathy || false,
    })),
    presentCreated: jest.fn().mockImplementation(
      post =>
        new Response(JSON.stringify({ success: true, data: { post } }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
    ),
    presentPost: jest.fn().mockImplementation(
      post =>
        new Response(JSON.stringify({ success: true, data: { post } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
    ),
    presentPostList: jest.fn().mockImplementation(
      (posts, pagination) =>
        new Response(JSON.stringify({ success: true, data: { posts, pagination } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
    ),
    presentUpdated: jest.fn().mockImplementation(
      post =>
        new Response(JSON.stringify({ success: true, data: { post } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
    ),
    presentDeleted: jest.fn().mockImplementation(
      () =>
        new Response(JSON.stringify({ success: true, message: '投稿を削除しました' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
    ),
  },
}))

// DIコンテナのモック
jest.mock('@api/framework/di/container', () => {
  const mockUserRepository = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }

  const mockPostRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  }

  const mockCommentRepository = {
    findByPostId: jest.fn(),
    count: jest.fn(),
  }

  const mockEmpathyRepository = {
    findByPostAndUser: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    countByPost: jest.fn(),
  }

  const mockTokenService = {
    verifyToken: jest.fn().mockResolvedValue({ userId: 'test-user-id' }),
  }

  const mockAuthService = {
    getUserIdFromRequest: jest.fn().mockResolvedValue('test-user-id'),
    requireAuth: jest.fn().mockResolvedValue('test-user-id'),
  }

  const mockCacheService = {
    get: jest.fn().mockReturnValue(null),
    set: jest.fn(),
    deletePattern: jest.fn(),
  }

  const mockFieldMappingService = {
    mapLegacyPostFields: jest.fn().mockImplementation(body => ({
      ...body,
      productName: body.productName || body.cosmeticName,
      category: body.category || body.cosmeticCategory,
    })),
  }

  const mockRateLimitService = {
    checkRateLimit: jest.fn().mockResolvedValue(true),
  }

  const mockPasswordHashService = {
    hash: jest.fn(),
    compare: jest.fn(),
  }

  const mockPostManagementUseCase = {
    createPost: jest.fn(),
    updatePost: jest.fn(),
    deletePost: jest.fn(),
  }

  const mockPostRetrievalUseCase = {
    getPost: jest.fn(),
    getPosts: jest.fn(),
  }

  const mockEmpathyManagementUseCase = {
    addEmpathy: jest.fn(),
    removeEmpathy: jest.fn(),
    getEmpathyStatus: jest.fn(),
  }

  return {
    dependencies: {
      repositories: {
        userRepository: mockUserRepository,
        postRepository: mockPostRepository,
        commentRepository: mockCommentRepository,
        empathyRepository: mockEmpathyRepository,
      },
      services: {
        passwordHashService: mockPasswordHashService,
        tokenService: mockTokenService,
        rateLimitService: mockRateLimitService,
        authService: mockAuthService,
        cacheService: mockCacheService,
        fieldMappingService: mockFieldMappingService,
      },
      useCases: {
        postManagementUseCase: mockPostManagementUseCase,
        postRetrievalUseCase: mockPostRetrievalUseCase,
        empathyManagementUseCase: mockEmpathyManagementUseCase,
      },
    },
  }
})

describe('投稿カテゴリマッピングのテスト', () => {
  let postController: ReturnType<typeof ControllerFactory.createPostController>
  const mockUserId = 'test-user-id'
  const mockUser = {
    id: mockUserId,
    email: 'test@example.com',
    userName: 'testuser',
    isActive: true,
    deletedAt: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // DIコンテナからモックを取得
    const { dependencies } = require('@api/framework/di/container')

    // useCasesのモックをセットアップ
    dependencies.useCases.postManagementUseCase.createPost.mockImplementation(
      async (input: any) => {
        const mockPost = {
          id: `post-${input.category}`,
          userId: input.userId,
          title: input.title,
          content: input.content,
          productName: input.productName,
          category: input.category,
          cosmeticName: input.productName,
          cosmeticCategory: input.category,
          skinType: input.skinType || null,
          moodTag: input.moodTag || null,
          status: 'published',
          viewCount: 0,
          empathyCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          publishedAt: new Date(),
          deletedAt: null,
          usageSituation: input.usageSituation || null,
          experienceDetails: input.experienceDetails || null,
        }

        return {
          post: mockPost,
          user: mockUser,
          empathyCount: 0,
          commentCount: 0,
        }
      }
    )

    dependencies.useCases.postRetrievalUseCase.getPost.mockImplementation(async (input: any) => {
      const mockPost = {
        id: input.postId,
        userId: mockUserId,
        title: 'スキンケアテスト',
        content: 'テスト内容',
        cosmeticName: 'テストコスメ',
        cosmeticCategory: 'skincare',
        skinType: null,
        moodTag: null,
        status: 'published',
        viewCount: 0,
        empathyCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: new Date(),
        deletedAt: null,
        usageSituation: null,
        experienceDetails: null,
      }

      return {
        post: mockPost,
        user: mockUser,
        empathyCount: 0,
        commentCount: 0,
        userHasEmpathy: false,
      }
    })

    dependencies.useCases.postRetrievalUseCase.getPosts.mockImplementation(async () => {
      const mockPosts = Object.keys(categoryLabels).map((category, index) => ({
        post: {
          id: `post-${index}`,
          userId: mockUserId,
          title: `${categoryLabels[category]}のテスト`,
          content: 'テスト内容',
          cosmeticName: 'テストコスメ',
          cosmeticCategory: category,
          skinType: null,
          moodTag: null,
          status: 'published',
          viewCount: 0,
          empathyCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          publishedAt: new Date(),
          deletedAt: null,
          usageSituation: null,
          experienceDetails: null,
        },
        user: mockUser,
        empathyCount: 0,
        commentCount: 0,
        userHasEmpathy: false,
      }))

      return {
        posts: mockPosts,
        page: 1,
        limit: 10,
        total: mockPosts.length,
      }
    })

    postController = ControllerFactory.createPostController()

    // ユーザーが存在する設定
    ;(prisma!.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
  })

  describe('POST /api/posts - 投稿作成時のカテゴリマッピング', () => {
    test('全てのカテゴリで投稿を作成できる', async () => {
      const categories = Object.keys(categoryLabels)

      for (const category of categories) {
        const mockPost = {
          id: `post-${category}`,
          userId: mockUserId,
          title: `${category} テスト投稿`,
          content: 'テスト内容',
          cosmeticName: 'テストコスメ',
          cosmeticCategory: category,
          skinType: null,
          moodTag: null,
          status: 'published',
          viewCount: 0,
          empathyCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          publishedAt: new Date(),
          deletedAt: null,
          usageSituation: null,
          experienceDetails: null,
          user: mockUser,
          _count: { empathies: 0, comments: 0 },
        }

        ;(prisma!.post.create as jest.Mock).mockResolvedValue(mockPost)

        const request = new NextRequest('http://localhost:3000/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
          body: JSON.stringify({
            title: `${category} テスト投稿`,
            content: 'テスト内容',
            cosmeticName: 'テストコスメ',
            cosmeticCategory: category,
          }),
        })

        let response
        try {
          response = await postController.createPost(request)
        } catch (error) {
          console.error('Error creating post for category:', category, error)
          throw error
        }
        const data = await response.json()

        if (response.status !== 201) {
          console.log('Error response for category:', category, data)
        }

        expect(response.status).toBe(201)
        expect(data.success).toBe(true)
        expect(data.data.post.category).toBe(category)
        expect(data.data.post.productName).toBe('テストコスメ')
      }
    })

    test('skincareカテゴリが正しく保存される', async () => {
      const mockPost = {
        id: 'post-skincare-test',
        userId: mockUserId,
        title: 'スキンケアテスト投稿',
        content: 'テスト内容',
        cosmeticName: 'テストコスメ',
        cosmeticCategory: 'skincare',
        skinType: null,
        moodTag: null,
        status: 'published',
        viewCount: 0,
        empathyCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: new Date(),
        deletedAt: null,
        usageSituation: null,
        experienceDetails: null,
        user: mockUser,
        _count: { empathies: 0, comments: 0 },
      }

      ;(prisma!.post.create as jest.Mock).mockResolvedValue(mockPost)

      const request = new NextRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          title: 'スキンケアテスト投稿',
          content: 'テスト内容',
          cosmeticName: 'テストコスメ',
          cosmeticCategory: 'skincare',
        }),
      })

      const response = await postController.createPost(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.post.category).toBe('skincare')
      expect(data.data.post.productName).toBe('テストコスメ')
    })
  })

  describe('GET /api/posts - 投稿一覧でのカテゴリ表示', () => {
    test('各カテゴリの投稿が正しく取得できる', async () => {
      const mockPosts = Object.keys(categoryLabels).map((category, index) => ({
        id: `post-${index}`,
        userId: mockUserId,
        title: `${categoryLabels[category]}のテスト`,
        content: 'テスト内容',
        cosmeticName: 'テストコスメ',
        cosmeticCategory: category,
        skinType: null,
        moodTag: null,
        status: 'published',
        viewCount: 0,
        empathyCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: new Date(),
        deletedAt: null,
        usageSituation: null,
        experienceDetails: null,
        user: mockUser,
        _count: { empathies: 0, comments: 0 },
      }))

      ;(prisma!.post.findMany as jest.Mock).mockResolvedValue(mockPosts)
      ;(prisma!.post.count as jest.Mock).mockResolvedValue(mockPosts.length)

      const request = new NextRequest('http://localhost:3000/api/posts')
      const response = await postController.getPosts(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.posts).toHaveLength(mockPosts.length)

      // 各投稿のカテゴリが正しいことを確認
      data.data.posts.forEach((post: any, index: number) => {
        const expectedCategory = Object.keys(categoryLabels)[index]
        expect(post.category).toBe(expectedCategory)
      })
    })
  })

  describe('GET /api/posts/[id] - 投稿詳細でのカテゴリ表示', () => {
    test('skincare カテゴリの投稿詳細が正しく取得できる', async () => {
      const mockPost = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        userId: mockUserId,
        title: 'スキンケアテスト',
        content: 'テスト内容',
        cosmeticName: 'テストコスメ',
        cosmeticCategory: 'skincare',
        skinType: null,
        moodTag: null,
        status: 'published',
        viewCount: 0,
        empathyCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: new Date(),
        deletedAt: null,
        usageSituation: null,
        experienceDetails: null,
        user: mockUser,
        _count: { empathies: 0, comments: 0 },
      }

      ;(prisma!.post.findFirst as jest.Mock).mockResolvedValue(mockPost)

      const request = new NextRequest(
        'http://localhost:3000/api/posts/550e8400-e29b-41d4-a716-446655440001'
      )
      const response = await postController.getPost(request, {
        params: { id: '550e8400-e29b-41d4-a716-446655440001' },
      })
      const data = await response.json()

      if (response.status !== 200) {
        console.log('Error response for getPost:', data)
      }

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.post.category).toBe('skincare')
      expect(data.data.post.productName).toBe('テストコスメ')
    })
  })

  describe('カテゴリ定数の整合性チェック', () => {
    test('すべてのスキンケアカテゴリがcategoryLabelsに存在する', () => {
      skincareCategories.forEach(category => {
        expect(categoryLabels).toHaveProperty(category)
        expect(categoryLabels[category]).toBeTruthy()
      })
    })

    test('categoryLabelsに不正な値が含まれていない', () => {
      Object.entries(categoryLabels).forEach(([key, value]) => {
        expect(key).toBeTruthy()
        expect(value).toBeTruthy()
        expect(typeof key).toBe('string')
        expect(typeof value).toBe('string')
      })
    })
  })
})
