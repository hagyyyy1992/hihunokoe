// Mock the password reset module
jest.mock('../../../src/lib/auth/password-reset', () => ({
  verifyPasswordResetToken: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { POST } from '../../../src/app/api/auth/verify-reset-token/route'
import * as passwordResetModule from '../../../src/lib/auth/password-reset'

const mockVerifyPasswordResetToken =
  passwordResetModule.verifyPasswordResetToken as jest.MockedFunction<
    typeof passwordResetModule.verifyPasswordResetToken
  >

describe('/api/auth/verify-reset-token', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/auth/verify-reset-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  }

  describe('POST', () => {
    it('有効なトークンで成功レスポンスを返す', async () => {
      mockVerifyPasswordResetToken.mockResolvedValue({
        success: true,
        message: 'トークンが有効です',
      })

      const request = createRequest({ token: 'valid-token-123' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('トークンが有効です')
      expect(mockVerifyPasswordResetToken).toHaveBeenCalledWith('valid-token-123')
    })

    it('無効なトークンで400エラーを返す', async () => {
      mockVerifyPasswordResetToken.mockResolvedValue({
        success: false,
        message: 'トークンが無効または期限切れです',
      })

      const request = createRequest({ token: 'invalid-token' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe('トークンが無効または期限切れです')
      expect(mockVerifyPasswordResetToken).toHaveBeenCalledWith('invalid-token')
    })

    it('期限切れトークンで400エラーを返す', async () => {
      mockVerifyPasswordResetToken.mockResolvedValue({
        success: false,
        message: 'トークンの有効期限が切れています',
      })

      const request = createRequest({ token: 'expired-token' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe('トークンの有効期限が切れています')
      expect(mockVerifyPasswordResetToken).toHaveBeenCalledWith('expired-token')
    })

    it('空のトークンでバリデーションエラーを返す', async () => {
      const request = createRequest({ token: '' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe('トークンが必要です')
      expect(mockVerifyPasswordResetToken).not.toHaveBeenCalled()
    })

    it('トークンフィールドが欠如している場合、バリデーションエラーを返す', async () => {
      const request = createRequest({})
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('Required')
      expect(mockVerifyPasswordResetToken).not.toHaveBeenCalled()
    })

    it('無効なJSONで500エラーを返す', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/verify-reset-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.message).toBe('トークンの確認中にエラーが発生しました')
      expect(consoleSpy).toHaveBeenCalledWith('Token verification error:', expect.any(Error))
      expect(mockVerifyPasswordResetToken).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('データベースエラーで500エラーを返す', async () => {
      mockVerifyPasswordResetToken.mockRejectedValue(new Error('Database connection error'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const request = createRequest({ token: 'valid-token-123' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.message).toBe('トークンの確認中にエラーが発生しました')
      expect(consoleSpy).toHaveBeenCalledWith('Token verification error:', expect.any(Error))
      expect(mockVerifyPasswordResetToken).toHaveBeenCalledWith('valid-token-123')

      consoleSpy.mockRestore()
    })

    it('nullトークンでバリデーションエラーを返す', async () => {
      const request = createRequest({ token: null })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('Expected string')
      expect(mockVerifyPasswordResetToken).not.toHaveBeenCalled()
    })

    it('数値トークンでバリデーションエラーを返す', async () => {
      const request = createRequest({ token: 123 })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('Expected string')
      expect(mockVerifyPasswordResetToken).not.toHaveBeenCalled()
    })
  })
})
