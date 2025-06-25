// Mock the auth module first
jest.mock('../../../src/lib/auth/auth', () => ({
  registerUser: jest.fn(),
  generateToken: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { POST } from '../../../src/app/api/auth/register/route'
import * as authModule from '../../../src/lib/auth/auth'

const mockRegisterUser = authModule.registerUser as jest.MockedFunction<
  typeof authModule.registerUser
>
const mockGenerateToken = authModule.generateToken as jest.MockedFunction<
  typeof authModule.generateToken
>

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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

  const validRegistrationData = {
    userName: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    birthDate: new Date('1990-01-01'),
    gender: 'male' as const,
    skinType: 'normal' as const,
    allergies: ['fragrance'] as const,
    bodyType: 'atopic' as const,
  }

  describe('POST', () => {
    it('正常なユーザー登録リクエストで成功レスポンスを返す', async () => {
      const mockUser = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
        birthDate: '1990-01-01T00:00:00.000Z',
        gender: 'male',
        skinType: 'normal',
        skinTypeOther: null,
        allergies: ['fragrance'],
        allergiesOther: null,
        bodyType: 'atopic',
        bodyTypeOther: null,
        emailVerified: true,
      }
      const mockToken = 'mock-jwt-token'

      mockRegisterUser.mockResolvedValue(mockUser)
      mockGenerateToken.mockReturnValue(mockToken)

      const request = createRequest(validRegistrationData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user).toEqual({
        id: mockUser.id,
        userName: mockUser.userName,
        email: mockUser.email,
        birthDate: mockUser.birthDate,
        gender: mockUser.gender,
        skinType: mockUser.skinType,
        skinTypeOther: mockUser.skinTypeOther,
        allergies: mockUser.allergies,
        allergiesOther: mockUser.allergiesOther,
        bodyType: mockUser.bodyType,
        bodyTypeOther: mockUser.bodyTypeOther,
        emailVerified: mockUser.emailVerified,
      })
      expect(data.message).toBe('ユーザー登録が完了しました。ログインして始めましょう！')
      expect(data.token).toBe(mockToken)
      expect(mockRegisterUser).toHaveBeenCalledWith(validRegistrationData)
      expect(mockGenerateToken).toHaveBeenCalledWith(mockUser)
    })

    it('最小限の必須フィールドでユーザー登録が成功する', async () => {
      const minimalData = {
        userName: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      }

      const mockUser = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
        birthDate: undefined,
        gender: undefined,
        skinType: undefined,
        skinTypeOther: undefined,
        allergies: undefined,
        allergiesOther: undefined,
        bodyType: undefined,
        bodyTypeOther: undefined,
        emailVerified: true,
      }
      const mockToken = 'mock-jwt-token'

      mockRegisterUser.mockResolvedValue(mockUser)
      mockGenerateToken.mockReturnValue(mockToken)

      const request = createRequest(minimalData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user).toEqual({
        id: mockUser.id,
        userName: mockUser.userName,
        email: mockUser.email,
        birthDate: mockUser.birthDate,
        gender: mockUser.gender,
        skinType: mockUser.skinType,
        skinTypeOther: mockUser.skinTypeOther,
        allergies: mockUser.allergies,
        allergiesOther: mockUser.allergiesOther,
        bodyType: mockUser.bodyType,
        bodyTypeOther: mockUser.bodyTypeOther,
        emailVerified: mockUser.emailVerified,
      })
    })

    it('ユーザー名が短すぎる場合、バリデーションエラーを返す', async () => {
      const invalidData = {
        ...validRegistrationData,
        userName: 'ab', // 3文字未満
      }

      const request = createRequest(invalidData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('入力内容に誤りがあります')
      expect(data.details).toBeDefined()
    })

    it('ユーザー名が長すぎる場合、バリデーションエラーを返す', async () => {
      const invalidData = {
        ...validRegistrationData,
        userName: 'a'.repeat(101), // 100文字超過
      }

      const request = createRequest(invalidData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('入力内容に誤りがあります')
    })

    it('無効なメールアドレスでバリデーションエラーを返す', async () => {
      const invalidData = {
        ...validRegistrationData,
        email: 'invalid-email',
      }

      const request = createRequest(invalidData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('入力内容に誤りがあります')
    })

    it('パスワードが短すぎる場合、バリデーションエラーを返す', async () => {
      const invalidData = {
        ...validRegistrationData,
        password: '1234567', // 8文字未満
      }

      const request = createRequest(invalidData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('入力内容に誤りがあります')
    })

    it('無効な肌タイプでバリデーションエラーを返す', async () => {
      const invalidData = {
        ...validRegistrationData,
        skinType: 'invalid-skin-type',
      }

      const request = createRequest(invalidData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('入力内容に誤りがあります')
    })

    it('ユーザー名またはメールアドレスが重複している場合、400エラーを返す', async () => {
      const duplicateError = {
        code: 'P2002',
        message: 'Unique constraint failed',
      }

      mockRegisterUser.mockRejectedValue(duplicateError)

      const request = createRequest(validRegistrationData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('ユーザー名またはメールアドレスが既に使用されています')
    })

    it('必須フィールドが欠如している場合、バリデーションエラーを返す', async () => {
      const incompleteData = {
        email: 'test@example.com',
        password: 'password123',
        // userName が欠如
      }

      const request = createRequest(incompleteData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('入力内容に誤りがあります')
    })

    it('サーバーエラーが発生した場合、500エラーを返す', async () => {
      mockRegisterUser.mockRejectedValue(new Error('Database error'))

      const request = createRequest(validRegistrationData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('ユーザー登録に失敗しました')
    })

    it('有効な肌タイプの値が受け入れられる', async () => {
      const skinTypes = ['normal', 'dry', 'oily', 'combination', 'sensitive']

      for (const skinType of skinTypes) {
        const testData = {
          ...validRegistrationData,
          skinType,
        }

        const mockUser = {
          id: '1',
          userName: 'testuser',
          email: 'test@example.com',
          displayName: 'Test User',
          skinType,
          emailVerified: true,
        }

        mockRegisterUser.mockResolvedValue(mockUser)
        mockGenerateToken.mockReturnValue('mock-token')

        const request = createRequest(testData)
        const response = await POST(request)

        expect(response.status).toBe(200)

        // Clear mocks for next iteration
        jest.clearAllMocks()
      }
    })
  })
})
