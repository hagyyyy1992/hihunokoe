// Mock the modules first
jest.mock('../../../src/lib/auth/email-verification', () => ({
  verifyEmailToken: jest.fn(),
}))

jest.mock('../../../src/lib/auth/auth', () => ({
  generateToken: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { GET } from '../../../src/app/api/auth/verify-email/route'
import * as emailVerificationModule from '../../../src/lib/auth/email-verification'
import * as authModule from '../../../src/lib/auth/auth'

const mockVerifyEmailToken = emailVerificationModule.verifyEmailToken as jest.MockedFunction<
  typeof emailVerificationModule.verifyEmailToken
>
const mockGenerateToken = authModule.generateToken as jest.MockedFunction<
  typeof authModule.generateToken
>

describe('/api/auth/verify-email', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createRequest = (token?: string) => {
    const url = token
      ? `http://localhost:3000/api/auth/verify-email?token=${token}`
      : 'http://localhost:3000/api/auth/verify-email'

    return new NextRequest(url, { method: 'GET' })
  }

  describe('GET', () => {
    it('有効なトークンでメール認証が成功する', async () => {
      const mockUser = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User',
        skinType: 'normal',
        emailVerified: true,
      }

      const mockResult = {
        success: true,
        message: 'メールアドレスが確認されました',
        user: mockUser,
      }

      const mockAuthToken = 'mock-auth-token'

      mockVerifyEmailToken.mockResolvedValue(mockResult)
      mockGenerateToken.mockReturnValue(mockAuthToken)

      const request = createRequest('valid-verification-token')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('メールアドレスが確認されました')
      expect(data.user).toEqual({
        id: mockUser.id,
        userName: mockUser.userName,
        email: mockUser.email,
        skinType: mockUser.skinType,
        emailVerified: mockUser.emailVerified,
      })
      expect(mockVerifyEmailToken).toHaveBeenCalledWith('valid-verification-token')
      expect(mockGenerateToken).toHaveBeenCalledWith(mockUser)

      // Check auth token cookie is set
      const cookies = response.headers.get('set-cookie')
      expect(cookies).toContain('auth-token=mock-auth-token')
      expect(cookies).toContain('HttpOnly')
      expect(cookies).toContain('SameSite=lax')
      expect(cookies).toContain('Max-Age=604800') // 7 days
    })

    it('トークンが提供されていない場合、400エラーを返す', async () => {
      const request = createRequest()

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('トークンが提供されていません')
      expect(mockVerifyEmailToken).not.toHaveBeenCalled()
    })

    it('無効なトークンの場合、400エラーを返す', async () => {
      const mockResult = {
        success: false,
        message: 'トークンが無効または期限切れです',
      }

      mockVerifyEmailToken.mockResolvedValue(mockResult)

      const request = createRequest('invalid-token')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('トークンが無効または期限切れです')
      expect(mockVerifyEmailToken).toHaveBeenCalledWith('invalid-token')
    })

    it('期限切れトークンの場合、400エラーを返す', async () => {
      const mockResult = {
        success: false,
        message: 'トークンの有効期限が切れています',
      }

      mockVerifyEmailToken.mockResolvedValue(mockResult)

      const request = createRequest('expired-token')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('トークンの有効期限が切れています')
    })

    it('ユーザー情報なしで成功メッセージのみ返す', async () => {
      const mockResult = {
        success: true,
        message: 'メールアドレスが確認されました',
        user: undefined,
      }

      mockVerifyEmailToken.mockResolvedValue(mockResult)

      const request = createRequest('valid-token-no-user')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('メールアドレスが確認されました')
      expect(data.user).toBeUndefined()
      expect(mockGenerateToken).not.toHaveBeenCalled()

      // Auth token should not be set
      const cookies = response.headers.get('set-cookie')
      expect(cookies).toBeNull()
    })

    it('verifyEmailTokenでエラーが発生した場合、500エラーを返す', async () => {
      mockVerifyEmailToken.mockRejectedValue(new Error('Database error'))

      const request = createRequest('valid-token')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('メールアドレスの確認に失敗しました')
    })

    it('本番環境でSecureクッキーが設定される', async () => {
      const originalEnv = process.env.NODE_ENV
      const mockEnv = { ...process.env, NODE_ENV: 'production' as const }
      jest.replaceProperty(process, 'env', mockEnv as NodeJS.ProcessEnv)

      const mockUser = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User',
        skinType: 'normal',
        emailVerified: true,
      }

      const mockResult = {
        success: true,
        message: 'メールアドレスが確認されました',
        user: mockUser,
      }

      mockVerifyEmailToken.mockResolvedValue(mockResult)
      mockGenerateToken.mockReturnValue('mock-token')

      const request = createRequest('valid-token')
      const response = await GET(request)

      const cookies = response.headers.get('set-cookie')
      expect(cookies).toContain('Secure')

      // Restore original environment
      jest.replaceProperty(process, 'env', {
        ...process.env,
        NODE_ENV: originalEnv as 'development' | 'production' | 'test',
      } as NodeJS.ProcessEnv)
    })

    it('空のトークンの場合、400エラーを返す', async () => {
      const request = createRequest('')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('トークンが提供されていません')
    })

    it('generateTokenでエラーが発生した場合、500エラーを返す', async () => {
      const mockUser = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User',
        skinType: 'normal',
        emailVerified: true,
      }

      const mockResult = {
        success: true,
        message: 'メールアドレスが確認されました',
        user: mockUser,
      }

      mockVerifyEmailToken.mockResolvedValue(mockResult)
      mockGenerateToken.mockImplementation(() => {
        throw new Error('Token generation error')
      })

      const request = createRequest('valid-token')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('メールアドレスの確認に失敗しました')
    })
  })
})
