import { PostRepositoryImpl } from '@api/interface-adapters/repositories/PostRepositoryImpl'
import { Post } from '@api/domain/entities/Post'
import { v4 as uuidv4 } from 'uuid'

// @/lib/prismaのモック
jest.mock('@/lib/prisma', () => ({
  prisma: {
    post: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}))

// モック関数を取得
const mockPrisma = require('@/lib/prisma').prisma

describe('PostRepositoryImpl', () => {
  let repository: PostRepositoryImpl

  beforeEach(() => {
    repository = new PostRepositoryImpl()
    jest.clearAllMocks()
  })

  const createMockPost = (overrides?: Partial<Post>): Post => ({
    id: uuidv4(),
    userId: uuidv4(),
    title: 'テスト投稿',
    content: 'これはテスト投稿です',
    cosmeticName: 'テスト化粧品',
    cosmeticCategory: 'toner',
    skinType: 'normal',
    moodTag: 'love',
    fragranceType: 'floral',
    fragranceIntensity: 'medium',
    textureType: 'light',
    finishType: 'matte',
    applicationEase: 'easy',
    longevity: 'long',
    valueForMoney: 'good',
    overallRating: 5,
    repurchaseIntention: true,
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  })

  describe('create', () => {
    it('投稿を作成できる', async () => {
      const post = createMockPost()
      const mockUser = {
        id: post.userId,
        userName: 'テストユーザー',
        profileImage: null,
      }

      mockPrisma.post.create.mockResolvedValue({
        ...post,
        user: mockUser,
        _count: { empathies: 0, comments: 0 },
      })

      const result = await repository.create(post)

      expect(mockPrisma.post.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: post.id,
          userId: post.userId,
          title: post.title,
          content: post.content,
          cosmeticName: post.cosmeticName,
          cosmeticCategory: post.cosmeticCategory,
        }),
        include: {
          user: {
            select: {
              id: true,
              userName: true,
              profileImage: true,
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
      expect(result).toMatchObject({
        ...post,
        user: mockUser,
      })
    })

    it('オプショナルフィールドなしでも作成できる', async () => {
      const post = createMockPost({
        fragranceType: null,
        fragranceIntensity: null,
        textureType: null,
        finishType: null,
        applicationEase: null,
        longevity: null,
        valueForMoney: null,
        overallRating: null,
        repurchaseIntention: null,
      })

      mockPrisma.post.create.mockResolvedValue(post)

      const result = await repository.create(post)

      expect(result.fragranceType).toBeNull()
      expect(result.overallRating).toBeNull()
    })
  })

  describe('findById', () => {
    it('IDで投稿を取得できる', async () => {
      const postId = uuidv4()
      const post = createMockPost({ id: postId })
      const mockData = {
        ...post,
        user: {
          id: post.userId,
          userName: 'テストユーザー',
          profileImage: null,
        },
        _count: { empathies: 10, comments: 5 },
      }

      mockPrisma.post.findUnique.mockResolvedValue(mockData)

      const result = await repository.findById(postId)

      expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: postId },
        include: {
          user: {
            select: {
              id: true,
              userName: true,
              profileImage: true,
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
      expect(result).toEqual(mockData)
    })

    it('存在しないIDの場合nullを返す', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null)

      const result = await repository.findById(uuidv4())

      expect(result).toBeNull()
    })
  })

  describe('findByUserId', () => {
    it('ユーザーIDで投稿を取得できる', async () => {
      const userId = uuidv4()
      const posts = [createMockPost({ userId }), createMockPost({ userId })]

      mockPrisma.post.findMany.mockResolvedValue(posts)

      const result = await repository.findByUserId(userId)

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
        where: { userId, isPublished: true },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual(posts)
    })

    it('非公開投稿も含めて取得できる', async () => {
      const userId = uuidv4()
      mockPrisma.post.findMany.mockResolvedValue([])

      await repository.findByUserId(userId, { includeUnpublished: true })

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('findAll', () => {
    it('公開投稿を取得できる', async () => {
      const posts = [createMockPost(), createMockPost(), createMockPost()]

      mockPrisma.post.findMany.mockResolvedValue(posts)

      const result = await repository.findAll()

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
        where: { isPublished: true },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual(posts)
    })

    it('ページネーションが機能する', async () => {
      mockPrisma.post.findMany.mockResolvedValue([])

      await repository.findAll({ limit: 20, offset: 40 })

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
        where: { isPublished: true },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 20,
        skip: 40,
      })
    })

    it('カテゴリでフィルタリングできる', async () => {
      mockPrisma.post.findMany.mockResolvedValue([])

      await repository.findAll({ category: 'toner' })

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
        where: { isPublished: true, cosmeticCategory: 'toner' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      })
    })

    it('肌タイプでフィルタリングできる', async () => {
      mockPrisma.post.findMany.mockResolvedValue([])

      await repository.findAll({ skinType: 'dry' })

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
        where: { isPublished: true, skinType: 'dry' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      })
    })

    it('ムードタグでフィルタリングできる', async () => {
      mockPrisma.post.findMany.mockResolvedValue([])

      await repository.findAll({ moodTag: 'love' })

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
        where: { isPublished: true, moodTag: 'love' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('search', () => {
    it('キーワードで投稿を検索できる', async () => {
      const keyword = '化粧水'
      const posts = [createMockPost({ title: '化粧水のレビュー' })]

      mockPrisma.post.findMany.mockResolvedValue(posts)

      const result = await repository.search(keyword)

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
        where: {
          isPublished: true,
          OR: [
            { title: { contains: keyword } },
            { content: { contains: keyword } },
            { cosmeticName: { contains: keyword } },
          ],
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual(posts)
    })

    it('検索結果にフィルタを適用できる', async () => {
      mockPrisma.post.findMany.mockResolvedValue([])

      await repository.search('化粧水', {
        category: 'toner',
        skinType: 'dry',
        limit: 10,
      })

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
        where: {
          isPublished: true,
          cosmeticCategory: 'toner',
          skinType: 'dry',
          OR: expect.any(Array),
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
    })
  })

  describe('update', () => {
    it('投稿を更新できる', async () => {
      const postId = uuidv4()
      const updateData = {
        title: '更新されたタイトル',
        content: '更新された内容',
      }
      const updatedPost = createMockPost({ id: postId, ...updateData })

      mockPrisma.post.update.mockResolvedValue(updatedPost)

      const result = await repository.update(postId, updateData)

      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: updateData,
        include: expect.any(Object),
      })
      expect(result).toEqual(updatedPost)
    })

    it('公開ステータスを更新できる', async () => {
      const postId = uuidv4()
      mockPrisma.post.update.mockResolvedValue(createMockPost({ isPublished: false }))

      await repository.update(postId, { isPublished: false })

      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: { isPublished: false },
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

    it('存在しない投稿の削除はエラーになる', async () => {
      const error = {
        code: 'P2025',
        message: 'Record to delete does not exist',
      }
      mockPrisma.post.delete.mockRejectedValue(error)

      await expect(repository.delete(uuidv4())).rejects.toMatchObject({
        code: 'P2025',
      })
    })
  })

  describe('countPublishedPosts', () => {
    it('公開投稿数をカウントできる', async () => {
      mockPrisma.post.count.mockResolvedValue(100)

      const result = await repository.countPublishedPosts()

      expect(mockPrisma.post.count).toHaveBeenCalledWith({
        where: { isPublished: true },
      })
      expect(result).toBe(100)
    })
  })

  describe('エラーハンドリング', () => {
    it('データベースエラーを適切に伝播する', async () => {
      const dbError = new Error('Database connection failed')
      mockPrisma.post.create.mockRejectedValue(dbError)

      await expect(repository.create(createMockPost())).rejects.toThrow(
        'Database connection failed'
      )
    })
  })
})
