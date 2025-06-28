import { NextRequest } from 'next/server'

jest.mock('@/lib/auth/auth', () => ({
  verifyToken: jest.fn(),
  getUserById: jest.fn(),
}))

import { UserController } from '../../../framework/controllers/UserController'
import * as auth from '@/lib/auth/auth'

const mockVerifyToken = auth.verifyToken as jest.MockedFunction<typeof auth.verifyToken>
const mockGetUserById = auth.getUserById as jest.MockedFunction<typeof auth.getUserById>

describe('UserController', () => {
  let userController: UserController

  beforeEach(() => {
    userController = new UserController()
    jest.clearAllMocks()
  })

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    userName: 'testuser',
    emailVerified: true,
  }

  describe('getMe', () => {
    it('should return user when authenticated', async () => {
      const request = new NextRequest('http://localhost/api/auth/me')
      request.cookies.set('auth-token', 'valid-token')

      mockVerifyToken.mockReturnValue({ id: '1', userName: 'testuser', email: 'test@example.com' })
      mockGetUserById.mockResolvedValue(mockUser)

      const response = await userController.getMe(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.user.id).toBe('1')
      expect(responseData.user.email).toBe('test@example.com')
      expect(responseData.user.userName).toBe('testuser') // Fixed: userName instead of username
      expect(responseData.user.emailVerified).toBe(true)
    })

    it('should return 401 when no token provided', async () => {
      const request = new NextRequest('http://localhost/api/auth/me')

      const response = await userController.getMe(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toBe('認証が必要です')
    })

    it('should return 401 when token is invalid', async () => {
      const request = new NextRequest('http://localhost/api/auth/me')
      request.cookies.set('auth-token', 'invalid-token')

      mockVerifyToken.mockReturnValue(null)

      const response = await userController.getMe(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toBe('トークンが無効です')
    })

    it('should return 404 when user not found', async () => {
      const request = new NextRequest('http://localhost/api/auth/me')
      request.cookies.set('auth-token', 'valid-token')

      mockVerifyToken.mockReturnValue({
        id: '999',
        userName: 'testuser',
        email: 'test@example.com',
      })
      mockGetUserById.mockResolvedValue(null)

      const response = await userController.getMe(request)
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.error).toBe('ユーザーが見つかりません')
    })

    it('should return 403 when email not verified', async () => {
      const request = new NextRequest('http://localhost/api/auth/me')
      request.cookies.set('auth-token', 'valid-token')

      const unverifiedUser = { ...mockUser, emailVerified: false }
      mockVerifyToken.mockReturnValue({ id: '1', userName: 'testuser', email: 'test@example.com' })
      mockGetUserById.mockResolvedValue(unverifiedUser)

      const response = await userController.getMe(request)
      const responseData = await response.json()

      expect(response.status).toBe(403)
      expect(responseData.error).toBe('メールアドレスの確認が必要です')
    })

    it('should return 500 when unexpected error occurs', async () => {
      const request = new NextRequest('http://localhost/api/auth/me')
      request.cookies.set('auth-token', 'valid-token')

      mockVerifyToken.mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const response = await userController.getMe(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.error).toBe('ユーザー情報の取得に失敗しました')
    })
  })
})
