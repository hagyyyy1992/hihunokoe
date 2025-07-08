jest.mock('@api/framework/controllers/ProfileController', () => ({
  ProfileController: jest.fn().mockImplementation(() => ({
    updateProfile: jest.fn().mockImplementation(async request => {
      // Default mock implementation
      return new Response(JSON.stringify({ message: 'Mock response' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }),
  })),
}))

import { NextRequest } from 'next/server'
import { PUT } from '@/app/api/profile/update/route'
import { MOCK_USERS } from '@/lib/mock-data'

// Mock the controller

const createMockResponse = (status, data) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
  })
}

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
        username: 'testuser',
        email: 'test@example.com',
      }

      const mockUser: any = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        skinType: 'normal' as SkinType,
        emailVerified: true,
      }

      // MOCK_USERSにユーザーを追加
      const originalMockUsers = [...MOCK_USERS]
      MOCK_USERS.push(mockUser)

      const updatedUser = {
        ...mockUser,
        username: 'newusername',
        skinType: 'dry',
        updatedAt: new Date(),
      }

      mockUpdateProfile.mockReturnValue(mockDecodedToken)
      mockUpdateProfile.mockResolvedValue(createMockResponse(200, mockUser))
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockPrismaUserUpdate.mockResolvedValue(createMockResponse(200, updatedUser))

      const requestBody = {
        username: 'newusername',
        skinType: 'dry',
      }

      const request = createRequest(requestBody, { 'auth-token': 'valid-token' })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('プロフィールを更新しました')
      expect(data.user).toEqual({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        skinType: updatedUser.skinType,
        emailVerified: updatedUser.emailVerified,
      })

      expect(mockUpdateProfile).toHaveBeenCalledWith('valid-token')
      expect(mockUpdateProfile).toHaveBeenCalledWith('1')
      expect(mockPrismaUserUpdate).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          username: 'newusername',
          skinType: 'dry',
          birthDate: null,
          gender: null,
          allergies: [],
          allergiesOther: null,
          updatedAt: expect.any(Date),
        },
      })
    })

    it('トークンが存在しない場合、401エラーを返す', async () => {
      const requestBody = {
        username: 'newusername',
      }

      const request = createRequest(requestBody)

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('認証が必要です')
      expect(mockUpdateProfile).not.toHaveBeenCalled()
      expect(mockUpdateProfile).not.toHaveBeenCalled()
    })

    it('無効なトークンの場合、401エラーを返す', async () => {
      mockUpdateProfile.mockReturnValue(null)

      const requestBody = {
        username: 'newusername',
      }

      const request = createRequest(requestBody, { 'auth-token': 'invalid-token' })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('トークンが無効です')
      expect(mockUpdateProfile).toHaveBeenCalledWith('invalid-token')
      expect(mockUpdateProfile).not.toHaveBeenCalled()
    })

    it('ユーザーが見つからない場合、404エラーを返す', async () => {
      const mockDecodedToken = {
        id: 'non-existent-user',
        username: 'testuser',
        email: 'test@example.com',
      }

      mockUpdateProfile.mockReturnValue(mockDecodedToken)
      mockUpdateProfile.mockResolvedValue(createMockResponse(200, null))

      const requestBody = {
        username: 'newusername',
      }

      const request = createRequest(requestBody, { 'auth-token': 'valid-token' })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('ユーザーが見つかりません')
      expect(mockUpdateProfile).toHaveBeenCalledWith('non-existent-user')
    })

    it('バリデーションエラーの場合、400エラーを返す', async () => {
      const mockDecodedToken = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
      }

      const mockUser: any = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        skinType: 'normal' as SkinType,
        emailVerified: true,
      }

      mockUpdateProfile.mockReturnValue(mockDecodedToken)
      mockUpdateProfile.mockResolvedValue(createMockResponse(200, mockUser))

      // ユーザー名が短すぎる
      const requestBody = {
        username: 'ab', // 3文字未満
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
        username: 'testuser',
        email: 'test@example.com',
      }

      const mockUser: any = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        skinType: 'normal' as SkinType,
        emailVerified: true,
      }

      // MOCK_USERSにユーザーを追加
      const originalMockUsers = [...MOCK_USERS]
      MOCK_USERS.push(mockUser)

      mockUpdateProfile.mockReturnValue(mockDecodedToken)
      mockUpdateProfile.mockResolvedValue(createMockResponse(200, mockUser))
      mockIsDatabaseAvailable.mockReturnValue(false)

      const requestBody = {
        username: 'newusername',
        skinType: 'dry',
      }

      const request = createRequest(requestBody, { 'auth-token': 'valid-token' })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('プロフィールを更新しました')
      expect(data.user).toEqual({
        ...mockUser,
        username: 'newusername',
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
        username: 'demouser',
        email: 'demo@example.com',
      }

      const mockUser: any = {
        id: 'demo-user-1',
        username: 'demouser',
        email: 'demo@example.com',
        displayName: 'Demo User',
        skinType: 'normal',
        emailVerified: true,
      }

      // デモユーザーをMOCK_USERSに追加
      const originalMockUsers = [...MOCK_USERS]
      MOCK_USERS.push(mockUser)

      mockUpdateProfile.mockReturnValue(mockDecodedToken)
      mockUpdateProfile.mockResolvedValue(createMockResponse(200, mockUser))
      mockIsDatabaseAvailable.mockReturnValue(true)

      const requestBody = {
        username: 'newdemouser',
        skinType: 'dry',
      }

      const request = createRequest(requestBody, { 'auth-token': 'valid-token' })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('プロフィールを更新しました')
      expect(data.user).toEqual({
        ...mockUser,
        username: 'newdemouser',
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
        username: 'testuser',
        email: 'test@example.com',
      }

      const mockUser: any = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        skinType: 'normal' as SkinType,
        emailVerified: true,
      }

      mockUpdateProfile.mockReturnValue(mockDecodedToken)
      mockUpdateProfile.mockResolvedValue(createMockResponse(200, mockUser))
      mockIsDatabaseAvailable.mockReturnValue(true)
      mockPrismaUserUpdate.mockResolvedValue(createMockResponse(500, { error: 'Database error' }))

      const requestBody = {
        username: 'newusername',
      }

      const request = createRequest(requestBody, { 'auth-token': 'valid-token' })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('プロフィールの更新に失敗しました')
    })
  })
})
