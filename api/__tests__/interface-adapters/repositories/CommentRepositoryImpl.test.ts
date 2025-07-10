import { CommentRepository } from '@api/interface-adapters/repositories/Comment.repository'
import { Comment } from '@api/domain/entities/Comment'
import { v4 as uuidv4 } from 'uuid'

// prismaモジュールのモック
jest.mock('@/lib/prisma', () => ({
  prisma: {
    comment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}))

// モックオブジェクトの参照を取得
const mockPrisma = require('@/lib/prisma').prisma

describe('Comment.repository', () => {
  let repository: CommentRepository

  beforeEach(() => {
    repository = new CommentRepository()
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('コメントを作成できる', async () => {
      const postId = uuidv4()
      const userId = uuidv4()
      const content = 'これは素晴らしい商品です！'
      const parentCommentId = null

      const mockPrismaComment = {
        id: uuidv4(),
        postId,
        userId,
        content,
        parentCommentId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.comment.create.mockResolvedValue(mockPrismaComment)

      const result = await repository.create(postId, userId, content, parentCommentId)

      expect(mockPrisma.comment.create).toHaveBeenCalledWith({
        data: {
          postId,
          userId,
          content,
          parentCommentId: null,
          isActive: true,
        },
      })
      expect(result).toBeInstanceOf(Comment)
      expect(result.postId).toBe(postId)
      expect(result.userId).toBe(userId)
      expect(result.content).toBe(content)
    })

    it('返信コメントを作成できる', async () => {
      const postId = uuidv4()
      const userId = uuidv4()
      const content = '同感です！'
      const parentCommentId = uuidv4()

      const mockPrismaComment = {
        id: uuidv4(),
        postId,
        userId,
        content,
        parentCommentId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.comment.create.mockResolvedValue(mockPrismaComment)

      const result = await repository.create(postId, userId, content, parentCommentId)

      expect(mockPrisma.comment.create).toHaveBeenCalledWith({
        data: {
          postId,
          userId,
          content,
          parentCommentId,
          isActive: true,
        },
      })
      expect(result.parentCommentId).toBe(parentCommentId)
    })
  })

  describe('findById', () => {
    it('IDでコメントを取得できる', async () => {
      const commentId = uuidv4()
      const mockPrismaComment = {
        id: commentId,
        postId: uuidv4(),
        userId: uuidv4(),
        content: 'テストコメント',
        parentCommentId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.comment.findUnique.mockResolvedValue(mockPrismaComment)

      const result = await repository.findById(commentId)

      expect(mockPrisma.comment.findUnique).toHaveBeenCalledWith({
        where: { id: commentId },
      })
      expect(result).toBeInstanceOf(Comment)
      expect(result!.id).toBe(commentId)
    })

    it('存在しないIDの場合nullを返す', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(null)

      const result = await repository.findById(uuidv4())

      expect(result).toBeNull()
    })
  })

  describe('findByPostId', () => {
    it('投稿IDでコメントを取得できる', async () => {
      const postId = uuidv4()
      const mockPrismaComments = [
        {
          id: uuidv4(),
          postId,
          userId: uuidv4(),
          content: 'コメント1',
          parentCommentId: null,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: uuidv4(),
          postId,
          userId: uuidv4(),
          content: 'コメント2',
          parentCommentId: null,
          isActive: true,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
      ]

      mockPrisma.comment.findMany.mockResolvedValue(mockPrismaComments)

      const result = await repository.findByPostId(postId)

      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith({
        where: {
          postId,
          isActive: true,
        },
        orderBy: { createdAt: 'asc' },
      })
      expect(result).toHaveLength(2)
      expect(result[0]).toBeInstanceOf(Comment)
    })

    it('ページネーションが機能する', async () => {
      const postId = uuidv4()
      mockPrisma.comment.findMany.mockResolvedValue([])

      await repository.findByPostIdWithPagination(postId, 20, 10)

      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith({
        where: {
          postId,
          isActive: true,
          parentCommentId: null,
        },
        orderBy: { createdAt: 'desc' },
        skip: 20,
        take: 10,
      })
    })
  })

  describe('findRepliesByParentId', () => {
    it('親コメントの返信を取得できる', async () => {
      const parentCommentId = uuidv4()
      const mockReplies = [
        {
          id: uuidv4(),
          postId: uuidv4(),
          userId: uuidv4(),
          content: '返信コメント',
          parentCommentId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockPrisma.comment.findMany.mockResolvedValue(mockReplies)

      const result = await repository.findRepliesByParentId(parentCommentId)

      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith({
        where: {
          parentCommentId,
          isActive: true,
        },
        orderBy: { createdAt: 'asc' },
      })
      expect(result).toHaveLength(1)
      expect(result[0]).toBeInstanceOf(Comment)
    })
  })

  describe('update', () => {
    it('コメントを更新できる', async () => {
      const commentId = uuidv4()
      const content = '更新されたコメント'
      const updatedPrismaComment = {
        id: commentId,
        postId: uuidv4(),
        userId: uuidv4(),
        content,
        parentCommentId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.comment.update.mockResolvedValue(updatedPrismaComment)

      const result = await repository.update(commentId, content)

      expect(mockPrisma.comment.update).toHaveBeenCalledWith({
        where: { id: commentId },
        data: {
          content,
          updatedAt: expect.any(Date),
        },
      })
      expect(result).toBeInstanceOf(Comment)
      expect(result!.content).toBe(content)
    })

    it('存在しないコメントの更新はエラーになる', async () => {
      const error = {
        code: 'P2025',
        message: 'Record to update not found',
      }
      mockPrisma.comment.update.mockRejectedValue(error)

      await expect(repository.update(uuidv4(), '更新')).rejects.toMatchObject({
        code: 'P2025',
      })
    })
  })

  describe('delete', () => {
    it('コメントを削除できる', async () => {
      const commentId = uuidv4()
      mockPrisma.comment.delete.mockResolvedValue({ id: commentId })

      await repository.delete(commentId)

      expect(mockPrisma.comment.delete).toHaveBeenCalledWith({
        where: { id: commentId },
      })
    })

    it('存在しないコメントの削除はfalseを返す', async () => {
      const error = {
        code: 'P2025',
        message: 'Record to delete does not exist',
      }
      mockPrisma.comment.delete.mockRejectedValue(error)

      const result = await repository.delete(uuidv4())

      expect(result).toBe(false)
    })
  })

  describe('countByPostId', () => {
    it('投稿のコメント数をカウントできる', async () => {
      const postId = uuidv4()
      mockPrisma.comment.count.mockResolvedValue(15)

      const result = await repository.countByPostId(postId)

      expect(mockPrisma.comment.count).toHaveBeenCalledWith({
        where: {
          postId,
          isActive: true,
          parentCommentId: null,
        },
      })
      expect(result).toBe(15)
    })
  })

  describe('エラーハンドリング', () => {
    it('データベースエラーを適切に伝播する', async () => {
      const dbError = new Error('Database connection failed')
      mockPrisma.comment.create.mockRejectedValue(dbError)

      const postId = uuidv4()
      const userId = uuidv4()
      const content = 'テスト'

      await expect(repository.create(postId, userId, content)).rejects.toThrow(
        'Database connection failed'
      )
    })
  })
})
