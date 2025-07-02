// Mock the auth module first
jest.mock('@/lib/auth/auth', () => ({
  verifyToken: jest.fn(),
  getUserById: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/v2/auth/me/route'
import * as authModule from '@/lib/auth/auth'

const mockVerifyToken = authModule.verifyToken as jest.MockedFunction<typeof authModule.verifyToken>
const mockGetUserById = authModule.getUserById as jest.MockedFunction<typeof authModule.getUserById>

describe.skip('/api/v2/auth/me', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createRequest = (cookies?: { [key: string]: string }) => {
    const headers = new Headers()
    if (cookies) {
      const cookieString = Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ')
      headers.set('Cookie', cookieString)
    }

    return new NextRequest('http://localhost:3000/api/v2/auth/me', {
      method: 'GET',
      headers,
    })
  }

  describe('GET', () => {
    it('有効なトークンでユーザー情報を返す（クリーンアーキテクチャ版）', async () => {
      const mockDecodedToken = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
      }

      const mockUser = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
        emailVerified: true,
      }

      mockVerifyToken.mockReturnValue(mockDecodedToken)
      mockGetUserById.mockResolvedValue(mockUser)

      const request = createRequest({ 'auth-token': 'valid-token' })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // クリーンアーキテクチャでは、ユーザーオブジェクトの形式が変更された
      expect(data.user.id).toBe('1')
      expect(data.user.email).toBe('test@example.com')
      expect(data.user.userName).toBe('testuser') // Fixed: userName instead of username
      expect(data.user.emailVerified).toBe(true)
      // Note: createdAt and updatedAt are no longer exposed in the AuthUser interface
      expect(data.user).not.toHaveProperty('createdAt')
      expect(data.user).not.toHaveProperty('updatedAt')
      expect(mockVerifyToken).toHaveBeenCalledWith('valid-token')
      expect(mockGetUserById).toHaveBeenCalledWith('1')
    })

    it('トークンが存在しない場合、401エラーを返す', async () => {
      const request = createRequest()

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('認証が必要です')
    })

    it('無効なトークンの場合、401エラーを返す', async () => {
      mockVerifyToken.mockReturnValue(null)

      const request = createRequest({ 'auth-token': 'invalid-token' })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('トークンが無効です')
    })

    it('ユーザーが見つからない場合、404エラーを返す', async () => {
      const mockDecodedToken = {
        id: '999',
        userName: 'testuser',
        email: 'test@example.com',
      }

      mockVerifyToken.mockReturnValue(mockDecodedToken)
      mockGetUserById.mockResolvedValue(null)

      const request = createRequest({ 'auth-token': 'valid-token' })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('ユーザーが見つかりません')
    })

    it('メール認証が未完了の場合、403エラーを返す', async () => {
      const mockDecodedToken = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
      }

      const mockUser = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
        emailVerified: false,
      }

      mockVerifyToken.mockReturnValue(mockDecodedToken)
      mockGetUserById.mockResolvedValue(mockUser)

      const request = createRequest({ 'auth-token': 'valid-token' })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('メールアドレスの確認が必要です')
    })
  })
})
