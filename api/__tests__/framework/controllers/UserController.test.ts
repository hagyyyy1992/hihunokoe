import { NextRequest } from 'next/server'
import { UserController } from '@api/framework/controllers/UserController'
import { IGetUserInputPort } from '@api/usecases/user/input-port'
import { User } from '@api/domain/entities/User'
import { ITokenService } from '@api/domain/services/TokenService'

class MockGetUserInputPort implements IGetUserInputPort {
  private mockExecute = jest.fn()

  async execute(input: { userId: string }): Promise<{ user: User }> {
    return this.mockExecute(input)
  }

  getMockExecute() {
    return this.mockExecute
  }
}

class MockTokenService implements ITokenService {
  private mockGenerateToken = jest.fn()
  private mockVerifyToken = jest.fn()
  private mockGenerateRandomToken = jest.fn()
  private mockVerifyAuthToken = jest.fn()
  private mockGeneratePasswordResetToken = jest.fn()
  private mockVerifyPasswordResetToken = jest.fn()
  private mockInvalidatePasswordResetToken = jest.fn()
  private mockGenerateEmailToken = jest.fn()
  private mockGenerateEmailVerificationToken = jest.fn()
  private mockVerifyEmailToken = jest.fn()
  private mockInvalidateEmailToken = jest.fn()

  async generateToken(payload: any): Promise<string> {
    return this.mockGenerateToken(payload)
  }

  async verifyToken(token: string): Promise<any> {
    return this.mockVerifyToken(token)
  }

  generateRandomToken(): string {
    return this.mockGenerateRandomToken()
  }

  async verifyAuthToken(token: string): Promise<string | null> {
    return this.mockVerifyAuthToken(token)
  }

  async generatePasswordResetToken(userId: string): Promise<string> {
    return this.mockGeneratePasswordResetToken(userId)
  }

  async verifyPasswordResetToken(token: string): Promise<string | null> {
    return this.mockVerifyPasswordResetToken(token)
  }

  async invalidatePasswordResetToken(token: string): Promise<void> {
    return this.mockInvalidatePasswordResetToken(token)
  }

  async generateEmailToken(userId: string): Promise<string> {
    return this.mockGenerateEmailToken(userId)
  }

  async generateEmailVerificationToken(userId: string): Promise<string> {
    return this.mockGenerateEmailVerificationToken(userId)
  }

  async verifyEmailToken(token: string): Promise<string | null> {
    return this.mockVerifyEmailToken(token)
  }

  async invalidateEmailToken(token: string): Promise<void> {
    return this.mockInvalidateEmailToken(token)
  }

  getMockVerifyToken() {
    return this.mockVerifyToken
  }
}

describe('UserController', () => {
  let userController: UserController
  let mockGetUserInputPort: MockGetUserInputPort
  let mockTokenService: MockTokenService

  beforeEach(() => {
    mockGetUserInputPort = new MockGetUserInputPort()
    mockTokenService = new MockTokenService()
    userController = new UserController(mockGetUserInputPort, mockTokenService)
    jest.clearAllMocks()
  })

  const mockDomainUser: User = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    emailVerified: true,
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any

  describe('getMe', () => {
    it('認証されたユーザー情報を返す（Cookieからトークン取得）', async () => {
      const request = new NextRequest('http://localhost/api/auth/me')
      const cookieStore = request.cookies
      cookieStore.set('auth-token', 'valid-token')

      mockTokenService.getMockVerifyToken().mockResolvedValue({
        userId: '1',
        userName: 'testuser',
        email: 'test@example.com',
      })
      mockGetUserInputPort.getMockExecute().mockResolvedValue({ user: mockDomainUser })

      const response = await userController.getMe(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.user.id).toBe('1')
      expect(responseData.user.email).toBe('test@example.com')
      expect(responseData.user.userName).toBe('testuser')
      expect(responseData.user.emailVerified).toBe(true)
    })

    it('認証されたユーザー情報を返す（Authorizationヘッダーからトークン取得）', async () => {
      const request = new NextRequest('http://localhost/api/auth/me', {
        headers: {
          authorization: 'Bearer valid-token',
        },
      })

      mockTokenService.getMockVerifyToken().mockResolvedValue({
        userId: '1',
        userName: 'testuser',
        email: 'test@example.com',
      })
      mockGetUserInputPort.getMockExecute().mockResolvedValue({ user: mockDomainUser })

      const response = await userController.getMe(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.user.id).toBe('1')
      expect(responseData.user.email).toBe('test@example.com')
      expect(responseData.user.userName).toBe('testuser')
      expect(responseData.user.emailVerified).toBe(true)
    })

    it('トークンがない場合は401を返す', async () => {
      const request = new NextRequest('http://localhost/api/auth/me')

      const response = await userController.getMe(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toBe('認証が必要です')
    })

    it('トークンが無効な場合は401を返す', async () => {
      const request = new NextRequest('http://localhost/api/auth/me')
      const cookieStore = request.cookies
      cookieStore.set('auth-token', 'invalid-token')

      mockTokenService.getMockVerifyToken().mockRejectedValue(new Error('Invalid token'))

      const response = await userController.getMe(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toBe('トークンが無効です')
    })

    it('ユーザーが見つからない場合は404を返す', async () => {
      const request = new NextRequest('http://localhost/api/auth/me')
      const cookieStore = request.cookies
      cookieStore.set('auth-token', 'valid-token')

      mockTokenService.getMockVerifyToken().mockResolvedValue({
        userId: '999',
        userName: 'testuser',
        email: 'test@example.com',
      })
      mockGetUserInputPort.getMockExecute().mockRejectedValue(new Error('ユーザーが見つかりません'))

      const response = await userController.getMe(request)
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.error).toBe('ユーザーが見つかりません')
    })

    it('メール未確認の場合は403を返す', async () => {
      const request = new NextRequest('http://localhost/api/auth/me')
      const cookieStore = request.cookies
      cookieStore.set('auth-token', 'valid-token')

      mockTokenService.getMockVerifyToken().mockResolvedValue({
        userId: '1',
        userName: 'testuser',
        email: 'test@example.com',
      })
      mockGetUserInputPort
        .getMockExecute()
        .mockRejectedValue(new Error('メールアドレスの確認が必要です'))

      const response = await userController.getMe(request)
      const responseData = await response.json()

      expect(response.status).toBe(403)
      expect(responseData.error).toBe('メールアドレスの確認が必要です')
    })

    it('予期しないエラーの場合は500を返す', async () => {
      const request = new NextRequest('http://localhost/api/auth/me')
      const cookieStore = request.cookies
      cookieStore.set('auth-token', 'valid-token')

      mockTokenService.getMockVerifyToken().mockRejectedValue(new Error('Unexpected error'))

      const response = await userController.getMe(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toBe('トークンが無効です')
    })
  })
})
