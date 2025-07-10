import { UserRepository } from '@api/interface-adapters/repositories/User.repository'
import { User, UserRole } from '@api/domain/entities/User'
import {
  CreateUserData,
  UpdateUserData,
  FindUsersFilter,
} from '@api/domain/repositories/UserRepository'
import { v4 as uuidv4 } from 'uuid'

// prismaのモック
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $executeRaw: jest.fn(),
  },
}))

// モックオブジェクトの参照を取得
const mockPrisma = require('@/lib/prisma').prisma

describe('User.repository', () => {
  let repository: UserRepository

  beforeEach(() => {
    repository = new UserRepository()
    jest.clearAllMocks()
  })

  const createMockPrismaUser = (overrides?: any) => ({
    id: uuidv4(),
    email: 'test@example.com',
    userName: 'testuser',
    passwordHash: '$2b$10$hashedpassword',
    emailVerified: true,
    emailVerificationToken: null,
    passwordResetToken: null,
    passwordResetExpiry: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    role: 'USER' as UserRole,
    isActive: true,
    deletedAt: null,
    birthDate: null,
    gender: null,
    skinType: 'normal',
    skinTypeOther: null,
    allergies: [],
    allergiesOther: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  })

  const createMockCreateData = (overrides?: Partial<CreateUserData>): CreateUserData => ({
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: '$2b$10$hashedpassword',
    emailVerified: false,
    emailVerificationToken: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    active: true,
    role: 'USER' as UserRole,
    deletedAt: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    ...overrides,
  })

  describe('create', () => {
    it('ユーザーを作成できる', async () => {
      const createData = createMockCreateData()
      const mockPrismaUser = createMockPrismaUser({
        email: createData.email,
        userName: createData.username,
        passwordHash: createData.passwordHash,
      })

      mockPrisma.user.create.mockResolvedValue(mockPrismaUser)

      const result = await repository.create(createData)

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          userName: createData.username,
          email: createData.email,
          passwordHash: createData.passwordHash,
          emailVerified: createData.emailVerified,
          emailVerificationToken: createData.emailVerificationToken,
          passwordResetToken: createData.passwordResetToken,
          passwordResetExpiry: createData.passwordResetExpires,
          isActive: createData.active,
          role: createData.role,
          deletedAt: createData.deletedAt,
        },
      })
      expect(result).toBeInstanceOf(User)
      expect(result.email).toBe(createData.email)
      expect(result.username).toBe(createData.username)
    })

    it('プロフィール情報付きでユーザーを作成できる', async () => {
      const createData = createMockCreateData({
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: '$2b$10$hashedpassword',
      })
      const mockPrismaUser = createMockPrismaUser({
        email: createData.email,
        userName: createData.username,
        passwordHash: createData.passwordHash,
      })

      mockPrisma.user.create.mockResolvedValue(mockPrismaUser)

      const result = await repository.create(createData)

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: createData.email,
          userName: createData.username,
          passwordHash: createData.passwordHash,
        }),
      })
      expect(result).toBeInstanceOf(User)
    })
  })

  describe('findById', () => {
    it('IDでユーザーを取得できる', async () => {
      const userId = uuidv4()
      const mockPrismaUser = createMockPrismaUser({ id: userId })

      mockPrisma.user.findUnique.mockResolvedValue(mockPrismaUser)

      const result = await repository.findById(userId)

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      })
      expect(result).toBeInstanceOf(User)
      expect(result!.id).toBe(userId)
    })

    it('削除されたユーザーも取得する（物理削除ではないため）', async () => {
      const userId = uuidv4()
      const mockPrismaUser = createMockPrismaUser({
        id: userId,
        deletedAt: new Date(),
      })

      mockPrisma.user.findUnique.mockResolvedValue(mockPrismaUser)

      const result = await repository.findById(userId)

      expect(result).toBeInstanceOf(User)
      expect(result!.deletedAt).toBeTruthy()
    })
  })

  describe('findByEmail', () => {
    it('メールアドレスでユーザーを取得できる', async () => {
      const email = 'user@example.com'
      const mockPrismaUser = createMockPrismaUser({ email })

      mockPrisma.user.findUnique.mockResolvedValue(mockPrismaUser)

      const result = await repository.findByEmail(email)

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      })
      expect(result).toBeInstanceOf(User)
      expect(result!.email).toBe(email)
    })

    it('存在しないメールアドレスの場合nullを返す', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const result = await repository.findByEmail('nonexistent@example.com')

      expect(result).toBeNull()
    })
  })

  describe('findByUsername', () => {
    it('ユーザー名でユーザーを取得できる', async () => {
      const userName = 'testuser'
      const mockPrismaUser = createMockPrismaUser({ userName })

      mockPrisma.user.findUnique.mockResolvedValue(mockPrismaUser)

      const result = await repository.findByUsername(userName)

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { userName },
      })
      expect(result).toBeInstanceOf(User)
      expect(result!.userName).toBe(userName)
    })
  })

  describe('findByEmailVerificationToken', () => {
    it('メール確認トークンでユーザーを取得できる', async () => {
      const token = 'verification-token-123'
      const mockPrismaUser = createMockPrismaUser({
        emailVerificationToken: token,
      })

      mockPrisma.user.findFirst.mockResolvedValue(mockPrismaUser)

      const result = await repository.findByEmailVerificationToken(token)

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { emailVerificationToken: token },
      })
      expect(result).toBeInstanceOf(User)
      expect(result!.emailVerificationToken).toBe(token)
    })
  })

  describe('findByPasswordResetToken', () => {
    it('パスワードリセットトークンでユーザーを取得できる', async () => {
      const token = 'reset-token-123'
      const mockPrismaUser = createMockPrismaUser({
        passwordResetToken: token,
      })

      mockPrisma.user.findFirst.mockResolvedValue(mockPrismaUser)

      const result = await repository.findByPasswordResetToken(token)

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { passwordResetToken: token },
      })
      expect(result).toBeInstanceOf(User)
      expect(result!.passwordResetToken).toBe(token)
    })
  })

  describe('update', () => {
    it('ユーザー情報を更新できる', async () => {
      const userId = uuidv4()
      const updateData: UpdateUserData = {
        userName: 'newusername',
      }
      const updatedPrismaUser = createMockPrismaUser({
        id: userId,
        userName: updateData.userName,
      })

      mockPrisma.user.update.mockResolvedValue(updatedPrismaUser)

      const result = await repository.update(userId, updateData)

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { userName: updateData.userName },
      })
      expect(result).toBeInstanceOf(User)
      expect(result.userName).toBe(updateData.userName)
    })

    it('メール確認状態を更新できる', async () => {
      const userId = uuidv4()
      const updateData: UpdateUserData = {
        emailVerified: true,
        emailVerificationToken: null,
      }
      const updatedPrismaUser = createMockPrismaUser({
        id: userId,
        emailVerified: true,
        emailVerificationToken: null,
      })

      mockPrisma.user.update.mockResolvedValue(updatedPrismaUser)

      await repository.update(userId, updateData)

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
        },
      })
    })

    it('ログイン失敗回数を更新できる', async () => {
      const userId = uuidv4()
      const updateData: UpdateUserData = {
        failedLoginAttempts: 3,
        lockedUntil: new Date(),
      }
      const updatedPrismaUser = createMockPrismaUser({
        id: userId,
        failedLoginAttempts: 3,
        lockedUntil: updateData.lockedUntil,
      })

      mockPrisma.user.update.mockResolvedValue(updatedPrismaUser)

      await repository.update(userId, updateData)

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          failedLoginAttempts: 3,
          lockedUntil: updateData.lockedUntil,
        },
      })
    })
  })

  describe('delete', () => {
    it('ユーザーを論理削除できる', async () => {
      const userId = uuidv4()
      mockPrisma.user.update.mockResolvedValue({})

      await repository.delete(userId)

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { deletedAt: expect.any(Date) },
      })
    })
  })

  describe('findMany', () => {
    it('全ユーザーを取得できる', async () => {
      const users = [createMockPrismaUser(), createMockPrismaUser()]
      const totalCount = 2

      mockPrisma.user.findMany.mockResolvedValue(users)
      mockPrisma.user.count.mockResolvedValue(totalCount)

      const filter: FindUsersFilter = {
        limit: 10,
        offset: 0,
      }

      const result = await repository.findMany(filter)

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      })
      expect(result.users).toHaveLength(2)
      expect(result.totalCount).toBe(2)
    })

    it('アクティブユーザーのみを取得できる', async () => {
      mockPrisma.user.findMany.mockResolvedValue([])
      mockPrisma.user.count.mockResolvedValue(0)

      const filter: FindUsersFilter = {
        activeOnly: true,
        limit: 10,
        offset: 0,
      }

      await repository.findMany(filter)

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          deletedAt: null,
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      })
    })

    it('ページネーションが機能する', async () => {
      mockPrisma.user.findMany.mockResolvedValue([])
      mockPrisma.user.count.mockResolvedValue(0)

      const filter: FindUsersFilter = {
        limit: 10,
        offset: 20,
      }

      await repository.findMany(filter)

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 20,
        take: 10,
        orderBy: { createdAt: 'desc' },
      })
    })

    it('ロールでフィルタリングできる', async () => {
      mockPrisma.user.findMany.mockResolvedValue([])
      mockPrisma.user.count.mockResolvedValue(0)

      const filter: FindUsersFilter = {
        role: 'ADMIN' as UserRole,
        limit: 10,
        offset: 0,
      }

      await repository.findMany(filter)

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { role: 'ADMIN' },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      })
    })

    it('検索機能が動作する', async () => {
      mockPrisma.user.findMany.mockResolvedValue([])
      mockPrisma.user.count.mockResolvedValue(0)

      const filter: FindUsersFilter = {
        search: 'test',
        limit: 10,
        offset: 0,
      }

      await repository.findMany(filter)

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { userName: { contains: 'test', mode: 'insensitive' } },
            { email: { contains: 'test', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('incrementFailedLoginAttempts', () => {
    it('ログイン失敗回数を増加できる', async () => {
      const userId = uuidv4()
      mockPrisma.$executeRaw.mockResolvedValue(1)

      await repository.incrementFailedLoginAttempts(userId)

      expect(mockPrisma.$executeRaw).toHaveBeenCalled()
    })
  })

  describe('resetFailedLoginAttempts', () => {
    it('ログイン失敗回数をリセットできる', async () => {
      const userId = uuidv4()
      mockPrisma.$executeRaw.mockResolvedValue(1)

      await repository.resetFailedLoginAttempts(userId)

      expect(mockPrisma.$executeRaw).toHaveBeenCalled()
    })
  })

  describe('lockAccount', () => {
    it('アカウントをロックできる', async () => {
      const userId = uuidv4()
      const lockUntil = new Date()
      mockPrisma.$executeRaw.mockResolvedValue(1)

      await repository.lockAccount(userId, lockUntil)

      expect(mockPrisma.$executeRaw).toHaveBeenCalled()
    })
  })

  describe('updatePassword', () => {
    it('パスワードを更新できる', async () => {
      const userId = uuidv4()
      const passwordHash = '$2b$10$newhashedpassword'
      mockPrisma.user.update.mockResolvedValue({})

      await repository.updatePassword(userId, passwordHash)

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetExpiry: null,
        },
      })
    })
  })

  describe('verifyEmail', () => {
    it('メールアドレスを確認済みにできる', async () => {
      const userId = uuidv4()
      mockPrisma.user.update.mockResolvedValue({})

      await repository.verifyEmail(userId)

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
        },
      })
    })
  })

  describe('countActiveUsers', () => {
    it('アクティブユーザー数をカウントできる', async () => {
      mockPrisma.user.count.mockResolvedValue(120)

      const result = await repository.countActiveUsers()

      expect(mockPrisma.user.count).toHaveBeenCalledWith({
        where: {
          isActive: true,
          deletedAt: null,
        },
      })
      expect(result).toBe(120)
    })
  })

  describe('findRecentUsers', () => {
    it('最近のユーザーを取得できる', async () => {
      const users = [createMockPrismaUser(), createMockPrismaUser()]
      mockPrisma.user.findMany.mockResolvedValue(users)

      const result = await repository.findRecentUsers(5)

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      })
      expect(result).toHaveLength(2)
    })
  })

  describe('findAll', () => {
    it('全ユーザーを取得できる', async () => {
      const users = [createMockPrismaUser(), createMockPrismaUser()]
      mockPrisma.user.findMany.mockResolvedValue(users)

      const result = await repository.findAll()

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toHaveLength(2)
    })
  })

  describe('findAllWithPostCount', () => {
    it('投稿数付きで全ユーザーを取得できる', async () => {
      const users = [
        { ...createMockPrismaUser(), _count: { posts: 5 } },
        { ...createMockPrismaUser(), _count: { posts: 3 } },
      ]
      mockPrisma.user.findMany.mockResolvedValue(users)

      const result = await repository.findAllWithPostCount()

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              posts: true,
            },
          },
        },
      })
      expect(result).toHaveLength(2)
    })
  })
})
