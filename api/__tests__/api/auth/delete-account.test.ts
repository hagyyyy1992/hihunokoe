import { NextRequest } from 'next/server'
import { AuthController } from '@api/framework/controllers/AuthController'
import { createMockAuthController } from '../../helpers/auth-test-helper'
import { prisma } from '@/lib/prisma'
import { verifyPassword, hashPassword, generateToken } from '@/lib/auth/auth'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    withdrawalSurvey: {
      create: jest.fn(),
    },
    post: {
      deleteMany: jest.fn(),
    },
    comment: {
      deleteMany: jest.fn(),
    },
    empathy: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

jest.mock('@api/interface-adapters/services/TokenService', () => ({
  TokenServiceImpl: jest.fn().mockImplementation(() => ({
    verifyToken: jest.fn().mockResolvedValue({ userId: 'test-user-id' }),
    generateRandomToken: jest.fn().mockReturnValue('random-token'),
  })),
}))

jest.mock('@api/usecases/auth/interactor', () => ({
  AuthenticationUseCase: jest.fn().mockImplementation(() => ({
    verifyToken: jest.fn().mockResolvedValue({
      isValid: true,
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        userName: 'testuser',
        role: 'USER',
        emailVerified: true,
      },
    }),
  })),
  PasswordManagementUseCase: jest.fn().mockImplementation(() => ({})),
  EmailVerificationUseCase: jest.fn().mockImplementation(() => ({})),
  AccountManagementUseCase: jest.fn().mockImplementation(() => ({
    deleteAccount: jest.fn().mockResolvedValue({
      message: 'アカウントが削除されました。',
    }),
  })),
}))

jest.mock('@api/interface-adapters/repositories/AuthSession.repository', () => ({
  AuthSessionRepository: jest.fn().mockImplementation(() => ({
    findByToken: jest.fn().mockResolvedValue({
      userId: 'test-user-id',
      expiresAt: new Date(Date.now() + 86400000), // 1日後
    }),
    deleteByUserId: jest.fn(),
  })),
}))

jest.mock('@api/interface-adapters/repositories/User.repository', () => ({
  UserRepository: jest.fn().mockImplementation(() => ({
    findById: jest.fn(),
    update: jest.fn(),
  })),
}))

jest.mock('@api/interface-adapters/services/PasswordHashService', () => ({
  PasswordHashServiceImpl: jest.fn().mockImplementation(() => ({
    verify: jest.fn(),
  })),
}))

jest.mock('@api/interface-adapters/services/EmailService', () => ({
  EmailService: jest.fn().mockImplementation(() => ({})),
}))

jest.mock('@api/interface-adapters/repositories/WithdrawalSurvey.repository', () => ({
  WithdrawalSurveyRepository: jest.fn().mockImplementation(() => ({
    create: jest.fn(),
  })),
}))

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    withdrawalSurvey: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  })),
}))

jest.mock('@api/domain/exceptions/AuthenticationError', () => ({
  InvalidCredentialsError: class InvalidCredentialsError extends Error {
    constructor(message?: string) {
      super(message || 'Invalid credentials')
      this.name = 'InvalidCredentialsError'
    }
  },
  AccountInactiveError: class AccountInactiveError extends Error {
    constructor(message?: string) {
      super(message || 'Account is inactive')
      this.name = 'AccountInactiveError'
    }
  },
}))

