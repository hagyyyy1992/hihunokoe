import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { UserRole, SkinType, Gender, AllergyType, Prisma } from '@prisma/client'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { MOCK_USERS } from '@/lib/mock-data'
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  registerUser,
  loginUser,
  getUserById,
  deleteUserAccount,
  isAdmin,
  isSuperAdmin,
  logAdminAction,
  authenticateRequest,
} from '@/lib/auth/auth'

// Mock dependencies
jest.mock('bcryptjs')
jest.mock('jsonwebtoken')
jest.mock('@/lib/mock-data')
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    adminLog: {
      create: jest.fn(),
    },
  },
  isDatabaseAvailable: jest.fn(),
}))

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>
const mockedJwt = jwt as jest.Mocked<typeof jwt>
const mockedPrisma = prisma as jest.Mocked<typeof prisma>
const mockedIsDatabaseAvailable = isDatabaseAvailable as jest.MockedFunction<
  typeof isDatabaseAvailable
>

// Type assertion to ensure mockedPrisma is not null
beforeAll(() => {
  if (!mockedPrisma) {
    throw new Error('mockedPrisma is null')
  }
})

// Mock MOCK_USERS
const mockUsers = [
  {
    id: 'mock-user-1',
    userName: 'mockuser',
    email: 'mock@example.com',
    role: UserRole.USER,
    isActive: true,
    skinType: SkinType.normal,
  },
  {
    id: 'admin-1',
    userName: 'admin',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    isActive: true,
    skinType: null,
  },
]

// Mock MOCK_USERS with proper typing
const mockFindFunction = jest.fn()
Object.defineProperty(MOCK_USERS, 'find', {
  value: mockFindFunction,
  writable: true,
  configurable: true,
})

// Set up environment
process.env.JWT_SECRET = 'test-secret'

