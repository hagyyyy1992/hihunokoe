// Mock email module
jest.mock('../../../src/lib/email/email', () => ({
  sendEmail: jest.fn(),
}))

// Mock prisma
jest.mock('../../../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
  isDatabaseAvailable: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { POST } from '../../../src/app/api/auth/forgot-password/route'
import * as emailModule from '../../../src/lib/email/email'
import * as prismaModule from '../../../src/lib/prisma'

const mockSendEmail = emailModule.sendEmail as jest.MockedFunction<typeof emailModule.sendEmail>
const mockIsDatabaseAvailable = prismaModule.isDatabaseAvailable as jest.MockedFunction<
  typeof prismaModule.isDatabaseAvailable
>
const mockPrisma = prismaModule.prisma as jest.Mocked<typeof prismaModule.prisma>

describe('/api/auth/forgot-password', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsDatabaseAvailable.mockReturnValue(true)
  })

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  }

  describe('POST', () => {
    it('有効なメールアドレスでパスワードリセットメールが送信される', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        userName: 'testuser',
        isActive: true,
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any)
      mockSendEmail.mockResolvedValue({ success: true })

      const request = createRequest({ email: 'test@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('パスワードリセットメールを送信しました。メールをご確認ください。')
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: 'test@example.com',
          isActive: true,
        },
      })
    })

    it('存在しないメールアドレスでも成功メッセージを返す（セキュリティ対策）', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const request = createRequest({ email: 'nonexistent@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('パスワードリセットメールを送信しました。メールをご確認ください。')
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: 'nonexistent@example.com',
          isActive: true,
        },
      })
      // メール送信は呼ばれない
      expect(mockSendEmail).not.toHaveBeenCalled()
    })

    it('非アクティブユーザーでも成功メッセージを返す', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null) // isActive: false の場合は null が返る

      const request = createRequest({ email: 'inactive@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('パスワードリセットメールを送信しました。メールをご確認ください。')
    })

    it('無効なメールアドレス形式でバリデーションエラーを返す', async () => {
      const request = createRequest({ email: 'invalid-email' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('有効なメールアドレスを入力してください')
    })

    it('メールフィールドが欠如している場合、バリデーションエラーを返す', async () => {
      const request = createRequest({})
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('メールアドレスは必須です')
    })

    it('メール送信に失敗しても成功メッセージを返す（ユーザーには内部エラーを隠す）', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        userName: 'testuser',
        isActive: true,
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any)
      mockSendEmail.mockRejectedValue(new Error('Email service error'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const request = createRequest({ email: 'test@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('パスワードリセットメールを送信しました。メールをご確認ください。')
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send password reset email:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    it('データベースが利用できない場合のモックモードをテスト', async () => {
      mockIsDatabaseAvailable.mockReturnValue(false)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const request = createRequest({ email: 'demo@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('パスワードリセットメールを送信しました。メールをご確認ください。')
      expect(consoleSpy).toHaveBeenCalledWith(
        'Mock mode: Password reset email would be sent to:',
        'demo@example.com'
      )

      consoleSpy.mockRestore()
    })

    it('不正なJSONでサーバーエラーを返す', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{invalid json}',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('パスワードリセットの処理中にエラーが発生しました')
    })

    it('データベースエラーでサーバーエラーを返す', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection error'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const request = createRequest({ email: 'test@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('パスワードリセットの処理中にエラーが発生しました')
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })
})