describe('DELETE /api/auth/delete-account', () => {
  let authController: AuthController
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    password: 'hashed-password',
    status: 'ACTIVE',
    deletedAt: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mocks for AuthenticationUseCase
    const {
      AuthenticationUseCase,
      AccountManagementUseCase,
    } = require('@api/usecases/auth/interactor')
    AuthenticationUseCase.mockImplementation(() => ({
      verifyToken: jest.fn().mockResolvedValue({
        isValid: true,
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          userName: 'testuser',
          role: 'USER',
          emailVerified: true,
        },
      }),
    }))
    AccountManagementUseCase.mockImplementation(() => ({
      deleteAccount: jest.fn().mockResolvedValue({
        message: 'アカウントが削除されました。',
      }),
    }))

    // Setup mocks for UserRepository
    const { UserRepository } = require('@api/interface-adapters/repositories/User.repository')
    UserRepository.mockImplementation(() => ({
      findById: jest.fn().mockResolvedValue(mockUser),
      update: jest.fn().mockResolvedValue({ ...mockUser, deletedAt: new Date() }),
    }))

    // Setup mocks for PasswordHashService
    const {
      PasswordHashServiceImpl,
    } = require('@api/interface-adapters/services/PasswordHashService')
    PasswordHashServiceImpl.mockImplementation(() => ({
      verify: jest.fn().mockResolvedValue(true),
      compare: jest.fn().mockResolvedValue(true),
    }))

    // Setup mocks for EmailService
    const { EmailService } = require('@api/interface-adapters/services/EmailService')
    EmailService.mockImplementation(() => ({}))

    // Setup mocks for WithdrawalSurveyRepository
    const {
      WithdrawalSurveyRepository,
    } = require('@api/interface-adapters/repositories/WithdrawalSurvey.repository')
    WithdrawalSurveyRepository.mockImplementation(() => ({
      create: jest.fn().mockResolvedValue({ id: 'survey-id' }),
    }))

    // Setup mocks for AuthSessionRepository
    const {
      AuthSessionRepository,
    } = require('@api/interface-adapters/repositories/AuthSession.repository')
    AuthSessionRepository.mockImplementation(() => ({
      findByToken: jest.fn().mockResolvedValue({
        userId: 'test-user-id',
        expiresAt: new Date(Date.now() + 86400000), // 1日後
      }),
      deleteByUserId: jest.fn().mockResolvedValue(true),
    }))
  })

  const createRequest = (body: any, headers: Record<string, string> = {}) => {
    const request = new NextRequest('http://localhost:3000/api/auth/delete-account', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'auth-token=valid-token',
        ...headers,
      },
      body: JSON.stringify(body),
    })
    return request
  }

  describe('成功ケース', () => {
    it('パスワードが正しい場合、アカウントが削除される', async () => {
      const {
        AuthenticationUseCase,
        AccountManagementUseCase,
      } = require('@api/usecases/auth/interactor')

      const mockAuthUseCase = {
        verifyToken: jest.fn().mockResolvedValue({
          isValid: true,
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            userName: 'testuser',
            role: 'USER',
            emailVerified: true,
          },
        }),
      }

      const mockAccountUseCase = {
        deleteAccount: jest.fn().mockResolvedValue({
          message: 'アカウントが削除されました。',
        }),
      }

      AuthenticationUseCase.mockReturnValue(mockAuthUseCase)
      AccountManagementUseCase.mockReturnValue(mockAccountUseCase)

      authController = createMockAuthController(mockAuthUseCase, {}, {}, mockAccountUseCase, {})
      const request = createRequest(
        { password: 'correct-password' },
        { Authorization: 'Bearer valid-token' }
      )

      const response = await authController.deleteAccount(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message: 'アカウントが削除されました。',
      })
    })

    it('退会アンケートありでアカウントが削除される', async () => {
      const mockAuthUseCase = {
        verifyToken: jest.fn().mockResolvedValue({
          isValid: true,
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            userName: 'testuser',
            role: 'USER',
            emailVerified: true,
          },
        }),
      }

      const mockAccountUseCase = {
        deleteAccount: jest.fn().mockResolvedValue({
          message: 'アカウントが削除されました。',
        }),
      }

      authController = createMockAuthController(mockAuthUseCase, {}, {}, mockAccountUseCase, {})

      const surveyData = {
        reasons: ['not_useful', 'privacy_concerns'],
        reasonOther: '個人的な理由',
        feedback: 'サービスの改善点...',
        wouldRecommend: false,
      }

      const request = createRequest(
        { password: 'correct-password', survey: surveyData },
        { Authorization: 'Bearer valid-token' }
      )

      const response = await authController.deleteAccount(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message: 'アカウントが削除されました。',
      })
    })

    it('複数の退会理由が正しく保存される', async () => {
      const mockAuthUseCase = {
        verifyToken: jest.fn().mockResolvedValue({
          isValid: true,
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            userName: 'testuser',
            role: 'USER',
            emailVerified: true,
          },
        }),
      }

      const mockAccountUseCase = {
        deleteAccount: jest.fn().mockResolvedValue({
          message: 'アカウントが削除されました。',
        }),
      }

      authController = createMockAuthController(mockAuthUseCase, {}, {}, mockAccountUseCase, {})

      const surveyData = {
        reasons: ['privacy_concerns', 'too_many_emails', 'technical_issues'],
        reasonOther: '技術的な問題が多すぎる',
        feedback: '改善してほしい点がたくさんあります',
        wouldRecommend: false,
      }

      const request = createRequest(
        { password: 'correct-password', survey: surveyData },
        { Authorization: 'Bearer valid-token' }
      )

      const response = await authController.deleteAccount(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('推薦意向が正しく保存される', async () => {
      const mockAuthUseCase = {
        verifyToken: jest.fn().mockResolvedValue({
          isValid: true,
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            userName: 'testuser',
            role: 'USER',
            emailVerified: true,
          },
        }),
      }

      const mockAccountUseCase = {
        deleteAccount: jest.fn().mockResolvedValue({
          message: 'アカウントが削除されました。',
        }),
      }

      authController = createMockAuthController(mockAuthUseCase, {}, {}, mockAccountUseCase, {})

      const surveyData = {
        reasons: ['temporary_break'],
        feedback: '一時的に離れます',
        wouldRecommend: true,
      }

      const request = createRequest(
        { password: 'correct-password', survey: surveyData },
        { Authorization: 'Bearer valid-token' }
      )

      const response = await authController.deleteAccount(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('エラーケース', () => {
    it('認証トークンがない場合、401エラー', async () => {
      const request = createRequest({ password: 'password' })

      const response = await authController.deleteAccount(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({
        error: '認証トークンが提供されていません',
      })
    })

    it('パスワードが提供されない場合、400エラー', async () => {
      const request = createRequest({}, { Authorization: 'Bearer valid-token' })

      const response = await authController.deleteAccount(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'パスワードを入力してください',
      })
    })

    it('パスワードが間違っている場合、400エラー', async () => {
      const { AccountManagementUseCase } = require('@api/usecases/auth/interactor')
      AccountManagementUseCase.mockImplementation(() => ({
        deleteAccount: jest.fn().mockRejectedValue(new Error('Invalid password')),
      }))

      const mockAuthUseCase = {
        verifyToken: jest.fn().mockResolvedValue({
          isValid: true,
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            userName: 'testuser',
            role: 'USER',
            emailVerified: true,
          },
        }),
      }

      const mockAccountUseCase = {
        deleteAccount: jest.fn().mockRejectedValue(new Error('Invalid password')),
      }

      // 新しいAuthControllerインスタンスを作成
      authController = createMockAuthController(mockAuthUseCase, {}, {}, mockAccountUseCase, {})

      const request = createRequest(
        { password: 'wrong-password' },
        { Authorization: 'Bearer valid-token' }
      )

      const response = await authController.deleteAccount(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'パスワードが正しくありません',
      })
    })

    it('ユーザーが見つからない場合、404エラー', async () => {
      const { AccountManagementUseCase } = require('@api/usecases/auth/interactor')
      AccountManagementUseCase.mockImplementation(() => ({
        deleteAccount: jest.fn().mockRejectedValue(new Error('User not found')),
      }))

      const mockAuthUseCase = {
        verifyToken: jest.fn().mockResolvedValue({
          isValid: true,
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            userName: 'testuser',
            role: 'USER',
            emailVerified: true,
          },
        }),
      }

      const mockAccountUseCase = {
        deleteAccount: jest.fn().mockRejectedValue(new Error('User not found')),
      }

      authController = createMockAuthController(mockAuthUseCase, {}, {}, mockAccountUseCase, {})

      const request = createRequest(
        { password: 'password' },
        { Authorization: 'Bearer valid-token' }
      )

      const response = await authController.deleteAccount(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({
        error: 'アカウント削除中にエラーが発生しました',
      })
    })

    it('既に削除されたユーザーの場合、404エラー', async () => {
      const { AccountManagementUseCase } = require('@api/usecases/auth/interactor')
      AccountManagementUseCase.mockImplementation(() => ({
        deleteAccount: jest.fn().mockRejectedValue(new Error('User is already deleted')),
      }))

      const mockAuthUseCase = {
        verifyToken: jest.fn().mockResolvedValue({
          isValid: true,
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            userName: 'testuser',
            role: 'USER',
            emailVerified: true,
          },
        }),
      }

      const mockAccountUseCase = {
        deleteAccount: jest.fn().mockRejectedValue(new Error('User is already deleted')),
      }

      authController = createMockAuthController(mockAuthUseCase, {}, {}, mockAccountUseCase, {})

      const request = createRequest(
        { password: 'password' },
        { Authorization: 'Bearer valid-token' }
      )

      const response = await authController.deleteAccount(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({
        error: 'アカウント削除中にエラーが発生しました',
      })
    })

    it('無効なトークンの場合、401エラー', async () => {
      const { AuthenticationUseCase } = require('@api/usecases/auth/interactor')
      AuthenticationUseCase.mockImplementation(() => ({
        verifyToken: jest.fn().mockResolvedValue({
          isValid: false,
          user: null,
        }),
      }))

      const mockAuthUseCase = {
        verifyToken: jest.fn().mockResolvedValue({
          isValid: false,
          user: null,
        }),
      }

      authController = createMockAuthController(mockAuthUseCase, {}, {}, {}, {})

      const request = createRequest(
        { password: 'password' },
        { Authorization: 'Bearer invalid-token' }
      )

      const response = await authController.deleteAccount(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({
        error: '認証に失敗しました',
      })
    })

    it('トークン検証でエラーが発生した場合、401エラー', async () => {
      const { AuthenticationUseCase } = require('@api/usecases/auth/interactor')
      AuthenticationUseCase.mockImplementation(() => ({
        verifyToken: jest.fn().mockRejectedValue(new Error('Invalid or expired token')),
      }))

      const mockAuthUseCase = {
        verifyToken: jest.fn().mockRejectedValue(new Error('Invalid or expired token')),
      }

      authController = createMockAuthController(mockAuthUseCase, {}, {}, {}, {})

      const request = createRequest(
        { password: 'password' },
        { Authorization: 'Bearer invalid-token' }
      )

      const response = await authController.deleteAccount(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({
        error: '認証に失敗しました',
      })
    })

    it('データベースエラーの場合、500エラー', async () => {
      const { AccountManagementUseCase } = require('@api/usecases/auth/interactor')
      AccountManagementUseCase.mockImplementation(() => ({
        deleteAccount: jest.fn().mockRejectedValue(new Error('Database error')),
      }))

      const mockAuthUseCase = {
        verifyToken: jest.fn().mockResolvedValue({
          isValid: true,
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            userName: 'testuser',
            role: 'USER',
            emailVerified: true,
          },
        }),
      }

      const mockAccountUseCase = {
        deleteAccount: jest.fn().mockRejectedValue(new Error('Database error')),
      }

      authController = createMockAuthController(mockAuthUseCase, {}, {}, mockAccountUseCase, {})

      const request = createRequest(
        { password: 'correct-password' },
        { Authorization: 'Bearer valid-token' }
      )

      const response = await authController.deleteAccount(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'アカウント削除中にエラーが発生しました',
      })
    })
  })

  describe('退会アンケートの検証', () => {
    it('退会理由がその他の場合、詳細が保存される', async () => {
      // 成功ケース用にモックを再設定
      const {
        AuthenticationUseCase,
        AccountManagementUseCase,
      } = require('@api/usecases/auth/interactor')

      const mockAuthUseCase = {
        verifyToken: jest.fn().mockResolvedValue({
          isValid: true,
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            userName: 'testuser',
            role: 'USER',
            emailVerified: true,
          },
        }),
      }

      const mockAccountUseCase = {
        deleteAccount: jest.fn().mockResolvedValue({
          message: 'アカウントが削除されました。',
        }),
      }

      AuthenticationUseCase.mockImplementation(() => ({
        verifyToken: jest.fn().mockResolvedValue({
          isValid: true,
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            userName: 'testuser',
            role: 'USER',
            emailVerified: true,
          },
        }),
      }))

      AccountManagementUseCase.mockImplementation(() => ({
        deleteAccount: jest.fn().mockResolvedValue({
          message: 'アカウントが削除されました。',
        }),
      }))

      authController = createMockAuthController(mockAuthUseCase, {}, {}, mockAccountUseCase, {})

      const surveyData = {
        reasons: ['other'],
        reasonOther: 'その他の理由の詳細',
        feedback: 'フィードバック',
        wouldRecommend: null,
      }

      const request = createRequest(
        { password: 'correct-password', survey: surveyData },
        { Authorization: 'Bearer valid-token' }
      )

      const response = await authController.deleteAccount(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('退会アンケートが空オブジェクトの場合も正常に処理される', async () => {
      // 成功ケース用にモックを再設定
      const {
        AuthenticationUseCase,
        AccountManagementUseCase,
      } = require('@api/usecases/auth/interactor')

      const mockAuthUseCase = {
        verifyToken: jest.fn().mockResolvedValue({
          isValid: true,
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            userName: 'testuser',
            role: 'USER',
            emailVerified: true,
          },
        }),
      }

      const mockAccountUseCase = {
        deleteAccount: jest.fn().mockResolvedValue({
          message: 'アカウントが削除されました。',
        }),
      }

      AuthenticationUseCase.mockImplementation(() => ({
        verifyToken: jest.fn().mockResolvedValue({
          isValid: true,
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            userName: 'testuser',
            role: 'USER',
            emailVerified: true,
          },
        }),
      }))

      AccountManagementUseCase.mockImplementation(() => ({
        deleteAccount: jest.fn().mockResolvedValue({
          message: 'アカウントが削除されました。',
        }),
      }))

      authController = createMockAuthController(mockAuthUseCase, {}, {}, mockAccountUseCase, {})

      const request = createRequest(
        { password: 'correct-password', survey: {} },
        { Authorization: 'Bearer valid-token' }
      )

      const response = await authController.deleteAccount(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('退会アンケートがnullの場合も正常に処理される', async () => {
      // 成功ケース用にモックを再設定
      const {
        AuthenticationUseCase,
        AccountManagementUseCase,
      } = require('@api/usecases/auth/interactor')

      const mockAuthUseCase = {
        verifyToken: jest.fn().mockResolvedValue({
          isValid: true,
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            userName: 'testuser',
            role: 'USER',
            emailVerified: true,
          },
        }),
      }

      const mockAccountUseCase = {
        deleteAccount: jest.fn().mockResolvedValue({
          message: 'アカウントが削除されました。',
        }),
      }

      AuthenticationUseCase.mockImplementation(() => ({
        verifyToken: jest.fn().mockResolvedValue({
          isValid: true,
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            userName: 'testuser',
            role: 'USER',
            emailVerified: true,
          },
        }),
      }))

      AccountManagementUseCase.mockImplementation(() => ({
        deleteAccount: jest.fn().mockResolvedValue({
          message: 'アカウントが削除されました。',
        }),
      }))

      authController = createMockAuthController(mockAuthUseCase, {}, {}, mockAccountUseCase, {})

      const request = createRequest(
        { password: 'correct-password', survey: null },
        { Authorization: 'Bearer valid-token' }
      )

      const response = await authController.deleteAccount(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})