describe('auth.ts - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedIsDatabaseAvailable.mockReturnValue(true)
  })

  describe('hashPassword', () => {
    it('should hash password correctly', async () => {
      const password = 'testpassword'
      const hashedPassword = 'hashed123'
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never)

      const result = await hashPassword(password)

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 12)
      expect(result).toBe(hashedPassword)
    })
  })

  describe('verifyPassword', () => {
    it('should verify password correctly', async () => {
      const password = 'testpassword'
      const hashedPassword = 'hashed123'
      mockedBcrypt.compare.mockResolvedValue(true as never)

      const result = await verifyPassword(password, hashedPassword)

      expect(result).toBe(true)
    })

    it('should return false for incorrect password', async () => {
      const password = 'testpassword'
      const hashedPassword = 'hashed123'
      mockedBcrypt.compare.mockResolvedValue(false as never)

      const result = await verifyPassword(password, hashedPassword)

      expect(result).toBe(false)
    })
  })

  describe('generateToken', () => {
    it('should generate JWT token correctly', () => {
      const user = {
        id: 'user-1',
        userName: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
      }
      const token = 'generated-jwt-token'
      mockedJwt.sign.mockReturnValue(token as never)

      const result = generateToken(user)

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        {
          id: user.id,
          userName: user.userName,
          email: user.email,
          role: user.role,
        },
        'test-secret',
        { expiresIn: '7d' }
      )
      expect(result).toBe(token)
    })
  })

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const token = 'valid-token'
      const decoded = {
        id: 'user-1',
        userName: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
      }
      mockedJwt.verify.mockReturnValue(decoded as never)

      const result = verifyToken(token)

      expect(result).toEqual(decoded)
    })

    it('should return null for invalid token', () => {
      const token = 'invalid-token'
      mockedJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const result = verifyToken(token)

      expect(result).toBeNull()
    })
  })

  describe('registerUser', () => {
    const registerData = {
      userName: 'newuser',
      email: 'new@example.com',
      password: 'password123',
      birthDate: new Date('1990-01-01'),
      gender: Gender.male,
      skinType: SkinType.normal,
      allergies: [AllergyType.fragrance],
    }

    beforeEach(() => {
      mockedBcrypt.hash.mockResolvedValue('hashed-password' as never)
      mockFindFunction.mockReturnValue(undefined)
    })

    it('should throw error if email conflicts with mock user', async () => {
      mockFindFunction.mockReturnValue(mockUsers[0])

      await expect(registerUser(registerData)).rejects.toThrow(
        'このメールアドレスまたはユーザー名は既に使用されています（デモユーザー）'
      )
    })

    it('should throw error if username conflicts with mock user', async () => {
      mockFindFunction.mockReturnValue(mockUsers[0])

      await expect(registerUser(registerData)).rejects.toThrow(
        'このメールアドレスまたはユーザー名は既に使用されています（デモユーザー）'
      )
    })

    it('should throw error when database is not available', async () => {
      mockedIsDatabaseAvailable.mockReturnValue(false)

      await expect(registerUser(registerData)).rejects.toThrow(
        '現在、新規登録は制限されています。デモ用ログイン情報をご利用ください。'
      )
    })

    it('should throw error if active user exists', async () => {
      ;(mockedPrisma!.user.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-user',
        email: registerData.email,
        isActive: true,
        deletedAt: null,
      } as unknown)

      await expect(registerUser(registerData)).rejects.toThrow(
        'ユーザー名またはメールアドレスが既に使用されています'
      )
    })

    it('should create new user successfully', async () => {
      const newUser = {
        id: 'new-user-id',
        userName: registerData.userName,
        email: registerData.email,
        role: UserRole.USER,
        birthDate: registerData.birthDate,
        gender: registerData.gender,
        skinType: registerData.skinType,
        allergies: registerData.allergies,
        emailVerified: false,
      }

      ;(mockedPrisma!.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(mockedPrisma!.user.create as jest.Mock).mockResolvedValue(newUser as unknown)

      const result = await registerUser(registerData)

      expect(result).toEqual({
        id: newUser.id,
        userName: newUser.userName,
        email: newUser.email,
        role: newUser.role,
        birthDate: newUser.birthDate,
        gender: newUser.gender,
        skinType: newUser.skinType,
        skinTypeOther: undefined,
        allergies: newUser.allergies,
        allergiesOther: undefined,
        emailVerified: newUser.emailVerified,
      })
    })

    it('should restore deleted user', async () => {
      const deletedUser = {
        id: 'deleted-user-id',
        userName: 'deleted_user',
        email: registerData.email,
        isActive: false,
        deletedAt: new Date(),
      }

      const restoredUser = {
        id: deletedUser.id,
        userName: registerData.userName,
        email: registerData.email,
        role: UserRole.USER,
        isActive: true,
        deletedAt: null,
        emailVerified: false,
      }

      ;(mockedPrisma!.user.findFirst as jest.Mock)
        .mockResolvedValueOnce(null) // No active user
        .mockResolvedValueOnce(deletedUser as unknown) // Find deleted user
      ;(mockedPrisma!.user.findUnique as jest.Mock).mockResolvedValue(deletedUser as unknown) // User still exists
      ;(mockedPrisma!.user.update as jest.Mock).mockResolvedValue(restoredUser as unknown)

      const result = await registerUser(registerData)

      expect(mockedPrisma!.user.update as jest.Mock).toHaveBeenCalledWith({
        where: { id: deletedUser.id },
        data: expect.objectContaining({
          userName: registerData.userName,
          email: registerData.email,
          isActive: true,
          deletedAt: null,
        }),
      })
      expect(result.id).toBe(deletedUser.id)
    })

    it('should fallback to create if deleted user no longer exists', async () => {
      const deletedUser = {
        id: 'deleted-user-id',
        userName: 'deleted_user',
        email: registerData.email,
        isActive: false,
        deletedAt: new Date(),
      }

      const newUser = {
        id: 'new-user-id',
        userName: registerData.userName,
        email: registerData.email,
        role: UserRole.USER,
        emailVerified: false,
      }

      ;(mockedPrisma!.user.findFirst as jest.Mock)
        .mockResolvedValueOnce(null) // No active user
        .mockResolvedValueOnce(deletedUser as unknown) // Find deleted user
      ;(mockedPrisma!.user.findUnique as jest.Mock).mockResolvedValue(null) // User no longer exists
      ;(mockedPrisma!.user.create as jest.Mock).mockResolvedValue(newUser as unknown)

      const result = await registerUser(registerData)

      expect(mockedPrisma!.user.create as jest.Mock).toHaveBeenCalled()
      expect(result.id).toBe(newUser.id)
    })

    it('should throw error on database error', async () => {
      ;(mockedPrisma!.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(mockedPrisma!.user.create as jest.Mock).mockRejectedValue(new Error('Database error'))

      await expect(registerUser(registerData)).rejects.toThrow('ユーザー登録に失敗しました')
    })
  })

  describe('loginUser', () => {
    const credentials = {
      email: 'test@example.com',
      password: 'password123',
    }

    it('should login with database user', async () => {
      const dbUser = {
        id: 'db-user-id',
        userName: 'dbuser',
        email: credentials.email,
        passwordHash: 'hashed-password',
        role: UserRole.USER,
        isActive: true,
        deletedAt: null,
        emailVerified: true,
      }

      ;(mockedPrisma!.user.findUnique as jest.Mock).mockResolvedValue(dbUser as unknown)
      mockedBcrypt.compare.mockResolvedValue(true as never)

      const result = await loginUser(credentials)

      expect(result).toEqual({
        id: dbUser.id,
        userName: dbUser.userName,
        email: dbUser.email,
        role: dbUser.role,
        birthDate: undefined,
        gender: undefined,
        skinType: undefined,
        skinTypeOther: undefined,
        allergies: undefined,
        allergiesOther: undefined,
        emailVerified: dbUser.emailVerified,
      })
    })

    it('should return null for incorrect password', async () => {
      const dbUser = {
        id: 'db-user-id',
        email: credentials.email,
        passwordHash: 'hashed-password',
        isActive: true,
        deletedAt: null,
      }

      ;(mockedPrisma!.user.findUnique as jest.Mock).mockResolvedValue(dbUser as unknown)
      mockedBcrypt.compare.mockResolvedValue(false as never)

      const result = await loginUser(credentials)

      expect(result).toBeNull()
    })

    it('should return null for inactive user', async () => {
      const dbUser = {
        id: 'db-user-id',
        email: credentials.email,
        isActive: false,
        deletedAt: new Date(),
      }

      ;(mockedPrisma!.user.findUnique as jest.Mock).mockResolvedValue(dbUser as unknown)

      const result = await loginUser(credentials)

      expect(result).toBeNull()
    })

    it('should fallback to mock user when database error', async () => {
      ;(mockedPrisma!.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))
      mockFindFunction.mockReturnValue({
        ...mockUsers[0],
        email: credentials.email,
        isActive: true,
      })

      const result = await loginUser({
        ...credentials,
        password: 'demo1234',
      })

      expect(result).toEqual({
        id: mockUsers[0].id,
        userName: mockUsers[0].userName,
        email: credentials.email,
        role: mockUsers[0].role,
        skinType: mockUsers[0].skinType,
        emailVerified: true,
      })
    })

    it('should login with mock user when database unavailable', async () => {
      mockedIsDatabaseAvailable.mockReturnValue(false)
      mockFindFunction.mockReturnValue({
        ...mockUsers[0],
        email: credentials.email,
        isActive: true,
      })

      const result = await loginUser({
        ...credentials,
        password: 'demo1234',
      })

      expect(result).toEqual({
        id: mockUsers[0].id,
        userName: mockUsers[0].userName,
        email: credentials.email,
        role: mockUsers[0].role,
        skinType: mockUsers[0].skinType,
        emailVerified: true,
      })
    })

    it('should return null for non-existent user', async () => {
      ;(mockedPrisma!.user.findUnique as jest.Mock).mockResolvedValue(null)
      mockFindFunction.mockReturnValue(undefined)

      const result = await loginUser(credentials)

      expect(result).toBeNull()
    })
  })

  describe('getUserById', () => {
    it('should get user from database with valid UUID', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const dbUser = {
        id: userId,
        userName: 'dbuser',
        email: 'db@example.com',
        role: UserRole.USER,
        isActive: true,
        deletedAt: null,
        emailVerified: true,
      }

      ;(mockedPrisma!.user.findUnique as jest.Mock).mockResolvedValue(dbUser as unknown)

      const result = await getUserById(userId)

      expect(result).toEqual({
        id: dbUser.id,
        userName: dbUser.userName,
        email: dbUser.email,
        role: dbUser.role,
        birthDate: undefined,
        gender: undefined,
        skinType: undefined,
        skinTypeOther: undefined,
        allergies: undefined,
        allergiesOther: undefined,
        emailVerified: dbUser.emailVerified,
      })
    })

    it('should fallback to mock user with invalid UUID', async () => {
      const userId = 'mock-user-1'
      mockFindFunction.mockReturnValue({
        ...mockUsers[0],
        id: userId,
        isActive: true,
      })

      const result = await getUserById(userId)

      expect(result).toEqual({
        id: mockUsers[0].id,
        userName: mockUsers[0].userName,
        email: mockUsers[0].email,
        role: mockUsers[0].role,
        skinType: mockUsers[0].skinType,
        emailVerified: true,
      })
    })

    it('should return null when user not found in database or mock', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      ;(mockedPrisma!.user.findUnique as jest.Mock).mockResolvedValue(null)
      mockFindFunction.mockReturnValue(undefined)

      const result = await getUserById(userId)

      expect(result).toBeNull()
    })

    it('should fallback to mock user when database error', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      ;(mockedPrisma!.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))
      mockFindFunction.mockReturnValue({
        ...mockUsers[0],
        id: userId,
        isActive: true,
      })

      const result = await getUserById(userId)

      expect(result).toEqual({
        id: userId,
        userName: mockUsers[0].userName,
        email: mockUsers[0].email,
        role: mockUsers[0].role,
        skinType: mockUsers[0].skinType,
        emailVerified: true,
      })
    })

    it('should return null when database unavailable', async () => {
      mockedIsDatabaseAvailable.mockReturnValue(false)
      mockFindFunction.mockReturnValue(undefined)

      const result = await getUserById('invalid-id')

      expect(result).toBeNull()
    })
  })

  describe('deleteUserAccount', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000'

    it('should throw error when database unavailable', async () => {
      mockedIsDatabaseAvailable.mockReturnValue(false)

      await expect(deleteUserAccount(userId)).rejects.toThrow(
        'アカウント削除はモックモードではサポートされていません'
      )
    })

    it('should throw error with invalid UUID', async () => {
      await expect(deleteUserAccount('invalid-id')).rejects.toThrow(
        'アカウント削除はモックモードではサポートされていません'
      )
    })

    it('should delete user successfully', async () => {
      const user = {
        id: userId,
        userName: 'testuser',
        email: 'test@example.com',
        isActive: true,
        deletedAt: null,
      }

      ;(mockedPrisma!.user.findUnique as jest.Mock).mockResolvedValue(user as unknown)
      ;(mockedPrisma!.user.update as jest.Mock).mockResolvedValue({
        ...user,
        isActive: false,
        deletedAt: new Date(),
      } as unknown)

      const result = await deleteUserAccount(userId)

      expect(result).toBe(true)
      expect(mockedPrisma!.user.update as jest.Mock).toHaveBeenCalledWith({
        where: { id: userId },
        data: expect.objectContaining({
          isActive: false,
          deletedAt: expect.any(Date),
          userName: expect.stringContaining('testuser_deleted_'),
        }),
      })
    })

    it('should throw error when user not found', async () => {
      ;(mockedPrisma!.user.findUnique as jest.Mock).mockResolvedValueOnce(null)

      await expect(deleteUserAccount(userId)).rejects.toThrow('ユーザーが見つかりません')
    })

    it('should return true if user already deleted (P2025 error)', async () => {
      const user = {
        id: userId,
        userName: 'testuser',
        isActive: true,
        deletedAt: null,
      }

      const prismaError = new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '5.0.0',
      })

      ;(mockedPrisma!.user.findUnique as jest.Mock).mockResolvedValue(user as unknown)
      ;(mockedPrisma!.user.update as jest.Mock).mockRejectedValue(prismaError)

      const result = await deleteUserAccount(userId)

      expect(result).toBe(true)
    })

    it('should throw error on unknown database error', async () => {
      const user = {
        id: userId,
        userName: 'testuser',
        isActive: true,
        deletedAt: null,
      }

      ;(mockedPrisma!.user.findUnique as jest.Mock).mockResolvedValue(user as unknown)
      ;(mockedPrisma!.user.update as jest.Mock).mockRejectedValue(new Error('Unknown error'))

      await expect(deleteUserAccount(userId)).rejects.toThrow('アカウントの削除に失敗しました')
    })
  })

  describe('isAdmin', () => {
    it('should return true for ADMIN role', () => {
      const user = {
        id: '1',
        userName: 'admin',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      }
      expect(isAdmin(user)).toBe(true)
    })

    it('should return true for SUPER_ADMIN role', () => {
      const user = {
        id: '1',
        userName: 'superadmin',
        email: 'superadmin@example.com',
        role: UserRole.SUPER_ADMIN,
      }
      expect(isAdmin(user)).toBe(true)
    })

    it('should return false for USER role', () => {
      const user = {
        id: '1',
        userName: 'user',
        email: 'user@example.com',
        role: UserRole.USER,
      }
      expect(isAdmin(user)).toBe(false)
    })

    it('should return false for null user', () => {
      expect(isAdmin(null)).toBe(false)
    })
  })

  describe('isSuperAdmin', () => {
    it('should return true for SUPER_ADMIN role', () => {
      const user = {
        id: '1',
        userName: 'superadmin',
        email: 'superadmin@example.com',
        role: UserRole.SUPER_ADMIN,
      }
      expect(isSuperAdmin(user)).toBe(true)
    })

    it('should return false for ADMIN role', () => {
      const user = {
        id: '1',
        userName: 'admin',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      }
      expect(isSuperAdmin(user)).toBe(false)
    })

    it('should return false for null user', () => {
      expect(isSuperAdmin(null)).toBe(false)
    })
  })

  describe('logAdminAction', () => {
    it('should log admin action when database available', async () => {
      ;(mockedPrisma!.adminLog.create as jest.Mock).mockResolvedValue({} as unknown)

      await logAdminAction(
        'admin-id',
        'DELETE_USER',
        'user-id',
        { reason: 'violation' },
        '127.0.0.1',
        'Mozilla/5.0'
      )

      expect(mockedPrisma!.adminLog.create as jest.Mock).toHaveBeenCalledWith({
        data: {
          adminUserId: 'admin-id',
          action: 'DELETE_USER',
          target: 'user-id',
          details: { reason: 'violation' },
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
        },
      })
    })

    it('should not log when database unavailable', async () => {
      mockedIsDatabaseAvailable.mockReturnValue(false)

      await logAdminAction('admin-id', 'DELETE_USER')

      expect(mockedPrisma!.adminLog.create as jest.Mock).not.toHaveBeenCalled()
    })

    it('should handle database error gracefully', async () => {
      ;(mockedPrisma!.adminLog.create as jest.Mock).mockRejectedValue(new Error('Database error'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      await logAdminAction('admin-id', 'DELETE_USER')

      expect(consoleSpy).toHaveBeenCalledWith('Failed to log admin action:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe('authenticateRequest', () => {
    it('should authenticate with Bearer token', async () => {
      const request = new Request('http://localhost', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
      })

      const user = {
        id: 'user-1',
        userName: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
      }

      mockedJwt.verify.mockReturnValue(user as never)

      const result = await authenticateRequest(request)

      expect(result).toEqual({ userId: 'user-1', user })
    })

    it('should authenticate with Cookie token', async () => {
      const request = new Request('http://localhost', {
        headers: {
          Cookie: 'auth-token=valid-token; other=value',
        },
      })

      const user = {
        id: 'user-1',
        userName: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
      }

      mockedJwt.verify.mockReturnValue(user as never)

      const result = await authenticateRequest(request)

      expect(result).toEqual({ userId: 'user-1', user })
    })

    it('should throw error when no token provided', async () => {
      const request = new Request('http://localhost')

      await expect(authenticateRequest(request)).rejects.toThrow('認証が必要です')
    })

    it('should throw error for invalid token', async () => {
      const request = new Request('http://localhost', {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      })

      mockedJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      await expect(authenticateRequest(request)).rejects.toThrow('無効なトークンです')
    })

    it('should extract token from cookie with auth-token prefix', async () => {
      const request = new Request('http://localhost', {
        headers: {
          Cookie: 'other=value; auth-token=cookie-token; another=test',
        },
      })

      const user = {
        id: 'user-1',
        userName: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
      }

      mockedJwt.verify.mockReturnValue(user as never)

      const result = await authenticateRequest(request)

      expect(mockedJwt.verify).toHaveBeenCalledWith('cookie-token', 'test-secret')
      expect(result).toEqual({ userId: 'user-1', user })
    })

    it('should throw error when token is null from verifyToken', async () => {
      const request = new Request('http://localhost', {
        headers: {
          Authorization: 'Bearer null-token',
        },
      })

      mockedJwt.verify.mockReturnValue(null as never)

      await expect(authenticateRequest(request)).rejects.toThrow('無効なトークンです')
    })
  })

  describe('Edge Cases and Environment Variables', () => {
    it('should handle NODE_ENV test environment in registerUser', async () => {
      const originalNodeEnv = process.env.NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'test',
        writable: true,
        configurable: true,
      })

      const registerData = {
        userName: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      }

      const newUser = {
        id: 'new-user-id',
        userName: registerData.userName,
        email: registerData.email,
        role: UserRole.USER,
        emailVerified: false,
      }

      mockFindFunction.mockReturnValue(undefined)
      mockedBcrypt.hash.mockResolvedValue('hashed-password' as never)
      ;(mockedPrisma!.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(mockedPrisma!.user.create as jest.Mock).mockResolvedValue(newUser as unknown)

      const result = await registerUser(registerData)

      expect(result.emailVerified).toBe(false)
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalNodeEnv,
        writable: true,
        configurable: true,
      })
    })

    it('should handle production environment in registerUser', async () => {
      const originalNodeEnv = process.env.NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true,
      })

      const registerData = {
        userName: 'produser',
        email: 'prod@example.com',
        password: 'password123',
      }

      const newUser = {
        id: 'new-user-id',
        userName: registerData.userName,
        email: registerData.email,
        role: UserRole.USER,
        emailVerified: false,
      }

      mockFindFunction.mockReturnValue(undefined)
      mockedBcrypt.hash.mockResolvedValue('hashed-password' as never)
      ;(mockedPrisma!.user.findFirst as jest.Mock).mockResolvedValue(null)
      ;(mockedPrisma!.user.create as jest.Mock).mockResolvedValue(newUser as unknown)

      const result = await registerUser(registerData)

      expect(result.emailVerified).toBe(false)
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalNodeEnv,
        writable: true,
        configurable: true,
      })
    })
  })
})
