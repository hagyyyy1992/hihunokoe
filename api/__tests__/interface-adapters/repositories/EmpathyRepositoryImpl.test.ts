import { EmpathyRepositoryImpl } from '@api/interface-adapters/repositories/EmpathyRepositoryImpl'
import { CreateEmpathyData } from '@api/domain/repositories/EmpathyRepository'
import { v4 as uuidv4 } from 'uuid'

// @/lib/prismaのモック
jest.mock('@/lib/prisma', () => ({
  prisma: {
    empathy: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

// モック関数を取得
const mockPrisma = require('@/lib/prisma').prisma

describe('EmpathyRepositoryImpl', () => {
  let repository: EmpathyRepositoryImpl

  beforeEach(() => {
    repository = new EmpathyRepositoryImpl()
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('共感を作成できる', async () => {
      const empathy: CreateEmpathyData = {
        userId: uuidv4(),
        postId: uuidv4(),
        empathyType: 'helpful',
      }

      const createdEmpathy = {
        id: uuidv4(),
        ...empathy,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.empathy.create.mockResolvedValue(createdEmpathy)

      const result = await repository.create(empathy)

      expect(mockPrisma.empathy.create).toHaveBeenCalledWith({
        data: {
          userId: empathy.userId,
          postId: empathy.postId,
          empathyType: empathy.empathyType,
        },
      })
      expect(result.id).toBe(createdEmpathy.id)
      expect(result.userId).toBe(empathy.userId)
      expect(result.postId).toBe(empathy.postId)
      expect(result.empathyType).toBe(empathy.empathyType)
    })

    it('異なるタイプの共感を作成できる', async () => {
      const empathy: CreateEmpathyData = {
        userId: uuidv4(),
        postId: uuidv4(),
        empathyType: 'interested',
      }

      const createdEmpathy = {
        id: uuidv4(),
        ...empathy,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.empathy.create.mockResolvedValue(createdEmpathy)

      const result = await repository.create(empathy)

      expect(result.empathyType).toBe('interested')
    })

    it('ユニーク制約違反エラーを処理する', async () => {
      const empathy: CreateEmpathyData = {
        userId: uuidv4(),
        postId: uuidv4(),
        empathyType: 'helpful',
      }

      const error = {
        code: 'P2002',
        message: 'Unique constraint failed',
      }

      mockPrisma.empathy.create.mockRejectedValue(error)

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
        userId: uuidv4(),
        postId: uuidv4(),
        empathyType: 'helpful',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.empathy.findUnique.mockResolvedValue(empathy)

      const result = await repository.findById(empathyId)

      expect(mockPrisma.empathy.findUnique).toHaveBeenCalledWith({
        where: { id: empathyId },
      })
      expect(result).toBeDefined()
      expect(result?.id).toBe(empathyId)
    })

    it('存在しないIDの場合nullを返す', async () => {
      mockPrisma.empathy.findUnique.mockResolvedValue(null)

      const result = await repository.findById(uuidv4())

      expect(result).toBeNull()
    })
  })

  describe('findByUserAndPost', () => {
    it('ユーザーIDと投稿IDで共感を取得できる', async () => {
      const userId = uuidv4()
      const postId = uuidv4()
      const empathy = {
        id: uuidv4(),
        userId,
        postId,
        empathyType: 'helpful',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.empathy.findFirst.mockResolvedValue(empathy)

      const result = await repository.findByUserAndPost(userId, postId)

      expect(mockPrisma.empathy.findFirst).toHaveBeenCalledWith({
        where: {
          userId,
          postId,
        },
      })
      expect(result).toBeDefined()
      expect(result?.userId).toBe(userId)
      expect(result?.postId).toBe(postId)
    })

    it('共感が存在しない場合nullを返す', async () => {
      mockPrisma.empathy.findFirst.mockResolvedValue(null)

      const result = await repository.findByUserAndPost(uuidv4(), uuidv4())

      expect(result).toBeNull()
    })
  })

  describe('findByPost', () => {
    it('投稿IDで共感一覧を取得できる', async () => {
      const postId = uuidv4()
      const empathies = [
        {
          id: uuidv4(),
          userId: uuidv4(),
          postId,
          empathyType: 'helpful',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          userId: uuidv4(),
          postId,
          empathyType: 'interested',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockPrisma.empathy.findMany.mockResolvedValue(empathies)

      const result = await repository.findByPost(postId)

      expect(mockPrisma.empathy.findMany).toHaveBeenCalledWith({
        where: { postId },
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toHaveLength(2)
      expect(result[0].postId).toBe(postId)
    })

    it('共感がない場合空配列を返す', async () => {
      mockPrisma.empathy.findMany.mockResolvedValue([])

      const result = await repository.findByPost(uuidv4())

      expect(result).toEqual([])
    })
  })

  describe('findByUser', () => {
    it('ユーザーIDで共感一覧を取得できる', async () => {
      const userId = uuidv4()
      const empathies = [
        {
          id: uuidv4(),
          userId,
          postId: uuidv4(),
          empathyType: 'helpful',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          userId,
          postId: uuidv4(),
          empathyType: 'interested',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockPrisma.empathy.findMany.mockResolvedValue(empathies)

      const result = await repository.findByUser(userId)

      expect(mockPrisma.empathy.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toHaveLength(2)
      expect(result[0].userId).toBe(userId)
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

  describe('countByPost', () => {
    it('投稿の共感数をカウントできる', async () => {
      const postId = uuidv4()
      mockPrisma.empathy.count.mockResolvedValue(42)

      const result = await repository.countByPost(postId)

      expect(mockPrisma.empathy.count).toHaveBeenCalledWith({
        where: { postId },
      })
      expect(result).toBe(42)
    })

    it('共感がない場合0を返す', async () => {
      mockPrisma.empathy.count.mockResolvedValue(0)

      const result = await repository.countByPost(uuidv4())

      expect(result).toBe(0)
    })
  })

  describe('countByUser', () => {
    it('ユーザーの共感数をカウントできる', async () => {
      const userId = uuidv4()
      mockPrisma.empathy.count.mockResolvedValue(15)

      const result = await repository.countByUser(userId)

      expect(mockPrisma.empathy.count).toHaveBeenCalledWith({
        where: { userId },
      })
      expect(result).toBe(15)
    })
  })

  describe('countTotal', () => {
    it('全ての共感数をカウントできる', async () => {
      mockPrisma.empathy.count.mockResolvedValue(1500)

      const result = await repository.countTotal()

      expect(mockPrisma.empathy.count).toHaveBeenCalledWith()
      expect(result).toBe(1500)
    })
  })

  describe('エラーハンドリング', () => {
    it('データベースエラーを適切に伝播する', async () => {
      const dbError = new Error('Database connection failed')
      mockPrisma.empathy.create.mockRejectedValue(dbError)

      const empathy: CreateEmpathyData = {
        userId: uuidv4(),
        postId: uuidv4(),
        empathyType: 'helpful',
      }

      await expect(repository.create(empathy)).rejects.toThrow('Database connection failed')
    })
  })
})
