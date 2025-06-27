// Mock password reset module
jest.mock('../../../src/lib/auth/password-reset', () => ({
  sendPasswordResetEmail: jest.fn(),
}))

// Mock prisma with proper typing
jest.mock('../../../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
  isDatabaseAvailable: jest.fn(),
}))

// Mock rate limiter
jest.mock('../../../src/lib/rate-limiter', () => ({
  passwordResetLimiter: {
    checkLimit: jest.fn(),
  },
  getClientIP: jest.fn(),
  createRateLimitErrorResponse: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { POST } from '../../../src/app/api/auth/forgot-password/route'
import * as passwordResetModule from '../../../src/lib/auth/password-reset'
import * as prismaModule from '../../../src/lib/prisma'
import * as rateLimiterModule from '../../../src/lib/rate-limiter'

const mockSendPasswordResetEmail =
  passwordResetModule.sendPasswordResetEmail as jest.MockedFunction<
    typeof passwordResetModule.sendPasswordResetEmail
  >
const mockIsDatabaseAvailable = prismaModule.isDatabaseAvailable as jest.MockedFunction<
  typeof prismaModule.isDatabaseAvailable
>
const mockFindUnique = (prismaModule.prisma as any).user.findUnique
const mockPasswordResetLimiter = (rateLimiterModule as any).passwordResetLimiter
const mockGetClientIP = rateLimiterModule.getClientIP as jest.MockedFunction<
  typeof rateLimiterModule.getClientIP
>
const mockCreateRateLimitErrorResponse =
  rateLimiterModule.createRateLimitErrorResponse as jest.MockedFunction<
    typeof rateLimiterModule.createRateLimitErrorResponse
  >

describe('/api/auth/forgot-password', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsDatabaseAvailable.mockReturnValue(true)
    // デフォルトではレート制限を通す
    mockPasswordResetLimiter.checkLimit.mockReturnValue({
      allowed: true,
      remaining: 2,
      resetTime: Date.now() + 15 * 60 * 1000,
    })
    mockGetClientIP.mockReturnValue('127.0.0.1')
  })

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        host: 'localhost:3000',
        'x-forwarded-proto': 'http',
      },
      body: JSON.stringify(body),
    })
  }

  describe('POST', () => {
    it('有効なメールアドレスでパスワードリセットメールが送信される', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        userName: 'testuser',
        isActive: true,
      }

      mockFindUnique.mockResolvedValue(mockUser)
      mockSendPasswordResetEmail.mockResolvedValue()

      const request = createRequest({ email: 'test@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('パスワードリセットメールを送信しました。メールをご確認ください。')
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: {
          email: 'test@example.com',
          isActive: true,
        },
      })
      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        'user123',
        'test@example.com',
        'testuser',
        'http://localhost:3000'
      )
    })

    it('存在しないメールアドレスでも成功メッセージを返す（セキュリティ対策）', async () => {
      mockFindUnique.mockResolvedValue(null)

      const request = createRequest({ email: 'nonexistent@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('パスワードリセットメールを送信しました。メールをご確認ください。')
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: {
          email: 'nonexistent@example.com',
          isActive: true,
        },
      })
      // メール送信は呼ばれない
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled()
    })

    it('無効なメールアドレス形式でバリデーションエラーを返す', async () => {
      const request = createRequest({ email: 'invalid-email' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('有効なメールアドレスを入力してください')
    })

    it('メールフィールドが欠如している場合、バリデーションエラーを返す', async () => {
      const request = createRequest({})
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('メールアドレスは必須です')
    })

    it('メール送信に失敗しても成功メッセージを返す（ユーザーには内部エラーを隠す）', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        userName: 'testuser',
        isActive: true,
      }

      mockFindUnique.mockResolvedValue(mockUser)
      mockSendPasswordResetEmail.mockRejectedValue(new Error('Email service error'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const request = createRequest({ email: 'test@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('パスワードリセットメールを送信しました。メールをご確認ください。')
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send password reset email:',
        expect.objectContaining({
          error: expect.any(Error),
          message: 'Email service error',
          stack: expect.any(String),
          userId: 'user123',
          email: 'test@example.com',
        })
      )

      consoleSpy.mockRestore()
    })

    it('データベースが利用できない場合のモックモードをテスト', async () => {
      mockIsDatabaseAvailable.mockReturnValue(false)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const request = createRequest({ email: 'demo@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('パスワードリセットメールを送信しました。メールをご確認ください。')
      expect(consoleSpy).toHaveBeenCalledWith(
        'Mock mode: Password reset email would be sent to:',
        'demo@example.com'
      )

      consoleSpy.mockRestore()
    })

    it('データベースエラーでサーバーエラーを返す', async () => {
      mockFindUnique.mockRejectedValue(new Error('Database connection error'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const request = createRequest({ email: 'test@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('パスワードリセットの処理中にエラーが発生しました')
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('レート制限に達した場合、429エラーが返される', async () => {
      const resetTime = Date.now() + 5 * 60 * 1000
      mockPasswordResetLimiter.checkLimit.mockReturnValue({
        allowed: false,
        remaining: 0,
        resetTime,
      })
      mockCreateRateLimitErrorResponse.mockReturnValue({
        error: 'リクエストが多すぎます。しばらく時間をおいてから再試行してください。',
        retryAfter: 300,
        message: '5分後に再試行してください。',
      })

      const request = createRequest({ email: 'test@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toBe(
        'リクエストが多すぎます。しばらく時間をおいてから再試行してください。'
      )
      expect(data.retryAfter).toBe(300)
      expect(data.message).toBe('5分後に再試行してください。')

      // レート制限ヘッダーが設定されていることを確認
      expect(response.headers.get('Retry-After')).toBeTruthy()
      expect(response.headers.get('X-RateLimit-Limit')).toBe('3')
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
      expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy()

      // メール送信が実行されないことを確認
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled()
    })

    it('レート制限チェックが実行される', async () => {
      const request = createRequest({ email: 'test@example.com' })
      await POST(request)

      expect(mockGetClientIP).toHaveBeenCalledWith(request)
      expect(mockPasswordResetLimiter.checkLimit).toHaveBeenCalledWith('127.0.0.1')
    })
  })
})
