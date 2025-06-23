// Mock the auth module first
jest.mock('../../../src/lib/auth/auth', () => ({
  loginUser: jest.fn(),
  generateToken: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { POST } from '../../../src/app/api/auth/login/route'
import * as authModule from '../../../src/lib/auth/auth'

const mockLoginUser = authModule.loginUser as jest.MockedFunction<typeof authModule.loginUser>
const mockGenerateToken = authModule.generateToken as jest.MockedFunction<
  typeof authModule.generateToken
>

describe('/api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
        userName: 'testuser',
        email: 'test@example.com',
        emailVerified: true,
      }
      const mockToken = 'mock-jwt-token'

      mockLoginUser.mockResolvedValue(mockUser)
      mockGenerateToken.mockReturnValue(mockToken)

      const request = createRequest({
        email: 'test@example.com',
        password: 'password123',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user).toEqual(mockUser)
      expect(data.message).toBe('ログインしました')
      expect(mockLoginUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(mockGenerateToken).toHaveBeenCalledWith(mockUser)
    })

    it('メール認証が未完了の場合、403エラーを返す', async () => {
      const mockUser = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
        emailVerified: false,
      }

      mockLoginUser.mockResolvedValue(mockUser)

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
      expect(data.emailVerificationRequired).toBe(true)
      expect(data.email).toBe('test@example.com')
    })

    it('認証情報が無効な場合、401エラーを返す', async () => {
      mockLoginUser.mockResolvedValue(null)

      const request = createRequest({
        email: 'test@example.com',
        password: 'wrongpassword',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('メールアドレスまたはパスワードが間違っています')
    })

    it('無効な入力データでバリデーションエラーを返す', async () => {
      const request = createRequest({
        email: 'invalid-email',
        password: '',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('入力内容に誤りがあります')
      expect(data.details).toBeDefined()
    })

    it('emailが欠如している場合、バリデーションエラーを返す', async () => {
      const request = createRequest({
        password: 'password123',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('入力内容に誤りがあります')
    })

    it('passwordが欠如している場合、バリデーションエラーを返す', async () => {
      const request = createRequest({
        email: 'test@example.com',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('入力内容に誤りがあります')
    })

    it('サーバーエラーが発生した場合、500エラーを返す', async () => {
      mockLoginUser.mockRejectedValue(new Error('Database error'))

      const request = createRequest({
        email: 'test@example.com',
        password: 'password123',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('ログインに失敗しました')
    })
  })
})
