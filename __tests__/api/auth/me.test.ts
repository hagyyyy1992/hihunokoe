// Mock the auth module first
jest.mock('../../../src/lib/auth/auth', () => ({
  verifyToken: jest.fn(),
  getUserById: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { GET } from '../../../src/app/api/auth/me/route'
import * as authModule from '../../../src/lib/auth/auth'

const mockVerifyToken = authModule.verifyToken as jest.MockedFunction<typeof authModule.verifyToken>
const mockGetUserById = authModule.getUserById as jest.MockedFunction<typeof authModule.getUserById>

describe('/api/auth/me', () => {
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

    return new NextRequest('http://localhost:3000/api/auth/me', {
      method: 'GET',
      headers,
    })
  }

  describe('GET', () => {
    it('有効なトークンでユーザー情報を返す', async () => {
      const mockDecodedToken = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
      }

      const mockUser = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User',
        skinType: 'normal',
        emailVerified: true,
      }

      mockVerifyToken.mockReturnValue(mockDecodedToken)
      mockGetUserById.mockResolvedValue(mockUser)

      const request = createRequest({ 'auth-token': 'valid-token' })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user).toEqual(mockUser)
      expect(mockVerifyToken).toHaveBeenCalledWith('valid-token')
      expect(mockGetUserById).toHaveBeenCalledWith('1')
    })

    it('トークンが存在しない場合、401エラーを返す', async () => {
      const request = createRequest()

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('認証が必要です')
      expect(mockVerifyToken).not.toHaveBeenCalled()
      expect(mockGetUserById).not.toHaveBeenCalled()
    })

    it('無効なトークンの場合、401エラーを返す', async () => {
      mockVerifyToken.mockReturnValue(null)

      const request = createRequest({ 'auth-token': 'invalid-token' })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('トークンが無効です')
      expect(mockVerifyToken).toHaveBeenCalledWith('invalid-token')
      expect(mockGetUserById).not.toHaveBeenCalled()
    })

    it('ユーザーが見つからない場合、404エラーを返す', async () => {
      const mockDecodedToken = {
        id: 'non-existent-user',
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
      expect(mockGetUserById).toHaveBeenCalledWith('non-existent-user')
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
        displayName: 'Test User',
        skinType: 'normal',
        emailVerified: false, // メール認証未完了
      }

      mockVerifyToken.mockReturnValue(mockDecodedToken)
      mockGetUserById.mockResolvedValue(mockUser)

      const request = createRequest({ 'auth-token': 'valid-token' })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('メールアドレスの確認が必要です')
    })

    it('getUserByIdでエラーが発生した場合、500エラーを返す', async () => {
      const mockDecodedToken = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
      }

      mockVerifyToken.mockReturnValue(mockDecodedToken)
      mockGetUserById.mockRejectedValue(new Error('Database error'))

      const request = createRequest({ 'auth-token': 'valid-token' })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('ユーザー情報の取得に失敗しました')
    })

    it('verifyTokenでエラーが発生した場合、500エラーを返す', async () => {
      mockVerifyToken.mockImplementation(() => {
        throw new Error('Token verification error')
      })

      const request = createRequest({ 'auth-token': 'valid-token' })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('ユーザー情報の取得に失敗しました')
    })

    it('空のトークンの場合、401エラーを返す', async () => {
      const request = createRequest({ 'auth-token': '' })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('認証が必要です')
    })
  })
})
