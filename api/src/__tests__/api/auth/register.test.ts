// Mock the AuthController before importing the route
let mockRegister = jest.fn()

jest.mock('@api/framework/controllers/AuthController', () => {
  return {
    AuthController: jest.fn().mockImplementation(() => ({
      register: (...args: any[]) => mockRegister(...args),
      login: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      verifyEmail: jest.fn(),
      logout: jest.fn(),
      getCurrentUser: jest.fn(),
      deleteAccount: jest.fn(),
      resendVerificationEmail: jest.fn(),
      verifyPasswordResetToken: jest.fn(),
    })),
  }
})

import { NextRequest, NextResponse } from 'next/server'
import { POST } from '@/app/api/auth/register/route'

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset the mock function
    mockRegister = jest.fn()
  })

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  }

  const createMockResponse = (status: number, body: any) => {
    return NextResponse.json(body, { status })
  }

  const validRegistrationData = {
    username: 'demouser',
    email: 'demo@example.com',
    password: 'SecurePass123!',
  }

  describe('POST', () => {
    it('正常なユーザー登録リクエストで成功レスポンスを返す', async () => {
      const mockResponse = createMockResponse(200, {
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        userId: '1',
      })
      mockRegister.mockResolvedValue(mockResponse)

      const request = createRequest(validRegistrationData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe(
        'Registration successful. Please check your email to verify your account.'
      )
      expect(data.userId).toBe('1')
      expect(mockRegister).toHaveBeenCalledWith(request)
    })

    it('最小限の必須フィールドでユーザー登録が成功する', async () => {
      const minimalData = {
        username: 'demouser',
        email: 'demo@example.com',
        password: 'SecurePass123!',
      }

      const mockResponse = createMockResponse(200, {
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        userId: '1',
      })
      mockRegister.mockResolvedValue(mockResponse)

      const request = createRequest(minimalData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.userId).toBe('1')
    })

    it('ユーザー名が不足している場合、バリデーションエラーを返す', async () => {
      const invalidData = {
        email: 'demo@example.com',
        password: 'SecurePass123!',
      }

      const mockResponse = createMockResponse(400, {
        error: 'メールアドレス、ユーザー名、パスワードは必須です',
      })
      mockRegister.mockResolvedValue(mockResponse)

      const request = createRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('メールアドレス、ユーザー名、パスワードは必須です')
    })

    it('無効なメールアドレスでバリデーションエラーを返す', async () => {
      const invalidData = {
        username: 'demouser',
        email: 'invalid-email',
        password: 'SecurePass123!',
      }

      const mockResponse = createMockResponse(400, {
        error: '無効なメールアドレス形式です',
      })
      mockRegister.mockResolvedValue(mockResponse)

      const request = createRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('無効なメールアドレス形式です')
    })

    it('パスワードが要件を満たさない場合、エラーを返す', async () => {
      const invalidData = {
        username: 'demouser',
        email: 'demo@example.com',
        password: '1234567', // 短すぎる
      }

      const mockResponse = createMockResponse(400, {
        error: 'パスワードは8文字以上で入力してください',
      })
      mockRegister.mockResolvedValue(mockResponse)

      const request = createRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('パスワードは8文字以上で入力してください')
    })

    it('メールアドレスが重複している場合、409エラーを返す', async () => {
      const mockResponse = createMockResponse(409, {
        error: 'ユーザー名またはメールアドレスが既に使用されています',
      })
      mockRegister.mockResolvedValue(mockResponse)

      const request = createRequest(validRegistrationData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('ユーザー名またはメールアドレスが既に使用されています')
    })

    it('ユーザー名が重複している場合、409エラーを返す', async () => {
      const mockResponse = createMockResponse(409, {
        error: 'ユーザー名またはメールアドレスが既に使用されています',
      })
      mockRegister.mockResolvedValue(mockResponse)

      const request = createRequest(validRegistrationData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('ユーザー名またはメールアドレスが既に使用されています')
    })

    it('必須フィールドが欠如している場合、バリデーションエラーを返す', async () => {
      const incompleteData = {
        email: 'demo@example.com',
        password: 'password123',
        // username が欠如
      }

      const mockResponse = createMockResponse(400, {
        error: 'メールアドレス、ユーザー名、パスワードは必須です',
      })
      mockRegister.mockResolvedValue(mockResponse)

      const request = createRequest(incompleteData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('メールアドレス、ユーザー名、パスワードは必須です')
    })

    it('サーバーエラーが発生した場合、500エラーを返す', async () => {
      const mockResponse = createMockResponse(500, {
        error: 'An error occurred during registration',
      })
      mockRegister.mockResolvedValue(mockResponse)

      const request = createRequest(validRegistrationData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('An error occurred during registration')
    })

    it('空のリクエストボディでエラーを返す', async () => {
      const mockResponse = createMockResponse(400, {
        error: 'メールアドレス、ユーザー名、パスワードは必須です',
      })
      mockRegister.mockResolvedValue(mockResponse)

      const request = createRequest({})
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('メールアドレス、ユーザー名、パスワードは必須です')
    })

    it('パスワード強度のエラーメッセージが正しく返される', async () => {
      const invalidData = {
        username: 'demouser',
        email: 'demo@example.com',
        password: 'weak',
      }

      const mockResponse = createMockResponse(400, {
        error: 'パスワードは8文字以上で入力してください',
      })
      mockRegister.mockResolvedValue(mockResponse)

      const request = createRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('パスワードは8文字以上で入力してください')
    })

    it('特殊文字を含むユーザー名でもエラーなく登録できる', async () => {
      const dataWithSpecialChars = {
        username: 'demo_user-123',
        email: 'demo@example.com',
        password: 'SecurePass123!',
      }

      const mockResponse = createMockResponse(200, {
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        userId: '1',
      })
      mockRegister.mockResolvedValue(mockResponse)

      const request = createRequest(dataWithSpecialChars)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})
