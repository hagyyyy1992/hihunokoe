import { CommentRepositoryImpl } from '@api/interface-adapters/repositories/CommentRepositoryImpl'
import { PrismaClient } from '@prisma/client'
import { Comment } from '@api/domain/entities/Comment'
import { v4 as uuidv4 } from 'uuid'

// Prismaクライアントのモック
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    comment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  })),
}))

describe('CommentRepositoryImpl', () => {
  let repository: CommentRepositoryImpl
  let mockPrisma: any

  beforeEach(() => {
    mockPrisma = new PrismaClient()
    repository = new CommentRepositoryImpl(mockPrisma)
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('コメントを作成できる', async () => {
      const comment: Comment = {
        id: uuidv4(),
        postId: uuidv4(),
        userId: uuidv4(),
        content: 'これは素晴らしい商品です！',
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockUser = {
        id: comment.userId,
        userName: 'テストユーザー',
        profileImage: null,
      }

      mockPrisma.comment.create.mockResolvedValue({
        ...comment,
        user: mockUser,
      })

      const result = await repository.create(comment)

      expect(mockPrisma.comment.create).toHaveBeenCalledWith({
        data: {
          id: comment.id,
          postId: comment.postId,
          userId: comment.userId,
          content: comment.content,
          parentId: comment.parentId,
        },
        include: {
          user: {
            select: {
              id: true,
              userName: true,
              profileImage: true,
            },
          },
        },
      })
      expect(result).toEqual({
        ...comment,
        user: mockUser,
      })
    })

    it('返信コメントを作成できる', async () => {
      const parentId = uuidv4()
      const comment: Comment = {
        id: uuidv4(),
        postId: uuidv4(),
        userId: uuidv4(),
        content: '同感です！',
        parentId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.comment.create.mockResolvedValue(comment)

      const result = await repository.create(comment)

      expect(mockPrisma.comment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          parentId,
        }),
        include: expect.any(Object),
      })
      expect(result.parentId).toBe(parentId)
    })
  })

  describe('findById', () => {
    it('IDでコメントを取得できる', async () => {
      const commentId = uuidv4()
      const comment = {
        id: commentId,
        postId: uuidv4(),
        userId: uuidv4(),
        content: 'テストコメント',
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: uuidv4(),
          userName: 'テストユーザー',
          profileImage: null,
        },
      }

      mockPrisma.comment.findUnique.mockResolvedValue(comment)

      const result = await repository.findById(commentId)

      expect(mockPrisma.comment.findUnique).toHaveBeenCalledWith({
        where: { id: commentId },
        include: {
          user: {
            select: {
              id: true,
              userName: true,
              profileImage: true,
            },
          },
        },
      })
      expect(result).toEqual(comment)
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
      const comments = [
        {
          id: uuidv4(),
          postId,
          userId: uuidv4(),
          content: 'コメント1',
          parentId: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          user: { id: uuidv4(), userName: 'ユーザー1', profileImage: null },
        },
        {
          id: uuidv4(),
          postId,
          userId: uuidv4(),
          content: 'コメント2',
          parentId: null,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          user: { id: uuidv4(), userName: 'ユーザー2', profileImage: null },
        },
      ]

      mockPrisma.comment.findMany.mockResolvedValue(comments)

      const result = await repository.findByPostId(postId)

      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith({
        where: { postId, parentId: null },
        include: {
          user: {
            select: {
              id: true,
              userName: true,
              profileImage: true,
            },
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  userName: true,
                  profileImage: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual(comments)
    })

    it('ページネーションが機能する', async () => {
      const postId = uuidv4()
      mockPrisma.comment.findMany.mockResolvedValue([])

      await repository.findByPostId(postId, { limit: 10, offset: 20 })

      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith({
        where: { postId, parentId: null },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 20,
      })
    })
  })

  describe('findByUserId', () => {
    it('ユーザーIDでコメントを取得できる', async () => {
      const userId = uuidv4()
      const comments = [
        {
          id: uuidv4(),
          postId: uuidv4(),
          userId,
          content: 'ユーザーのコメント',
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockPrisma.comment.findMany.mockResolvedValue(comments)

      const result = await repository.findByUserId(userId)

      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual(comments)
    })
  })

  describe('update', () => {
    it('コメントを更新できる', async () => {
      const commentId = uuidv4()
      const updateData = { content: '更新されたコメント' }
      const updatedComment = {
        id: commentId,
        postId: uuidv4(),
        userId: uuidv4(),
        content: updateData.content,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: uuidv4(),
          userName: 'ユーザー',
          profileImage: null,
        },
      }

      mockPrisma.comment.update.mockResolvedValue(updatedComment)

      const result = await repository.update(commentId, updateData)

      expect(mockPrisma.comment.update).toHaveBeenCalledWith({
        where: { id: commentId },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              userName: true,
              profileImage: true,
            },
          },
        },
      })
      expect(result).toEqual(updatedComment)
    })

    it('存在しないコメントの更新はエラーになる', async () => {
      const error = {
        code: 'P2025',
        message: 'Record to update not found',
      }
      mockPrisma.comment.update.mockRejectedValue(error)

      await expect(repository.update(uuidv4(), { content: '更新' })).rejects.toMatchObject({
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

    it('存在しないコメントの削除はエラーになる', async () => {
      const error = {
        code: 'P2025',
        message: 'Record to delete does not exist',
      }
      mockPrisma.comment.delete.mockRejectedValue(error)

      await expect(repository.delete(uuidv4())).rejects.toMatchObject({
        code: 'P2025',
      })
    })
  })

  describe('countByPostId', () => {
    it('投稿のコメント数をカウントできる', async () => {
      const postId = uuidv4()
      mockPrisma.comment.count.mockResolvedValue(15)

      const result = await repository.countByPostId(postId)

      expect(mockPrisma.comment.count).toHaveBeenCalledWith({
        where: { postId },
      })
      expect(result).toBe(15)
    })
  })

  describe('エラーハンドリング', () => {
    it('データベースエラーを適切に伝播する', async () => {
      const dbError = new Error('Database connection failed')
      mockPrisma.comment.create.mockRejectedValue(dbError)

      const comment: Comment = {
        id: uuidv4(),
        postId: uuidv4(),
        userId: uuidv4(),
        content: 'テスト',
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await expect(repository.create(comment)).rejects.toThrow('Database connection failed')
    })
  })
})
