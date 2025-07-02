// Mock auth module
jest.mock('@/lib/auth/auth', () => ({
  loginUser: jest.fn(),
  registerUser: jest.fn(),
  generateToken: jest.fn(),
}))

jest.mock('@/lib/auth/email-verification', () => ({
  sendVerificationEmail: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { POST as loginPost } from '@/app/api/auth/login/route'
import { POST as registerPost } from '@/app/api/auth/register/route'
import * as authModule from '@/lib/auth/auth'
import * as emailVerificationModule from '@/lib/auth/email-verification'

const mockLoginUser = authModule.loginUser as jest.MockedFunction<typeof authModule.loginUser>
const mockRegisterUser = authModule.registerUser as jest.MockedFunction<
  typeof authModule.registerUser
>
const mockGenerateToken = authModule.generateToken as jest.MockedFunction<
  typeof authModule.generateToken
>
const mockSendVerificationEmail =
  emailVerificationModule.sendVerificationEmail as jest.MockedFunction<
    typeof emailVerificationModule.sendVerificationEmail
  >

describe('Email Verification Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSendVerificationEmail.mockResolvedValue(undefined)
  })

  const createRequest = (url: string, body: any) => {
    return new NextRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  }

  it('新規登録されたユーザーはemailVerified: falseで作成される', async () => {
    const registrationData = {
      userName: 'testuser',
      email: 'test@example.com',
      password: 'SecurePass123!',
    }

    const mockUser = {
      id: '1',
      userName: 'testuser',
      email: 'test@example.com',
      emailVerified: false, // 重要: 新規ユーザーは未認証
    }

    mockRegisterUser.mockResolvedValue(mockUser)

    const request = createRequest('http://localhost:3000/api/auth/register', registrationData)
    const response = await registerPost(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user.emailVerified).toBe(false)
    expect(mockRegisterUser).toHaveBeenCalledWith(registrationData)
  })

  it('メール未認証のユーザーはログインできない', async () => {
    // 本番環境での動作をテストするため、NODE_ENVを一時的に変更
    const originalNodeEnv = process.env.NODE_ENV
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      configurable: true,
    })

    const loginData = {
      email: 'unverified@example.com',
      password: 'password123',
    }

    // メール未認証のユーザーを返すようにモック
    const mockUnverifiedUser = {
      id: '1',
      userName: 'unverifieduser',
      email: 'unverified@example.com',
      emailVerified: false, // 未認証
    }
    mockLoginUser.mockResolvedValue(mockUnverifiedUser)

    const request = createRequest('http://localhost:3000/api/auth/login', loginData)
    const response = await loginPost(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('メールアドレスの確認が完了していません。確認メールをご確認ください。')
    expect(data.emailVerificationRequired).toBe(true)
    expect(mockLoginUser).toHaveBeenCalledWith(loginData)

    // NODE_ENVを元に戻す
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalNodeEnv,
      configurable: true,
    })
  })

  it('メール認証済みのユーザーは正常にログインできる', async () => {
    const loginData = {
      email: 'verified@example.com',
      password: 'password123',
    }

    const mockVerifiedUser = {
      id: '1',
      userName: 'verifieduser',
      email: 'verified@example.com',
      emailVerified: true, // 認証済み
    }
    const mockToken = 'mock-jwt-token'

    mockLoginUser.mockResolvedValue(mockVerifiedUser)
    mockGenerateToken.mockReturnValue(mockToken)

    const request = createRequest('http://localhost:3000/api/auth/login', loginData)
    const response = await loginPost(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user.emailVerified).toBe(true)
    expect(mockLoginUser).toHaveBeenCalledWith(loginData)
  })
})
