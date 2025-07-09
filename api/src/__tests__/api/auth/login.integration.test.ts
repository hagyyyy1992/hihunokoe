import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/login/route'
import {
  AuthenticationUseCase,
  PasswordManagementUseCase,
  EmailVerificationUseCase,
  AccountManagementUseCase,
} from '@api/usecases/auth/interactor'
import {
  InvalidCredentialsError,
  EmailNotVerifiedError,
  AccountLockedError,
  AccountInactiveError,
} from '@api/domain/exceptions/AuthenticationError'

// Mock the entire AuthenticationUseCase module
jest.mock('@api/usecases/auth/interactor')

// Mock all the repository and service implementations
jest.mock('@api/interface-adapters/repositories/UserRepositoryImpl')
jest.mock('@api/interface-adapters/repositories/AuthSessionRepositoryImpl')
jest.mock('@api/interface-adapters/services/PasswordHashServiceImpl')
jest.mock('@api/interface-adapters/services/TokenServiceImpl')
jest.mock('@api/interface-adapters/services/EmailServiceImpl')

describe('/api/auth/login (integration test)', () => {
  let mockAuthenticationUseCase: jest.Mocked<AuthenticationUseCase>

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup the mock for AuthenticationUseCase
    mockAuthenticationUseCase = {
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      getCurrentUser: jest.fn(),
      verifyToken: jest.fn(),
    } as any
    ;(AuthenticationUseCase as jest.MockedClass<typeof AuthenticationUseCase>).mockImplementation(
      () => mockAuthenticationUseCase
    )

    // Mock other use cases
    ;(
      PasswordManagementUseCase as jest.MockedClass<typeof PasswordManagementUseCase>
    ).mockImplementation(() => ({}) as any)
    ;(
      EmailVerificationUseCase as jest.MockedClass<typeof EmailVerificationUseCase>
    ).mockImplementation(() => ({}) as any)
    ;(
      AccountManagementUseCase as jest.MockedClass<typeof AccountManagementUseCase>
    ).mockImplementation(() => ({}) as any)
  })

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  }

  describe('POST', () => {
    it('正常なログインリクエストで成功レスポンスを返す', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        userName: 'testuser',
        role: 'USER' as const,
        emailVerified: true,
      }
      const mockToken = 'mock-jwt-token'

      mockAuthenticationUseCase.login.mockResolvedValue({
        token: mockToken,
        user: mockUser,
      })

      const request = createRequest({
        email: 'test@example.com',
        password: 'password123',
      })

      const response = await POST(request)
      const data = await response.json()

      // Debug logging
      if (response.status !== 200) {
        console.log('Response status:', response.status)
        console.log('Response data:', data)
      }

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        token: mockToken,
        user: mockUser,
      })
      expect(mockAuthenticationUseCase.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    it('メール認証が未完了の場合、403エラーを返す', async () => {
      mockAuthenticationUseCase.login.mockRejectedValue(new EmailNotVerifiedError())

      const request = createRequest({
        email: 'test@example.com',
        password: 'password123',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe(
        'メールアドレスの確認が完了していません。確認メールをご確認ください。'
      )
    })

    it('認証情報が無効な場合、401エラーを返す', async () => {
      mockAuthenticationUseCase.login.mockRejectedValue(new InvalidCredentialsError())

      const request = createRequest({
        email: 'test@example.com',
        password: 'wrongpassword',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('メールアドレスまたはパスワードが間違っています')
    })

    it('アカウントがロックされている場合、423エラーを返す', async () => {
      mockAuthenticationUseCase.login.mockRejectedValue(new AccountLockedError())

      const request = createRequest({
        email: 'test@example.com',
        password: 'password123',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(423)
      expect(data.error).toBe('ログイン試行回数が多すぎるため、アカウントがロックされています')
    })

    it('アカウントが無効な場合、403エラーを返す', async () => {
      mockAuthenticationUseCase.login.mockRejectedValue(new AccountInactiveError())

      const request = createRequest({
        email: 'test@example.com',
        password: 'password123',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('アカウントが無効です')
    })

    it('無効な入力データでバリデーションエラーを返す', async () => {
      const request = createRequest({
        email: '',
        password: '',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email and password are required')
      expect(mockAuthenticationUseCase.login).not.toHaveBeenCalled()
    })

    it('emailが欠如している場合、バリデーションエラーを返す', async () => {
      const request = createRequest({
        password: 'password123',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email and password are required')
    })

    it('passwordが欠如している場合、バリデーションエラーを返す', async () => {
      const request = createRequest({
        email: 'test@example.com',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email and password are required')
    })

    it('サーバーエラーが発生した場合、500エラーを返す', async () => {
      mockAuthenticationUseCase.login.mockRejectedValue(new Error('Database error'))

      const request = createRequest({
        email: 'test@example.com',
        password: 'password123',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('ログイン中にエラーが発生しました')
    })

    it('空のリクエストボディで500エラーを返す', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('ログイン中にエラーが発生しました')
    })

    it('空白のみのリクエストボディで500エラーを返す', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '   ',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('ログイン中にエラーが発生しました')
    })
  })
})
