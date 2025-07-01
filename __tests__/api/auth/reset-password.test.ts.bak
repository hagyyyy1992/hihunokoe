// Mock password reset module
jest.mock('@/lib/auth/password-reset', () => ({
  resetPassword: jest.fn(),
}))

// Mock rate limiter
jest.mock('@/lib/rate-limiter', () => ({
  passwordResetExecutionLimiter: {
    checkLimit: jest.fn(),
  },
  getClientIP: jest.fn(),
  createRateLimitErrorResponse: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { POST } from '../../../src/app/api/auth/reset-password/route'
import * as passwordResetModule from '@/lib/auth/password-reset'
import * as rateLimiterModule from '@/lib/rate-limiter'

const mockResetPassword = passwordResetModule.resetPassword as jest.MockedFunction<
  typeof passwordResetModule.resetPassword
>
const mockPasswordResetExecutionLimiter = (rateLimiterModule as any).passwordResetExecutionLimiter
const mockGetClientIP = rateLimiterModule.getClientIP as jest.MockedFunction<
  typeof rateLimiterModule.getClientIP
>
const mockCreateRateLimitErrorResponse =
  rateLimiterModule.createRateLimitErrorResponse as jest.MockedFunction<
    typeof rateLimiterModule.createRateLimitErrorResponse
  >

describe('/api/auth/reset-password', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // デフォルトではレート制限を通す
    mockPasswordResetExecutionLimiter.checkLimit.mockReturnValue({
      allowed: true,
      remaining: 4,
      resetTime: Date.now() + 5 * 60 * 1000,
    })
    mockGetClientIP.mockReturnValue('127.0.0.1')
  })

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  }

  describe('POST', () => {
    it('有効なトークンと新しいパスワードでリセットが成功する', async () => {
      const validToken = 'valid-reset-token-12345'
      const newPassword = 'newPassword123'

      mockResetPassword.mockResolvedValue({
        success: true,
        message: 'パスワードが正常にリセットされました',
      })

      const request = createRequest({
        token: validToken,
        password: newPassword,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message: 'パスワードが正常にリセットされました',
      })
      expect(mockResetPassword).toHaveBeenCalledWith(validToken, newPassword)
    })

    it('無効なトークンで400エラーが返される', async () => {
      const invalidToken = 'invalid-token'
      const newPassword = 'newPassword123'

      mockResetPassword.mockResolvedValue({
        success: false,
        message: '無効なトークンまたは期限切れです',
      })

      const request = createRequest({
        token: invalidToken,
        password: newPassword,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: '無効なトークンまたは期限切れです',
      })
      expect(mockResetPassword).toHaveBeenCalledWith(invalidToken, newPassword)
    })

    it('期限切れトークンで400エラーが返される', async () => {
      const expiredToken = 'expired-token-12345'
      const newPassword = 'newPassword123'

      mockResetPassword.mockResolvedValue({
        success: false,
        message: '無効なトークンまたは期限切れです',
      })

      const request = createRequest({
        token: expiredToken,
        password: newPassword,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: '無効なトークンまたは期限切れです',
      })
      expect(mockResetPassword).toHaveBeenCalledWith(expiredToken, newPassword)
    })

    it('トークンが空の場合、バリデーションエラーが返される', async () => {
      const request = createRequest({
        token: '',
        password: 'newPassword123',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('トークンが必要です')
      expect(mockResetPassword).not.toHaveBeenCalled()
    })

    it('トークンが未提供の場合、バリデーションエラーが返される', async () => {
      const request = createRequest({
        password: 'newPassword123',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Required')
      expect(mockResetPassword).not.toHaveBeenCalled()
    })

    it('パスワードが短すぎる場合、バリデーションエラーが返される', async () => {
      const request = createRequest({
        token: 'valid-token-12345',
        password: '1234567', // 7文字（8文字未満）
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('パスワードは8文字以上で入力してください')
      expect(mockResetPassword).not.toHaveBeenCalled()
    })

    it('パスワードが未提供の場合、バリデーションエラーが返される', async () => {
      const request = createRequest({
        token: 'valid-token-12345',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Required')
      expect(mockResetPassword).not.toHaveBeenCalled()
    })

    it('リクエストボディが空の場合、バリデーションエラーが返される', async () => {
      const request = createRequest({})

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Required')
      expect(mockResetPassword).not.toHaveBeenCalled()
    })

    it('不正なJSONリクエストの場合、500エラーが返される', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid-json',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('パスワードリセット中にエラーが発生しました')
      expect(mockResetPassword).not.toHaveBeenCalled()
    })

    it('resetPassword関数でエラーが発生した場合、500エラーが返される', async () => {
      const validToken = 'valid-token-12345'
      const newPassword = 'newPassword123'

      mockResetPassword.mockRejectedValue(new Error('Database connection error'))

      const request = createRequest({
        token: validToken,
        password: newPassword,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('パスワードリセット中にエラーが発生しました')
      expect(mockResetPassword).toHaveBeenCalledWith(validToken, newPassword)
    })

    it('最小限の有効なパスワード（8文字）でリセットが成功する', async () => {
      const validToken = 'valid-token-12345'
      const minPassword = '12345678' // 最小8文字

      mockResetPassword.mockResolvedValue({
        success: true,
        message: 'パスワードが正常にリセットされました',
      })

      const request = createRequest({
        token: validToken,
        password: minPassword,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message: 'パスワードが正常にリセットされました',
      })
      expect(mockResetPassword).toHaveBeenCalledWith(validToken, minPassword)
    })

    it('長いパスワードでリセットが成功する', async () => {
      const validToken = 'valid-token-12345'
      const longPassword = 'thisIsAVeryLongPasswordWith1234567890AndSpecialChars!@#$%'

      mockResetPassword.mockResolvedValue({
        success: true,
        message: 'パスワードが正常にリセットされました',
      })

      const request = createRequest({
        token: validToken,
        password: longPassword,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message: 'パスワードが正常にリセットされました',
      })
      expect(mockResetPassword).toHaveBeenCalledWith(validToken, longPassword)
    })

    it('レート制限に達した場合、429エラーが返される', async () => {
      const resetTime = Date.now() + 3 * 60 * 1000
      mockPasswordResetExecutionLimiter.checkLimit.mockReturnValue({
        allowed: false,
        remaining: 0,
        resetTime,
      })
      mockCreateRateLimitErrorResponse.mockReturnValue({
        error: 'リクエストが多すぎます。しばらく時間をおいてから再試行してください。',
        retryAfter: 180,
        message: '3分後に再試行してください。',
      })

      const request = createRequest({
        token: 'valid-token-12345',
        password: 'newPassword123',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toBe(
        'リクエストが多すぎます。しばらく時間をおいてから再試行してください。'
      )
      expect(data.retryAfter).toBe(180)
      expect(data.message).toBe('3分後に再試行してください。')

      // レート制限ヘッダーが設定されていることを確認
      expect(response.headers.get('Retry-After')).toBeTruthy()
      expect(response.headers.get('X-RateLimit-Limit')).toBe('5')
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
      expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy()

      // resetPassword関数が実行されないことを確認
      expect(mockResetPassword).not.toHaveBeenCalled()
    })

    it('レート制限チェックが実行される', async () => {
      const request = createRequest({
        token: 'valid-token-12345',
        password: 'newPassword123',
      })

      await POST(request)

      expect(mockGetClientIP).toHaveBeenCalledWith(request)
      expect(mockPasswordResetExecutionLimiter.checkLimit).toHaveBeenCalledWith('127.0.0.1')
    })
  })
})
