// Mock the auth module first
jest.mock('@/lib/auth/auth', () => ({
  verifyToken: jest.fn(),
  getUserById: jest.fn(),
}))

// Mock the prisma module
jest.mock('@/lib/prisma', () => {
  return {
    prisma: {
      user: {
        update: jest.fn(),
      },
    },
    isDatabaseAvailable: jest.fn(),
  }
})

import { NextRequest } from 'next/server'
import { PUT } from '../../../src/app/api/profile/update/route'
import * as authModule from '@/lib/auth/auth'
import { SkinType } from '@/types'
import * as prismaModule from '@/lib/prisma'
import { MOCK_USERS } from '@/lib/mock-data'

const mockVerifyToken = authModule.verifyToken as jest.MockedFunction<typeof authModule.verifyToken>
const mockGetUserById = authModule.getUserById as jest.MockedFunction<typeof authModule.getUserById>
const mockIsDatabaseAvailable = prismaModule.isDatabaseAvailable as jest.MockedFunction<
  typeof prismaModule.isDatabaseAvailable
>
const mockPrismaUserUpdate = prismaModule.prisma?.user.update as jest.MockedFunction<any>

describe('/api/profile/update', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createRequest = (body: any, cookies?: { [key: string]: string }) => {
    const headers = new Headers()
    if (cookies) {
      const cookieString = Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ')
      headers.set('Cookie', cookieString)
    }

    return new NextRequest('http://localhost:3000/api/profile/update', {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    })
  }

  describe('PUT', () => {
    it('有効なデータでプロフィールを更新する', async () => {
      const mockDecodedToken = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
      }

      const mockUser: any = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
        skinType: 'normal' as SkinType,
        emailVerified: true,
      }

      // MOCK_USERSにユーザーを追加
      const originalMockUsers = [...MOCK_USERS]
      MOCK_USERS.push(mockUser)

      const updatedUser = {
        ...mockUser,
        userName: 'newusername',
        skinType: 'dry',
        updatedAt: new Date(),
      }

      mockVerifyToken.mockReturnValue(mockDecodedToken)
      mockGetUserById.mockResolvedValue(mockUser)
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockPrismaUserUpdate.mockResolvedValue(updatedUser)

      const requestBody = {
        userName: 'newusername',
        skinType: 'dry',
      }

      const request = createRequest(requestBody, { 'auth-token': 'valid-token' })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('プロフィールを更新しました')
      expect(data.user).toEqual({
        id: updatedUser.id,
        userName: updatedUser.userName,
        email: updatedUser.email,
        skinType: updatedUser.skinType,
        emailVerified: updatedUser.emailVerified,
      })

      expect(mockVerifyToken).toHaveBeenCalledWith('valid-token')
      expect(mockGetUserById).toHaveBeenCalledWith('1')
      expect(mockPrismaUserUpdate).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          userName: 'newusername',
          skinType: 'dry',
          updatedAt: expect.any(Date),
        },
      })
    })

    it('トークンが存在しない場合、401エラーを返す', async () => {
      const requestBody = {
        userName: 'newusername',
      }

      const request = createRequest(requestBody)

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('認証が必要です')
      expect(mockVerifyToken).not.toHaveBeenCalled()
      expect(mockGetUserById).not.toHaveBeenCalled()
    })

    it('無効なトークンの場合、401エラーを返す', async () => {
      mockVerifyToken.mockReturnValue(null)

      const requestBody = {
        userName: 'newusername',
      }

      const request = createRequest(requestBody, { 'auth-token': 'invalid-token' })

      const response = await PUT(request)
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

      const requestBody = {
        userName: 'newusername',
      }

      const request = createRequest(requestBody, { 'auth-token': 'valid-token' })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('ユーザーが見つかりません')
      expect(mockGetUserById).toHaveBeenCalledWith('non-existent-user')
    })

    it('バリデーションエラーの場合、400エラーを返す', async () => {
      const mockDecodedToken = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
      }

      const mockUser: any = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
        skinType: 'normal' as SkinType,
        emailVerified: true,
      }

      mockVerifyToken.mockReturnValue(mockDecodedToken)
      mockGetUserById.mockResolvedValue(mockUser)

      // ユーザー名が短すぎる
      const requestBody = {
        userName: 'ab', // 3文字未満
      }

      const request = createRequest(requestBody, { 'auth-token': 'valid-token' })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('入力データが無効です')
      expect(data.details).toBeDefined()
    })

    it('データベースが利用できない場合、モックレスポンスを返す', async () => {
      const mockDecodedToken = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
      }

      const mockUser: any = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
        skinType: 'normal' as SkinType,
        emailVerified: true,
      }

      // MOCK_USERSにユーザーを追加
      const originalMockUsers = [...MOCK_USERS]
      MOCK_USERS.push(mockUser)

      mockVerifyToken.mockReturnValue(mockDecodedToken)
      mockGetUserById.mockResolvedValue(mockUser)
      mockIsDatabaseAvailable.mockReturnValue(false)

      const requestBody = {
        userName: 'newusername',
        skinType: 'dry',
      }

      const request = createRequest(requestBody, { 'auth-token': 'valid-token' })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('プロフィールを更新しました')
      expect(data.user).toEqual({
        ...mockUser,
        userName: 'newusername',
        skinType: 'dry',
      })

      // データベース更新は呼ばれていないことを確認
      expect(mockPrismaUserUpdate).not.toHaveBeenCalled()

      // テスト後にMOCK_USERSを元に戻す
      MOCK_USERS.length = 0
      MOCK_USERS.push(...originalMockUsers)
    })

    it('デモユーザーの場合、モックレスポンスを返す', async () => {
      const mockDecodedToken = {
        id: 'demo-user-1',
        userName: 'demouser',
        email: 'demo@example.com',
      }

      const mockUser: any = {
        id: 'demo-user-1',
        userName: 'demouser',
        email: 'demo@example.com',
        displayName: 'Demo User',
        skinType: 'normal',
        emailVerified: true,
      }

      // デモユーザーをMOCK_USERSに追加
      const originalMockUsers = [...MOCK_USERS]
      MOCK_USERS.push(mockUser)

      mockVerifyToken.mockReturnValue(mockDecodedToken)
      mockGetUserById.mockResolvedValue(mockUser)
      mockIsDatabaseAvailable.mockReturnValue(true)

      const requestBody = {
        userName: 'newdemouser',
        skinType: 'dry',
      }

      const request = createRequest(requestBody, { 'auth-token': 'valid-token' })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('プロフィールを更新しました')
      expect(data.user).toEqual({
        ...mockUser,
        userName: 'newdemouser',
        skinType: 'dry',
      })

      // データベース更新は呼ばれていないことを確認
      expect(mockPrismaUserUpdate).not.toHaveBeenCalled()

      // テスト後にMOCK_USERSを元に戻す
      MOCK_USERS.length = 0
      MOCK_USERS.push(...originalMockUsers)
    })

    it('データベースエラーの場合、500エラーを返す', async () => {
      const mockDecodedToken = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
      }

      const mockUser: any = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
        skinType: 'normal' as SkinType,
        emailVerified: true,
      }

      mockVerifyToken.mockReturnValue(mockDecodedToken)
      mockGetUserById.mockResolvedValue(mockUser)
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockPrismaUserUpdate.mockRejectedValue(new Error('Database error'))

      const requestBody = {
        userName: 'newusername',
      }

      const request = createRequest(requestBody, { 'auth-token': 'valid-token' })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('プロフィールの更新に失敗しました')
    })
  })
})
