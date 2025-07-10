import { NextRequest } from 'next/server'
import { AuthController } from '@api/framework/controllers/AuthController'
import { AuthenticationUseCase } from '@api/usecases/auth/interactor'
import { UserRepository } from '@api/interface-adapters/repositories/User.repository'
import { AuthSessionRepository } from '@api/interface-adapters/repositories/AuthSession.repository'
import { PasswordHashServiceImpl } from '@api/interface-adapters/services/PasswordHashServiceImpl'
import { TokenServiceImpl } from '@api/interface-adapters/services/TokenServiceImpl'
import {
  InvalidCredentialsError,
  EmailNotVerifiedError,
} from '@api/domain/exceptions/AuthenticationError'

// Mock all dependencies
jest.mock('@api/usecases/auth/interactor')
jest.mock('@api/interface-adapters/repositories/User.repository')
jest.mock('@api/interface-adapters/repositories/AuthSession.repository')
jest.mock('@api/interface-adapters/services/PasswordHashServiceImpl')
jest.mock('@api/interface-adapters/services/TokenServiceImpl')
jest.mock('@api/interface-adapters/services/EmailServiceImpl')

describe('AuthController - login', () => {
  let authController: AuthController
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

    authController = new AuthController()
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

  describe('successful login', () => {
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

      const response = await authController.login(request)
      const data = await response.json()

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
  })

  describe('validation errors', () => {
    it('emailが欠如している場合、バリデーションエラーを返す', async () => {
      const request = createRequest({
        password: 'password123',
      })

      const response = await authController.login(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email and password are required')
      expect(mockAuthenticationUseCase.login).not.toHaveBeenCalled()
    })

    it('passwordが欠如している場合、バリデーションエラーを返す', async () => {
      const request = createRequest({
        email: 'test@example.com',
      })

      const response = await authController.login(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email and password are required')
      expect(mockAuthenticationUseCase.login).not.toHaveBeenCalled()
    })

    it('空のemailとpasswordでバリデーションエラーを返す', async () => {
      const request = createRequest({
        email: '',
        password: '',
      })

      const response = await authController.login(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email and password are required')
      expect(mockAuthenticationUseCase.login).not.toHaveBeenCalled()
    })
  })

  describe('authentication errors', () => {
    it('認証情報が無効な場合、401エラーを返す', async () => {
      mockAuthenticationUseCase.login.mockRejectedValue(new InvalidCredentialsError())

      const request = createRequest({
        email: 'test@example.com',
        password: 'wrongpassword',
      })

      const response = await authController.login(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('メールアドレスまたはパスワードが間違っています')
    })

    it('メール認証が未完了の場合、403エラーを返す', async () => {
      mockAuthenticationUseCase.login.mockRejectedValue(new EmailNotVerifiedError())

      const request = createRequest({
        email: 'test@example.com',
        password: 'password123',
      })

      const response = await authController.login(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe(
        'メールアドレスの確認が完了していません。確認メールをご確認ください。'
      )
    })
  })

  describe('server errors', () => {
    it('サーバーエラーが発生した場合、500エラーを返す', async () => {
      mockAuthenticationUseCase.login.mockRejectedValue(new Error('Database error'))

      const request = createRequest({
        email: 'test@example.com',
        password: 'password123',
      })

      const response = await authController.login(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('ログイン中にエラーが発生しました')
    })
  })

  describe('request body handling', () => {
    it('空のリクエストボディで例外を適切に処理する', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '',
      })

      const response = await authController.login(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('ログイン中にエラーが発生しました')
    })

    it('無効なJSONで例外を適切に処理する', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      })

      const response = await authController.login(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('ログイン中にエラーが発生しました')
    })
  })
})
