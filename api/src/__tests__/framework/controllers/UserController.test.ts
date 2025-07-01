import { NextRequest } from 'next/server'

jest.mock('../../../../../src/lib/auth/auth', () => ({
  verifyToken: jest.fn(),
}))

import { UserController } from '../../../framework/controllers/UserController'
import { GetUserInputPort } from '../../../usecases/user/GetUserInputPort'
import { User } from '../../../domain/entities/User'
import * as auth from '../../../../../src/lib/auth/auth'

const mockVerifyToken = auth.verifyToken as jest.MockedFunction<typeof auth.verifyToken>

class MockGetUserInputPort implements GetUserInputPort {
  private mockExecute = jest.fn()

  async execute(input: { userId: string }): Promise<{ user: User }> {
    return this.mockExecute(input)
  }

  getMockExecute() {
    return this.mockExecute
  }
}

describe('UserController', () => {
  let userController: UserController
  let mockGetUserInputPort: MockGetUserInputPort

  beforeEach(() => {
    mockGetUserInputPort = new MockGetUserInputPort()
    userController = new UserController(mockGetUserInputPort)
    jest.clearAllMocks()
  })

  const mockDomainUser: User = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  describe('getMe', () => {
    it('should return user when authenticated', async () => {
      const request = new NextRequest('http://localhost/api/auth/me')
      request.cookies.set('auth-token', 'valid-token')

      mockVerifyToken.mockReturnValue({ id: '1', userName: 'testuser', email: 'test@example.com' })
      mockGetUserInputPort.getMockExecute().mockResolvedValue({ user: mockDomainUser })

      const response = await userController.getMe(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.user.id).toBe('1')
      expect(responseData.user.email).toBe('test@example.com')
      expect(responseData.user.userName).toBe('testuser')
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
      mockGetUserInputPort.getMockExecute().mockRejectedValue(new Error('ユーザーが見つかりません'))

      const response = await userController.getMe(request)
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.error).toBe('ユーザーが見つかりません')
    })

    it('should return 403 when email not verified', async () => {
      const request = new NextRequest('http://localhost/api/auth/me')
      request.cookies.set('auth-token', 'valid-token')

      mockVerifyToken.mockReturnValue({ id: '1', userName: 'testuser', email: 'test@example.com' })
      mockGetUserInputPort
        .getMockExecute()
        .mockRejectedValue(new Error('メールアドレスの確認が必要です'))

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
