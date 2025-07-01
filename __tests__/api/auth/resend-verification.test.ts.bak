// Mock the email verification module
jest.mock('@/lib/auth/email-verification', () => ({
  resendVerificationEmail: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { POST } from '../../../src/app/api/auth/resend-verification/route'
import * as emailVerificationModule from '@/lib/auth/email-verification'

const mockResendVerificationEmail =
  emailVerificationModule.resendVerificationEmail as jest.MockedFunction<
    typeof emailVerificationModule.resendVerificationEmail
  >

describe('/api/auth/resend-verification', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/auth/resend-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        host: 'localhost:3000',
        'x-forwarded-proto': 'http',
      },
      body: JSON.stringify(body),
    })
  }

  describe('POST', () => {
    it('有効なメールアドレスで確認メール再送信が成功する', async () => {
      mockResendVerificationEmail.mockResolvedValue({
        success: true,
        message: '確認メールを再送信しました。メールをご確認ください。',
      })

      const request = createRequest({ email: 'test@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('確認メールを再送信しました。メールをご確認ください。')
      expect(mockResendVerificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        'http://localhost:3000'
      )
    })

    it('存在しないメールアドレスで400エラーを返す', async () => {
      mockResendVerificationEmail.mockResolvedValue({
        success: false,
        message: 'ユーザーが見つかりません',
      })

      const request = createRequest({ email: 'nonexistent@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('ユーザーが見つかりません')
      expect(mockResendVerificationEmail).toHaveBeenCalledWith(
        'nonexistent@example.com',
        'http://localhost:3000'
      )
    })

    it('無効なメールアドレス形式でバリデーションエラーを返す', async () => {
      const request = createRequest({ email: 'invalid-email' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('メールアドレスの形式が正しくありません')
      expect(mockResendVerificationEmail).not.toHaveBeenCalled()
    })

    it('メールフィールドが欠如している場合、バリデーションエラーを返す', async () => {
      const request = createRequest({})
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('メールアドレスの形式が正しくありません')
      expect(mockResendVerificationEmail).not.toHaveBeenCalled()
    })

    it('x-forwarded-protoヘッダーがない場合のプロトコル処理', async () => {
      mockResendVerificationEmail.mockResolvedValue({
        success: true,
        message: '確認メールを再送信しました。メールをご確認ください。',
      })

      const request = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          host: 'localhost:3000',
          // x-forwarded-protoヘッダーを設定しない
        },
        body: JSON.stringify({ email: 'test@example.com' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('確認メールを再送信しました。メールをご確認ください。')
      expect(mockResendVerificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        'http://localhost:3000'
      )
    })

    it('hostヘッダーがない場合のbaseURL処理', async () => {
      mockResendVerificationEmail.mockResolvedValue({
        success: true,
        message: '確認メールを再送信しました。メールをご確認ください。',
      })

      const request = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // hostヘッダーを設定しない
        },
        body: JSON.stringify({ email: 'test@example.com' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('確認メールを再送信しました。メールをご確認ください。')
      expect(mockResendVerificationEmail).toHaveBeenCalledWith('test@example.com', undefined)
    })

    it('JSONパースエラーで500エラーを返す', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('確認メールの再送信に失敗しました')
      expect(mockResendVerificationEmail).not.toHaveBeenCalled()
    })

    it('メール送信サービスエラーで500エラーを返す', async () => {
      mockResendVerificationEmail.mockRejectedValue(new Error('Email service error'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const request = createRequest({ email: 'test@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('確認メールの再送信に失敗しました')
      expect(consoleSpy).toHaveBeenCalledWith('Resend verification email error:', expect.any(Error))

      consoleSpy.mockRestore()
    })

    it('空のメールアドレスでバリデーションエラーを返す', async () => {
      const request = createRequest({ email: '' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('メールアドレスの形式が正しくありません')
      expect(mockResendVerificationEmail).not.toHaveBeenCalled()
    })
  })
})
