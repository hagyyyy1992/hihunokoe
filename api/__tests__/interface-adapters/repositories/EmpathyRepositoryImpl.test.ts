import { EmpathyRepositoryImpl } from '@api/interface-adapters/repositories/EmpathyRepositoryImpl'
import { PrismaClient } from '@prisma/client'
import { Empathy } from '@api/domain/entities/Empathy'
import { v4 as uuidv4 } from 'uuid'

// Prismaクライアントのモック
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    empathy: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  })),
}))

describe('EmpathyRepositoryImpl', () => {
  let repository: EmpathyRepositoryImpl
  let mockPrisma: any

  beforeEach(() => {
    mockPrisma = new PrismaClient()
    repository = new EmpathyRepositoryImpl(mockPrisma)
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('共感を作成できる', async () => {
      const empathy: Empathy = {
        id: uuidv4(),
        postId: uuidv4(),
        userId: uuidv4(),
        type: 'like',
        createdAt: new Date(),
      }

      mockPrisma.empathy.create.mockResolvedValue(empathy)

      const result = await repository.create(empathy)

      expect(mockPrisma.empathy.create).toHaveBeenCalledWith({
        data: {
          id: empathy.id,
          postId: empathy.postId,
          userId: empathy.userId,
          type: empathy.type,
        },
      })
      expect(result).toEqual(empathy)
    })

    it('異なるタイプの共感を作成できる', async () => {
      const empathyTypes = ['like', 'love', 'wow', 'sad'] as const

      for (const type of empathyTypes) {
        const empathy: Empathy = {
          id: uuidv4(),
          postId: uuidv4(),
          userId: uuidv4(),
          type,
          createdAt: new Date(),
        }

        mockPrisma.empathy.create.mockResolvedValue(empathy)

        const result = await repository.create(empathy)
        expect(result.type).toBe(type)
      }
    })

    it('ユニーク制約違反エラーを処理する', async () => {
      const error = {
        code: 'P2002',
        message: 'Unique constraint failed on the fields: (`postId`, `userId`)',
      }
      mockPrisma.empathy.create.mockRejectedValue(error)

      const empathy: Empathy = {
        id: uuidv4(),
        postId: uuidv4(),
        userId: uuidv4(),
        type: 'like',
        createdAt: new Date(),
      }

      await expect(repository.create(empathy)).rejects.toMatchObject({
        code: 'P2002',
      })
    })
  })

  describe('findById', () => {
    it('IDで共感を取得できる', async () => {
      const empathyId = uuidv4()
      const empathy = {
        id: empathyId,
        postId: uuidv4(),
        userId: uuidv4(),
        type: 'love',
        createdAt: new Date(),
      }

      mockPrisma.empathy.findUnique.mockResolvedValue(empathy)

      const result = await repository.findById(empathyId)

      expect(mockPrisma.empathy.findUnique).toHaveBeenCalledWith({
        where: { id: empathyId },
      })
      expect(result).toEqual(empathy)
    })

    it('存在しないIDの場合nullを返す', async () => {
      mockPrisma.empathy.findUnique.mockResolvedValue(null)

      const result = await repository.findById(uuidv4())

      expect(result).toBeNull()
    })
  })

  describe('findByPostIdAndUserId', () => {
    it('投稿IDとユーザーIDで共感を取得できる', async () => {
      const postId = uuidv4()
      const userId = uuidv4()
      const empathy = {
        id: uuidv4(),
        postId,
        userId,
        type: 'like',
        createdAt: new Date(),
      }

      mockPrisma.empathy.findUnique.mockResolvedValue(empathy)

      const result = await repository.findByPostIdAndUserId(postId, userId)

      expect(mockPrisma.empathy.findUnique).toHaveBeenCalledWith({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      })
      expect(result).toEqual(empathy)
    })

    it('共感が存在しない場合nullを返す', async () => {
      mockPrisma.empathy.findUnique.mockResolvedValue(null)

      const result = await repository.findByPostIdAndUserId(uuidv4(), uuidv4())

      expect(result).toBeNull()
    })
  })

  describe('findByPostId', () => {
    it('投稿IDで共感一覧を取得できる', async () => {
      const postId = uuidv4()
      const empathies = [
        {
          id: uuidv4(),
          postId,
          userId: uuidv4(),
          type: 'like',
          createdAt: new Date('2024-01-01'),
        },
        {
          id: uuidv4(),
          postId,
          userId: uuidv4(),
          type: 'love',
          createdAt: new Date('2024-01-02'),
        },
        {
          id: uuidv4(),
          postId,
          userId: uuidv4(),
          type: 'wow',
          createdAt: new Date('2024-01-03'),
        },
      ]

      mockPrisma.empathy.findMany.mockResolvedValue(empathies)

      const result = await repository.findByPostId(postId)

      expect(mockPrisma.empathy.findMany).toHaveBeenCalledWith({
        where: { postId },
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual(empathies)
      expect(result).toHaveLength(3)
    })

    it('共感がない場合空配列を返す', async () => {
      mockPrisma.empathy.findMany.mockResolvedValue([])

      const result = await repository.findByPostId(uuidv4())

      expect(result).toEqual([])
    })
  })

  describe('findByUserId', () => {
    it('ユーザーIDで共感一覧を取得できる', async () => {
      const userId = uuidv4()
      const empathies = [
        {
          id: uuidv4(),
          postId: uuidv4(),
          userId,
          type: 'like',
          createdAt: new Date(),
        },
        {
          id: uuidv4(),
          postId: uuidv4(),
          userId,
          type: 'love',
          createdAt: new Date(),
        },
      ]

      mockPrisma.empathy.findMany.mockResolvedValue(empathies)

      const result = await repository.findByUserId(userId)

      expect(mockPrisma.empathy.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual(empathies)
    })
  })

  describe('delete', () => {
    it('IDで共感を削除できる', async () => {
      const empathyId = uuidv4()
      mockPrisma.empathy.delete.mockResolvedValue({ id: empathyId })

      await repository.delete(empathyId)

      expect(mockPrisma.empathy.delete).toHaveBeenCalledWith({
        where: { id: empathyId },
      })
    })

    it('存在しない共感の削除はエラーになる', async () => {
      const error = {
        code: 'P2025',
        message: 'Record to delete does not exist',
      }
      mockPrisma.empathy.delete.mockRejectedValue(error)

      await expect(repository.delete(uuidv4())).rejects.toMatchObject({
        code: 'P2025',
      })
    })
  })

  describe('deleteByPostIdAndUserId', () => {
    it('投稿IDとユーザーIDで共感を削除できる', async () => {
      const postId = uuidv4()
      const userId = uuidv4()
      mockPrisma.empathy.delete.mockResolvedValue({ id: uuidv4() })

      await repository.deleteByPostIdAndUserId(postId, userId)

      expect(mockPrisma.empathy.delete).toHaveBeenCalledWith({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      })
    })
  })

  describe('countByPostId', () => {
    it('投稿の共感数をカウントできる', async () => {
      const postId = uuidv4()
      mockPrisma.empathy.count.mockResolvedValue(42)

      const result = await repository.countByPostId(postId)

      expect(mockPrisma.empathy.count).toHaveBeenCalledWith({
        where: { postId },
      })
      expect(result).toBe(42)
    })

    it('共感がない場合0を返す', async () => {
      mockPrisma.empathy.count.mockResolvedValue(0)

      const result = await repository.countByPostId(uuidv4())

      expect(result).toBe(0)
    })
  })

  describe('countByPostIdAndType', () => {
    it('投稿のタイプ別共感数をカウントできる', async () => {
      const postId = uuidv4()
      const type = 'love'
      mockPrisma.empathy.count.mockResolvedValue(15)

      const result = await repository.countByPostIdAndType(postId, type)

      expect(mockPrisma.empathy.count).toHaveBeenCalledWith({
        where: { postId, type },
      })
      expect(result).toBe(15)
    })
  })

  describe('getTypeCounts', () => {
    it('投稿のタイプ別共感数を取得できる', async () => {
      const postId = uuidv4()
      const groupByResult = [
        { type: 'like', _count: { type: 25 } },
        { type: 'love', _count: { type: 10 } },
        { type: 'wow', _count: { type: 5 } },
        { type: 'sad', _count: { type: 2 } },
      ]

      mockPrisma.empathy.groupBy = jest.fn().mockResolvedValue(groupByResult)

      const result = await repository.getTypeCounts(postId)

      expect(mockPrisma.empathy.groupBy).toHaveBeenCalledWith({
        by: ['type'],
        where: { postId },
        _count: { type: true },
      })
      expect(result).toEqual({
        like: 25,
        love: 10,
        wow: 5,
        sad: 2,
      })
    })

    it('共感がない場合空のオブジェクトを返す', async () => {
      mockPrisma.empathy.groupBy = jest.fn().mockResolvedValue([])

      const result = await repository.getTypeCounts(uuidv4())

      expect(result).toEqual({})
    })
  })

  describe('エラーハンドリング', () => {
    it('データベースエラーを適切に伝播する', async () => {
      const dbError = new Error('Database connection failed')
      mockPrisma.empathy.create.mockRejectedValue(dbError)

      const empathy: Empathy = {
        id: uuidv4(),
        postId: uuidv4(),
        userId: uuidv4(),
        type: 'like',
        createdAt: new Date(),
      }

      await expect(repository.create(empathy)).rejects.toThrow('Database connection failed')
    })
  })
})
