// Mock the auth module first
jest.mock('@/lib/auth/auth', () => ({
  registerUser: jest.fn(),
}))

// Mock the email verification module
jest.mock('@/lib/auth/email-verification', () => ({
  sendVerificationEmail: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { POST } from '../../../src/app/api/auth/register/route'
import * as authModule from '@/lib/auth/auth'
import * as emailVerificationModule from '@/lib/auth/email-verification'
import { SkinType } from '@/types'
import { Gender, AllergyType, BodyType } from '@prisma/client'

const mockRegisterUser = authModule.registerUser as jest.MockedFunction<
  typeof authModule.registerUser
>

const mockSendVerificationEmail =
  emailVerificationModule.sendVerificationEmail as jest.MockedFunction<
    typeof emailVerificationModule.sendVerificationEmail
  >

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSendVerificationEmail.mockResolvedValue(undefined)
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
    birthDate: '1990-01-01',
    gender: 'MALE' as const,
    skinType: 'NORMAL' as const,
    allergies: ['COSMETICS'] as const,
    bodyType: 'AVERAGE' as const,
  }

  describe('POST', () => {
    it('正常なユーザー登録リクエストで成功レスポンスを返す', async () => {
      const mockUser = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
        birthDate: new Date('1990-01-01'),
        gender: 'MALE' as Gender,
        skinType: 'NORMAL' as SkinType,
        skinTypeOther: null,
        allergies: ['COSMETICS' as AllergyType],
        allergiesOther: null,
        bodyType: 'AVERAGE' as BodyType,
        bodyTypeOther: null,
        emailVerified: false,
      }
      mockRegisterUser.mockResolvedValue(mockUser)

      const request = createRequest(validRegistrationData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user).toEqual({
        id: mockUser.id,
        userName: mockUser.userName,
        email: mockUser.email,
        birthDate: mockUser.birthDate.toISOString(),
        gender: mockUser.gender,
        skinType: mockUser.skinType,
        skinTypeOther: mockUser.skinTypeOther,
        allergies: mockUser.allergies,
        allergiesOther: mockUser.allergiesOther,
        bodyType: mockUser.bodyType,
        bodyTypeOther: mockUser.bodyTypeOther,
        emailVerified: mockUser.emailVerified,
      })
      expect(data.message).toBe('ユーザー登録が完了しました。確認メールをご確認ください。')
      expect(mockRegisterUser).toHaveBeenCalledWith({
        ...validRegistrationData,
        birthDate: new Date('1990-01-01'),
      })
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
        emailVerified: false,
      }
      mockRegisterUser.mockResolvedValue(mockUser)

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
      const skinTypes = ['NORMAL', 'DRY', 'OILY', 'MIXED', 'SENSITIVE']

      for (const skinType of skinTypes) {
        const testData = {
          ...validRegistrationData,
          skinType,
        }

        const mockUser = {
          id: '1',
          userName: 'testuser',
          email: 'test@example.com',
          skinType: skinType as SkinType,
          emailVerified: false,
        }

        mockRegisterUser.mockResolvedValue(mockUser)

        const request = createRequest(testData)
        const response = await POST(request)

        expect(response.status).toBe(200)

        // Clear mocks for next iteration
        jest.clearAllMocks()
      }
    })

    it('確認メール送信に失敗してもユーザー登録は成功する（エラーケース）', async () => {
      const mockUser = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
        birthDate: new Date('1990-01-01'),
        gender: 'MALE' as Gender,
        skinType: 'NORMAL' as SkinType,
        skinTypeOther: null,
        allergies: ['COSMETICS' as AllergyType],
        allergiesOther: null,
        bodyType: 'AVERAGE' as BodyType,
        bodyTypeOther: null,
        emailVerified: false,
      }

      mockRegisterUser.mockResolvedValue(mockUser)
      mockSendVerificationEmail.mockRejectedValue(new Error('Email service error'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const request = createRequest(validRegistrationData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.user).toBeDefined()
      expect(data.message).toBe('ユーザー登録は完了しました。')
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send verification email:',
        expect.objectContaining({
          error: expect.any(Error),
          message: 'Email service error',
          stack: expect.any(String),
          userId: '1',
          email: 'test@example.com',
        })
      )

      consoleSpy.mockRestore()
    })

    it('非Errorオブジェクトのメール送信エラーを処理', async () => {
      const mockUser = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
        birthDate: new Date('1990-01-01'),
        gender: 'MALE' as Gender,
        skinType: 'NORMAL' as SkinType,
        skinTypeOther: null,
        allergies: ['COSMETICS' as AllergyType],
        allergiesOther: null,
        bodyType: 'AVERAGE' as BodyType,
        bodyTypeOther: null,
        emailVerified: false,
      }

      mockRegisterUser.mockResolvedValue(mockUser)
      mockSendVerificationEmail.mockRejectedValue('String error')

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const request = createRequest(validRegistrationData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.user).toBeDefined()
      expect(data.message).toBe('ユーザー登録は完了しました。')
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send verification email:',
        expect.objectContaining({
          error: 'String error',
          message: 'Unknown error',
          stack: undefined,
          userId: '1',
          email: 'test@example.com',
        })
      )

      consoleSpy.mockRestore()
    })

    it('hostヘッダーがない場合のbaseURL処理', async () => {
      const mockUser = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
        birthDate: new Date('1990-01-01'),
        gender: 'MALE' as Gender,
        skinType: 'NORMAL' as SkinType,
        skinTypeOther: null,
        allergies: ['COSMETICS' as AllergyType],
        allergiesOther: null,
        bodyType: 'AVERAGE' as BodyType,
        bodyTypeOther: null,
        emailVerified: false,
      }

      mockRegisterUser.mockResolvedValue(mockUser)
      mockSendVerificationEmail.mockResolvedValue()

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // hostヘッダーを設定しない
        },
        body: JSON.stringify(validRegistrationData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user).toBeDefined()
      expect(data.message).toBe('ユーザー登録が完了しました。確認メールをご確認ください。')
      expect(mockSendVerificationEmail).toHaveBeenCalledWith(
        '1',
        'test@example.com',
        'testuser',
        undefined
      )
    })

    it('x-forwarded-protoヘッダーがない場合のプロトコル処理', async () => {
      const mockUser = {
        id: '1',
        userName: 'testuser',
        email: 'test@example.com',
        birthDate: new Date('1990-01-01'),
        gender: 'MALE' as Gender,
        skinType: 'NORMAL' as SkinType,
        skinTypeOther: null,
        allergies: ['COSMETICS' as AllergyType],
        allergiesOther: null,
        bodyType: 'AVERAGE' as BodyType,
        bodyTypeOther: null,
        emailVerified: false,
      }

      mockRegisterUser.mockResolvedValue(mockUser)
      mockSendVerificationEmail.mockResolvedValue()

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          host: 'localhost:3000',
          // x-forwarded-protoヘッダーを設定しない
        },
        body: JSON.stringify(validRegistrationData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user).toBeDefined()
      expect(data.message).toBe('ユーザー登録が完了しました。確認メールをご確認ください。')
      expect(mockSendVerificationEmail).toHaveBeenCalledWith(
        '1',
        'test@example.com',
        'testuser',
        'http://localhost:3000'
      )
    })
  })
})
