import { LoginUseCase } from '@api/usecases/auth/LoginUseCase'
import { UserRepository } from '@api/domain/repositories/UserRepository'
import { AuthSessionRepository } from '@api/domain/repositories/AuthSessionRepository'
import { PasswordHashService } from '@api/domain/services/PasswordHashService'
import { TokenService } from '@api/domain/services/TokenService'
import { User, UserRole } from '@api/domain/entities/User'
import { AuthSession } from '@api/domain/entities/AuthSession'
import {
  InvalidCredentialsError,
  EmailNotVerifiedError,
  AccountLockedError,
  AccountInactiveError,
} from '@api/domain/exceptions/AuthenticationError'

// Helper function to create mock users
function createMockUser(
  overrides: Partial<{
    id: string
    email: string
    username: string
    passwordHash: string
    emailVerified: boolean
    active: boolean
    failedLoginAttempts: number
    lockedUntil: Date | null
    deletedAt: Date | null
    role: UserRole
  }> = {}
): User {
  return new User(
    overrides.id || '1',
    overrides.email || 'test@example.com',
    overrides.username || 'testuser',
    overrides.username || 'testuser', // username
    overrides.passwordHash || 'hashedPassword',
    null, // displayName
    null, // profileImageUrl
    null, // birthDate
    null, // gender
    null, // skinType
    null, // skinTypeOther
    null, // allergies
    null, // allergiesOther
    overrides.emailVerified !== undefined ? overrides.emailVerified : true,
    null, // emailVerificationToken
    null, // passwordResetToken
    null, // passwordResetExpires
    overrides.failedLoginAttempts || 0,
    overrides.lockedUntil || null,
    overrides.role || UserRole.USER,
    overrides.active !== undefined ? overrides.active : true,
    overrides.active !== undefined ? overrides.active : true, // isActive
    overrides.deletedAt || null,
    new Date(),
    new Date()
  )
}

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase
  let mockUserRepository: jest.Mocked<UserRepository>
  let mockAuthSessionRepository: jest.Mocked<AuthSessionRepository>
  let mockPasswordHashService: jest.Mocked<PasswordHashService>
  let mockTokenService: jest.Mocked<TokenService>

  beforeEach(() => {
    // Create mocks
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      incrementFailedLoginAttempts: jest.fn(),
      resetFailedLoginAttempts: jest.fn(),
      lockAccount: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findByUsername: jest.fn(),
      delete: jest.fn(),
      findByEmailVerificationToken: jest.fn(),
      findByPasswordResetToken: jest.fn(),
      findMany: jest.fn(),
      softDelete: jest.fn(),
      updatePassword: jest.fn(),
      verifyEmail: jest.fn(),
    } as jest.Mocked<UserRepository>

    mockAuthSessionRepository = {
      create: jest.fn(),
      findByToken: jest.fn(),
      findById: jest.fn(),
      deleteByToken: jest.fn(),
      deleteByUserId: jest.fn(),
      deleteExpiredSessions: jest.fn(),
      invalidate: jest.fn(),
      invalidateAllUserSessions: jest.fn(),
    } as jest.Mocked<AuthSessionRepository>

    mockPasswordHashService = {
      hash: jest.fn(),
      compare: jest.fn(),
    }

    mockTokenService = {
      generateToken: jest.fn(),
      verifyToken: jest.fn(),
      generatePasswordResetToken: jest.fn(),
      verifyPasswordResetToken: jest.fn(),
      generateRandomToken: jest.fn(),
      verifyAuthToken: jest.fn(),
      invalidatePasswordResetToken: jest.fn(),
      generateEmailToken: jest.fn(),
      generateEmailVerificationToken: jest.fn(),
      verifyEmailToken: jest.fn(),
      invalidateEmailToken: jest.fn(),
    }

    loginUseCase = new LoginUseCase(
      mockUserRepository,
      mockAuthSessionRepository,
      mockPasswordHashService,
      mockTokenService
    )
  })

  describe('execute', () => {
    const validInput = {
      email: 'test@example.com',
      password: 'password123',
    }

    it('正常なログインで成功レスポンスを返す', async () => {
      const mockUser = createMockUser()

      const mockToken = 'mock-jwt-token'

      mockUserRepository.findByEmail.mockResolvedValue(mockUser)
      mockPasswordHashService.compare.mockResolvedValue(true)
      mockTokenService.generateToken.mockResolvedValue(mockToken)
      mockAuthSessionRepository.create.mockResolvedValue(undefined)

      const result = await loginUseCase.execute(validInput)

      expect(result).toEqual({
        token: mockToken,
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          role: UserRole.USER,
          emailVerified: true,
        },
      })

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com')
      expect(mockPasswordHashService.compare).toHaveBeenCalledWith('password123', 'hashedPassword')
      expect(mockUserRepository.resetFailedLoginAttempts).toHaveBeenCalledWith('1')
      expect(mockTokenService.generateToken).toHaveBeenCalledWith({
        userId: '1',
        email: 'test@example.com',
        role: UserRole.USER,
      })
      expect(mockAuthSessionRepository.create).toHaveBeenCalled()
    })

    it('存在しないユーザーでInvalidCredentialsErrorを投げる', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null)

      await expect(loginUseCase.execute(validInput)).rejects.toThrow(InvalidCredentialsError)

      expect(mockPasswordHashService.compare).not.toHaveBeenCalled()
    })

    it('無効なパスワードでInvalidCredentialsErrorを投げる', async () => {
      const mockUser = createMockUser()

      mockUserRepository.findByEmail.mockResolvedValue(mockUser)
      mockPasswordHashService.compare.mockResolvedValue(false)
      mockUserRepository.findById.mockResolvedValue(mockUser)

      await expect(loginUseCase.execute(validInput)).rejects.toThrow(InvalidCredentialsError)

      expect(mockUserRepository.incrementFailedLoginAttempts).toHaveBeenCalledWith('1')
    })

    it('メール未認証のユーザーでEmailNotVerifiedErrorを投げる', async () => {
      const mockUser = createMockUser({ emailVerified: false })

      mockUserRepository.findByEmail.mockResolvedValue(mockUser)
      mockPasswordHashService.compare.mockResolvedValue(true)

      await expect(loginUseCase.execute(validInput)).rejects.toThrow(EmailNotVerifiedError)
    })

    it('ロックされたアカウントでAccountLockedErrorを投げる', async () => {
      const lockUntil = new Date()
      lockUntil.setHours(lockUntil.getHours() + 1)

      const mockUser = createMockUser({
        failedLoginAttempts: 5,
        lockedUntil: lockUntil,
      })

      mockUserRepository.findByEmail.mockResolvedValue(mockUser)

      await expect(loginUseCase.execute(validInput)).rejects.toThrow(AccountLockedError)

      expect(mockPasswordHashService.compare).not.toHaveBeenCalled()
    })

    it('無効化されたアカウントでAccountInactiveErrorを投げる', async () => {
      const mockUser = createMockUser({ active: false })

      mockUserRepository.findByEmail.mockResolvedValue(mockUser)

      await expect(loginUseCase.execute(validInput)).rejects.toThrow(AccountInactiveError)

      expect(mockPasswordHashService.compare).not.toHaveBeenCalled()
    })

    it('削除されたアカウントでAccountInactiveErrorを投げる', async () => {
      const mockUser = createMockUser({ deletedAt: new Date() })

      mockUserRepository.findByEmail.mockResolvedValue(mockUser)

      await expect(loginUseCase.execute(validInput)).rejects.toThrow(AccountInactiveError)

      expect(mockPasswordHashService.compare).not.toHaveBeenCalled()
    })

    it('5回失敗後にアカウントをロックする', async () => {
      const mockUser = createMockUser({ failedLoginAttempts: 4 })

      const mockUserAfterIncrement = { ...mockUser, failedLoginAttempts: 5 }

      mockUserRepository.findByEmail.mockResolvedValue(mockUser)
      mockPasswordHashService.compare.mockResolvedValue(false)
      mockUserRepository.findById.mockResolvedValue(mockUserAfterIncrement as User)

      await expect(loginUseCase.execute(validInput)).rejects.toThrow(InvalidCredentialsError)

      expect(mockUserRepository.incrementFailedLoginAttempts).toHaveBeenCalledWith('1')
      expect(mockUserRepository.lockAccount).toHaveBeenCalledWith('1', expect.any(Date))
    })

    it('無効なメールアドレス形式でエラーを投げる', async () => {
      const invalidInput = {
        email: 'invalid-email',
        password: 'password123',
      }

      await expect(loginUseCase.execute(invalidInput)).rejects.toThrow(
        '無効なメールアドレス形式です'
      )
    })

    it('無効なパスワード形式でエラーを投げる', async () => {
      const invalidInput = {
        email: 'test@example.com',
        password: 'short',
      }

      await expect(loginUseCase.execute(invalidInput)).rejects.toThrow(
        'パスワードは8文字以上で入力してください'
      )
    })
  })
})
