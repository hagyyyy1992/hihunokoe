import { UserRepositoryImpl } from '@api/interface-adapters/repositories/UserRepositoryImpl'
import { PrismaClient } from '@prisma/client'
import { User } from '@api/domain/entities/User'
import { v4 as uuidv4 } from 'uuid'

// Prismaクライアントのモック
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  })),
}))

describe('UserRepositoryImpl', () => {
  let repository: UserRepositoryImpl
  let mockPrisma: any

  beforeEach(() => {
    mockPrisma = new PrismaClient()
    repository = new UserRepositoryImpl(mockPrisma)
    jest.clearAllMocks()
  })

  const createMockUser = (overrides?: Partial<User>): User => ({
    id: uuidv4(),
    email: 'test@example.com',
    userName: 'testuser',
    passwordHash: '$2b$10$hashedpassword',
    profileImage: null,
    bio: null,
    skinType: 'normal',
    allergies: [],
    favoriteCategories: [],
    bodyType: null,
    personalColor: null,
    age: null,
    region: null,
    isEmailVerified: true,
    emailVerificationToken: null,
    emailVerificationExpires: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    role: 'USER',
    isActive: true,
    failedLoginAttempts: 0,
    lockUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  })

  describe('create', () => {
    it('ユーザーを作成できる', async () => {
      const user = createMockUser()
      mockPrisma.user.create.mockResolvedValue(user)

      const result = await repository.create(user)

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: user.id,
          email: user.email,
          userName: user.userName,
          passwordHash: user.passwordHash,
        }),
      })
      expect(result).toEqual(user)
    })

    it('プロフィール情報付きでユーザーを作成できる', async () => {
      const user = createMockUser({
        bio: '化粧品が大好きです',
        skinType: 'dry',
        allergies: ['alcohol', 'fragrance'],
        favoriteCategories: ['skincare', 'toner'],
        bodyType: 'slim',
        personalColor: 'spring',
        age: 25,
        region: 'tokyo',
      })

      mockPrisma.user.create.mockResolvedValue(user)

      const result = await repository.create(user)

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          bio: user.bio,
          skinType: user.skinType,
          allergies: user.allergies,
          favoriteCategories: user.favoriteCategories,
          bodyType: user.bodyType,
          personalColor: user.personalColor,
          age: user.age,
          region: user.region,
        }),
      })
      expect(result.allergies).toEqual(['alcohol', 'fragrance'])
    })
  })

  describe('findById', () => {
    it('IDでユーザーを取得できる', async () => {
      const userId = uuidv4()
      const user = createMockUser({ id: userId })

      mockPrisma.user.findUnique.mockResolvedValue(user)

      const result = await repository.findById(userId)

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      })
      expect(result).toEqual(user)
    })

    it('削除されたユーザーは取得しない', async () => {
      const userId = uuidv4()
      const deletedUser = createMockUser({
        id: userId,
        deletedAt: new Date(),
      })

      mockPrisma.user.findUnique.mockResolvedValue(deletedUser)

      const result = await repository.findById(userId)

      expect(result).toBeNull()
    })
  })

  describe('findByEmail', () => {
    it('メールアドレスでユーザーを取得できる', async () => {
      const email = 'user@example.com'
      const user = createMockUser({ email })

      mockPrisma.user.findFirst.mockResolvedValue(user)

      const result = await repository.findByEmail(email)

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email,
          deletedAt: null,
        },
      })
      expect(result).toEqual(user)
    })

    it('大文字小文字を区別しない', async () => {
      const user = createMockUser({ email: 'user@example.com' })
      mockPrisma.user.findFirst.mockResolvedValue(user)

      const result = await repository.findByEmail('USER@EXAMPLE.COM')

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'user@example.com',
          deletedAt: null,
        },
      })
      expect(result).toEqual(user)
    })
  })

  describe('findByUserName', () => {
    it('ユーザー名でユーザーを取得できる', async () => {
      const userName = 'testuser'
      const user = createMockUser({ userName })

      mockPrisma.user.findFirst.mockResolvedValue(user)

      const result = await repository.findByUserName(userName)

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          userName,
          deletedAt: null,
        },
      })
      expect(result).toEqual(user)
    })
  })

  describe('findByEmailVerificationToken', () => {
    it('メール確認トークンでユーザーを取得できる', async () => {
      const token = 'verification-token-123'
      const user = createMockUser({
        emailVerificationToken: token,
        emailVerificationExpires: new Date(Date.now() + 3600000),
      })

      mockPrisma.user.findFirst.mockResolvedValue(user)

      const result = await repository.findByEmailVerificationToken(token)

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          emailVerificationToken: token,
          emailVerificationExpires: { gt: expect.any(Date) },
          deletedAt: null,
        },
      })
      expect(result).toEqual(user)
    })

    it('期限切れトークンの場合nullを返す', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null)

      const result = await repository.findByEmailVerificationToken('expired-token')

      expect(result).toBeNull()
    })
  })

  describe('findByPasswordResetToken', () => {
    it('パスワードリセットトークンでユーザーを取得できる', async () => {
      const token = 'reset-token-123'
      const user = createMockUser({
        passwordResetToken: token,
        passwordResetExpires: new Date(Date.now() + 3600000),
      })

      mockPrisma.user.findFirst.mockResolvedValue(user)

      const result = await repository.findByPasswordResetToken(token)

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          passwordResetToken: token,
          passwordResetExpires: { gt: expect.any(Date) },
          deletedAt: null,
        },
      })
      expect(result).toEqual(user)
    })
  })

  describe('update', () => {
    it('ユーザー情報を更新できる', async () => {
      const userId = uuidv4()
      const updateData = {
        userName: 'newusername',
        bio: '新しい自己紹介',
      }
      const updatedUser = createMockUser({ id: userId, ...updateData })

      mockPrisma.user.update.mockResolvedValue(updatedUser)

      const result = await repository.update(userId, updateData)

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
      })
      expect(result).toEqual(updatedUser)
    })

    it('メール確認状態を更新できる', async () => {
      const userId = uuidv4()
      const updateData = {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      }

      mockPrisma.user.update.mockResolvedValue(createMockUser({ id: userId }))

      await repository.update(userId, updateData)

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
      })
    })

    it('ログイン失敗回数を更新できる', async () => {
      const userId = uuidv4()
      mockPrisma.user.update.mockResolvedValue(createMockUser({ id: userId }))

      await repository.update(userId, {
        failedLoginAttempts: 3,
        lockUntil: new Date(Date.now() + 900000), // 15分後
      })

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: expect.objectContaining({
          failedLoginAttempts: 3,
          lockUntil: expect.any(Date),
        }),
      })
    })
  })

  describe('delete', () => {
    it('ユーザーを物理削除できる', async () => {
      const userId = uuidv4()
      mockPrisma.user.delete.mockResolvedValue({ id: userId })

      await repository.delete(userId)

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      })
    })
  })

  describe('softDelete', () => {
    it('ユーザーを論理削除できる', async () => {
      const userId = uuidv4()
      const softDeletedUser = createMockUser({
        id: userId,
        deletedAt: new Date(),
      })

      mockPrisma.user.update.mockResolvedValue(softDeletedUser)

      await repository.softDelete(userId)

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { deletedAt: expect.any(Date) },
      })
    })
  })

  describe('findAll', () => {
    it('全ユーザーを取得できる', async () => {
      const users = [createMockUser(), createMockUser(), createMockUser()]

      mockPrisma.user.findMany.mockResolvedValue(users)

      const result = await repository.findAll()

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual(users)
    })

    it('管理者のみを取得できる', async () => {
      mockPrisma.user.findMany.mockResolvedValue([])

      await repository.findAll({ role: 'ADMIN' })

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          role: 'ADMIN',
        },
        orderBy: { createdAt: 'desc' },
      })
    })

    it('ページネーションが機能する', async () => {
      mockPrisma.user.findMany.mockResolvedValue([])

      await repository.findAll({ limit: 10, offset: 20 })

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 20,
      })
    })
  })

  describe('count', () => {
    it('ユーザー数をカウントできる', async () => {
      mockPrisma.user.count.mockResolvedValue(150)

      const result = await repository.count()

      expect(mockPrisma.user.count).toHaveBeenCalledWith({
        where: { deletedAt: null },
      })
      expect(result).toBe(150)
    })

    it('アクティブユーザー数をカウントできる', async () => {
      mockPrisma.user.count.mockResolvedValue(120)

      const result = await repository.count({ isActive: true })

      expect(mockPrisma.user.count).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          isActive: true,
        },
      })
      expect(result).toBe(120)
    })
  })

  describe('エラーハンドリング', () => {
    it('一意制約違反エラーを処理する', async () => {
      const error = {
        code: 'P2002',
        message: 'Unique constraint failed on the fields: (`email`)',
      }
      mockPrisma.user.create.mockRejectedValue(error)

      await expect(repository.create(createMockUser())).rejects.toMatchObject({
        code: 'P2002',
      })
    })

    it('データベースエラーを適切に伝播する', async () => {
      const dbError = new Error('Database connection failed')
      mockPrisma.user.findUnique.mockRejectedValue(dbError)

      await expect(repository.findById(uuidv4())).rejects.toThrow('Database connection failed')
    })
  })
})
