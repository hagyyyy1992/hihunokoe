import { PostRepository } from '@api/interface-adapters/repositories/Post.repository'
import { Post } from '@api/domain/entities/Post'
import {
  CreatePostData,
  UpdatePostData,
  FindPostsFilter,
} from '@api/domain/repositories/PostRepository'
import { v4 as uuidv4 } from 'uuid'

// prismaとisdatabaseAvailableのモック
jest.mock('@/lib/prisma', () => ({
  prisma: {
    post: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
  },
  isDatabaseAvailable: jest.fn(() => true), // データベース利用可能として設定
}))

jest.mock('@/lib/mock-data', () => ({
  MOCK_POSTS: [],
}))

jest.mock('@/lib/cache/memory-cache', () => ({
  memoryCache: {
    get: jest.fn(() => null),
    set: jest.fn(),
    deletePattern: jest.fn(),
  },
}))

// モックオブジェクトの参照を取得
const mockPrisma = require('@/lib/prisma').prisma

describe('Post.repository', () => {
  let repository: PostRepository

  beforeEach(() => {
    repository = new PostRepository()
    jest.clearAllMocks()
  })

  const createMockPrismaPost = (overrides?: any) => ({
    id: uuidv4(),
    userId: uuidv4(),
    title: 'テスト投稿',
    content: 'これはテスト投稿です',
    cosmeticName: 'テスト化粧品',
    cosmeticCategory: 'toner',
    skinType: 'normal',
    moodTag: 'love',
    status: 'published',
    publishedAt: new Date(),
    usageSituation: null,
    experienceDetails: null,
    viewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: uuidv4(),
      userName: 'テストユーザー',
    },
    _count: {
      empathies: 0,
      comments: 0,
    },
    ...overrides,
  })

  const createMockCreateData = (overrides?: Partial<CreatePostData>): CreatePostData => ({
    userId: uuidv4(),
    title: 'テスト投稿',
    content: 'これはテスト投稿です',
    productName: 'テスト化粧品',
    category: 'toner',
    skinType: 'normal',
    moodTag: 'love',
    usageSituation: null,
    experienceDetails: null,
    isPublished: true,
    ...overrides,
  })

  describe('create', () => {
    it('投稿を作成できる', async () => {
      const createData = createMockCreateData()
      const mockPrismaPost = createMockPrismaPost({
        userId: createData.userId,
        title: createData.title,
        content: createData.content,
      })

      mockPrisma.post.create.mockResolvedValue(mockPrismaPost)

      const result = await repository.create(createData)

      expect(mockPrisma.post.create).toHaveBeenCalledWith({
        data: {
          userId: createData.userId,
          title: createData.title,
          content: createData.content,
          cosmeticName: createData.productName || '',
          cosmeticCategory: createData.category || null,
          skinType: createData.skinType || null,
          moodTag: createData.moodTag || null,
          usageSituation: createData.usageSituation || null,
          experienceDetails: createData.experienceDetails || null,
          status: createData.isPublished ? 'published' : 'draft',
          publishedAt: createData.isPublished ? expect.any(Date) : null,
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
      expect(result).toBeInstanceOf(Post)
      expect(result.title).toBe(createData.title)
    })

    it('オプショナルフィールドなしでも作成できる', async () => {
      const createData = createMockCreateData({
        category: null,
        skinType: null,
        moodTag: null,
      })
      const mockPrismaPost = createMockPrismaPost({
        cosmeticCategory: null,
        skinType: null,
        moodTag: null,
      })

      mockPrisma.post.create.mockResolvedValue(mockPrismaPost)

      const result = await repository.create(createData)

      expect(result).toBeInstanceOf(Post)
      expect(result.category).toBeNull()
    })
  })

  describe('findById', () => {
    it('IDで投稿を取得できる', async () => {
      const postId = uuidv4()
      const mockPrismaPost = createMockPrismaPost({ id: postId })

      mockPrisma.post.findUnique.mockResolvedValue(mockPrismaPost)

      const result = await repository.findById(postId)

      expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: postId },
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
      expect(result).toBeInstanceOf(Post)
      expect(result!.id).toBe(postId)
    })

    it('存在しないIDの場合nullを返す', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null)

      const result = await repository.findById(uuidv4())

      expect(result).toBeNull()
    })
  })

  describe('findMany', () => {
    it('公開投稿を取得できる', async () => {
      const posts = [createMockPrismaPost(), createMockPrismaPost()]
      const totalCount = 2

      mockPrisma.post.findMany.mockResolvedValue(posts)
      mockPrisma.post.count.mockResolvedValue(totalCount)

      const filter: FindPostsFilter = {
        publishedOnly: true,
        limit: 10,
        offset: 0,
      }

      const result = await repository.findMany(filter)

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
        where: { status: 'published' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
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
      expect(result.posts).toHaveLength(2)
      expect(result.totalCount).toBe(2) // 常に正確な投稿数を返すように変更
    })

    it('ページネーションが機能する', async () => {
      mockPrisma.post.findMany.mockResolvedValue([])
      mockPrisma.post.count.mockResolvedValue(0)

      const filter: FindPostsFilter = {
        limit: 20,
        offset: 40,
        publishedOnly: true,
      }

      await repository.findMany(filter)

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 40,
          take: 20,
        })
      )
    })

    it('カテゴリでフィルタリングできる', async () => {
      mockPrisma.post.findMany.mockResolvedValue([])
      mockPrisma.post.count.mockResolvedValue(0)

      const filter: FindPostsFilter = {
        category: 'toner',
        limit: 10,
        offset: 0,
        publishedOnly: true,
      }

      await repository.findMany(filter)

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'published',
            cosmeticCategory: 'toner',
          }),
        })
      )
    })

    it('肌タイプでフィルタリングできる', async () => {
      mockPrisma.post.findMany.mockResolvedValue([])
      mockPrisma.post.count.mockResolvedValue(0)

      const filter: FindPostsFilter = {
        skinType: 'dry',
        limit: 10,
        offset: 0,
        publishedOnly: true,
      }

      await repository.findMany(filter)

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'published',
            skinType: 'dry',
          }),
        })
      )
    })

    it('ムードタグでフィルタリングできる', async () => {
      mockPrisma.post.findMany.mockResolvedValue([])
      mockPrisma.post.count.mockResolvedValue(0)

      const filter: FindPostsFilter = {
        moodTag: 'love',
        limit: 10,
        offset: 0,
        publishedOnly: true,
      }

      await repository.findMany(filter)

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'published',
            moodTag: 'love',
          }),
        })
      )
    })

    it('キーワードで投稿を検索できる', async () => {
      const posts = [createMockPrismaPost()]
      mockPrisma.post.findMany.mockResolvedValue(posts)
      mockPrisma.post.count.mockResolvedValue(1)

      const filter: FindPostsFilter = {
        search: '化粧水',
        limit: 10,
        offset: 0,
        publishedOnly: true,
      }

      const result = await repository.findMany(filter)

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'published',
            OR: [
              { title: { contains: '化粧水', mode: 'insensitive' } },
              { content: { contains: '化粧水', mode: 'insensitive' } },
              { cosmeticName: { contains: '化粧水', mode: 'insensitive' } },
            ],
          }),
        })
      )
      expect(result.posts).toHaveLength(1)
    })

    it('検索結果にフィルタを適用できる', async () => {
      mockPrisma.post.findMany.mockResolvedValue([])
      mockPrisma.post.count.mockResolvedValue(0)

      const filter: FindPostsFilter = {
        search: '化粧水',
        category: 'toner',
        skinType: 'dry',
        limit: 10,
        offset: 0,
        publishedOnly: true,
      }

      await repository.findMany(filter)

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'published',
            cosmeticCategory: 'toner',
            skinType: 'dry',
            OR: [
              { title: { contains: '化粧水', mode: 'insensitive' } },
              { content: { contains: '化粧水', mode: 'insensitive' } },
              { cosmeticName: { contains: '化粧水', mode: 'insensitive' } },
            ],
          }),
        })
      )
    })
  })

  describe('update', () => {
    it('投稿を更新できる', async () => {
      const postId = uuidv4()
      const updateData: UpdatePostData = {
        title: '更新されたタイトル',
        content: '更新されたコンテンツ',
      }
      const updatedPost = createMockPrismaPost({
        id: postId,
        ...updateData,
      })

      mockPrisma.post.update.mockResolvedValue(updatedPost)

      const result = await repository.update(postId, updateData)

      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: postId },
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
      expect(result).toBeInstanceOf(Post)
      expect(result.title).toBe(updateData.title)
    })

    it('公開ステータスを更新できる', async () => {
      const postId = uuidv4()
      const updateData: UpdatePostData = {
        isPublished: false,
      }

      const updatedPost = createMockPrismaPost({
        id: postId,
        status: 'draft',
        publishedAt: null,
      })

      mockPrisma.post.update.mockResolvedValue(updatedPost)

      await repository.update(postId, updateData)

      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: {
          status: 'draft',
          publishedAt: null,
        },
        include: expect.any(Object),
      })
    })
  })

  describe('delete', () => {
    it('投稿を削除できる', async () => {
      const postId = uuidv4()
      mockPrisma.post.delete.mockResolvedValue({ id: postId })

      await repository.delete(postId)

      expect(mockPrisma.post.delete).toHaveBeenCalledWith({
        where: { id: postId },
      })
    })
  })

  describe('countPublishedPosts', () => {
    it('公開投稿数をカウントできる', async () => {
      mockPrisma.post.count.mockResolvedValue(100)

      const result = await repository.countPublishedPosts()

      expect(mockPrisma.post.count).toHaveBeenCalledWith({
        where: { status: 'published' },
      })
      expect(result).toBe(100)
    })
  })

  describe('findRecentPosts', () => {
    it('最新の投稿を取得できる', async () => {
      const posts = [createMockPrismaPost(), createMockPrismaPost()]
      mockPrisma.post.findMany.mockResolvedValue(posts)

      const result = await repository.findRecentPosts(5)

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
        where: { status: 'published' },
        orderBy: { createdAt: 'desc' },
        take: 5,
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
      expect(result).toHaveLength(2)
    })
  })

  describe('getTotalViews', () => {
    it('総視聴数を取得できる', async () => {
      mockPrisma.post.aggregate.mockResolvedValue({
        _sum: { viewCount: 1500 },
      })

      const result = await repository.getTotalViews()

      expect(mockPrisma.post.aggregate).toHaveBeenCalledWith({
        _sum: {
          viewCount: true,
        },
      })
      expect(result).toBe(1500)
    })

    it('視聴数がnullの場合は0を返す', async () => {
      mockPrisma.post.aggregate.mockResolvedValue({
        _sum: { viewCount: null },
      })

      const result = await repository.getTotalViews()

      expect(result).toBe(0)
    })
  })

  describe('updatePublishStatus', () => {
    it('公開ステータスを更新できる', async () => {
      const postId = uuidv4()
      mockPrisma.post.update.mockResolvedValue({})

      await repository.updatePublishStatus(postId, true)

      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: {
          status: 'published',
          publishedAt: expect.any(Date),
        },
      })
    })
  })

  describe('findAllForAdmin', () => {
    it('管理者向けに全投稿を取得できる', async () => {
      const posts = [createMockPrismaPost(), createMockPrismaPost()]
      mockPrisma.post.findMany.mockResolvedValue(posts)

      const result = await repository.findAllForAdmin()

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
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
      expect(result).toHaveLength(2)
    })
  })
})
