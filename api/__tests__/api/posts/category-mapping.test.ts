import { NextRequest } from 'next/server'
import { PostController } from '@api/framework/controllers/PostController'
import { PostManagementUseCase, PostRetrievalUseCase } from '@api/usecases/posts/interactor'
import { PostRepositoryImpl } from '@api/interface-adapters/repositories/PostRepositoryImpl'
import { UserRepositoryImpl } from '@api/interface-adapters/repositories/UserRepositoryImpl'
import { prisma } from '@/lib/prisma'
import { categoryLabels, skincareCategories } from '@/lib/constants/categories'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    post: {
      create: jest.fn(),
      findUnique: jest.fn(),
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

jest.mock('@api/interface-adapters/services/TokenServiceImpl', () => ({
  TokenServiceImpl: jest.fn().mockImplementation(() => ({
    verifyToken: jest.fn().mockResolvedValue({ userId: 'test-user-id' }),
  })),
}))

describe('投稿カテゴリマッピングのテスト', () => {
  let postController: PostController
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
    postController = new PostController()

    // ユーザーが存在する設定
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
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
          usageSituation: null,
          experienceDetails: null,
          user: mockUser,
          _count: { empathies: 0, comments: 0 },
        }

        ;(prisma.post.create as jest.Mock).mockResolvedValue(mockPost)

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

        const response = await postController.createPost(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.post.cosmeticCategory).toBe(category)
        expect(data.post.category).toBe(category) // 互換性のため両方のフィールドが存在
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
        usageSituation: null,
        experienceDetails: null,
        user: mockUser,
        _count: { empathies: 0, comments: 0 },
      }

      ;(prisma.post.create as jest.Mock).mockResolvedValue(mockPost)

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

      expect(response.status).toBe(200)
      expect(data.post.cosmeticCategory).toBe('skincare')
      expect(data.post.category).toBe('skincare')
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
        usageSituation: null,
        experienceDetails: null,
        user: mockUser,
        _count: { empathies: 0, comments: 0 },
      }))

      ;(prisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts)
      ;(prisma.post.count as jest.Mock).mockResolvedValue(mockPosts.length)

      const request = new NextRequest('http://localhost:3000/api/posts')
      const response = await postController.getPosts(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.posts).toHaveLength(mockPosts.length)

      // 各投稿のカテゴリが正しいことを確認
      data.posts.forEach((post: any, index: number) => {
        const expectedCategory = Object.keys(categoryLabels)[index]
        expect(post.cosmeticCategory).toBe(expectedCategory)
        expect(post.category).toBe(expectedCategory)
      })
    })
  })

  describe('GET /api/posts/[id] - 投稿詳細でのカテゴリ表示', () => {
    test('skincare カテゴリの投稿詳細が正しく取得できる', async () => {
      const mockPost = {
        id: 'test-post-id',
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
        usageSituation: null,
        experienceDetails: null,
        user: mockUser,
        _count: { empathies: 0, comments: 0 },
      }

      ;(prisma.post.findUnique as jest.Mock).mockResolvedValue(mockPost)

      const request = new NextRequest('http://localhost:3000/api/posts/test-post-id')
      const response = await postController.getPost(request, { params: { id: 'test-post-id' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.post.cosmeticCategory).toBe('skincare')
      expect(data.post.category).toBe('skincare')
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
