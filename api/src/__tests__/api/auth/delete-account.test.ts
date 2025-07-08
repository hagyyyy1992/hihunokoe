jest.mock('@api/framework/controllers/AuthController', () => ({
  AuthController: jest.fn().mockImplementation(() => ({
    deleteAccount: jest.fn().mockImplementation(async request => {
      // Default mock implementation
      return new Response(JSON.stringify({ message: 'Mock response' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }),
  })),
}))

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/delete-account/route'

const createMockResponse = (status, data) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
  })
}

describe('/api/auth/delete-account', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('DELETE', () => {
    it('認証されていないユーザーは401エラーを返す', async () => {
      mockCookies.mockReturnValue({
        get: jest.fn().mockReturnValue(undefined),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/auth/delete-account', {
        method: 'DELETE',
        body: JSON.stringify({ password: 'test123' }),
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('ログインが必要です')
    })

    it('無効なトークンの場合は401エラーを返す', async () => {
      mockCookies.mockReturnValue({
        get: jest.fn().mockReturnValue({ value: 'invalid-token' }),
      } as any)
      mockDeleteAccount.mockReturnValue(null)

      const request = new NextRequest('http://localhost:3000/api/auth/delete-account', {
        method: 'DELETE',
        body: JSON.stringify({ password: 'test123' }),
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('無効なトークンです')
    })

    it('パスワードが提供されていない場合は400エラーを返す', async () => {
      mockCookies.mockReturnValue({
        get: jest.fn().mockReturnValue({ value: 'valid-token' }),
      } as any)
      mockDeleteAccount.mockReturnValue({
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
      })

      const request = new NextRequest('http://localhost:3000/api/auth/delete-account', {
        method: 'DELETE',
        body: JSON.stringify({}),
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('パスワードの確認が必要です')
    })

    it('パスワードが正しくない場合は401エラーを返す', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
      }

      mockCookies.mockReturnValue({
        get: jest.fn().mockReturnValue({ value: 'valid-token' }),
      } as any)
      mockDeleteAccount.mockReturnValue(mockUser)
      mockDeleteAccount.mockResolvedValue(createMockResponse(200, null))

      const request = new NextRequest('http://localhost:3000/api/auth/delete-account', {
        method: 'DELETE',
        body: JSON.stringify({ password: 'wrong-password' }),
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('パスワードが正しくありません')
    })

    it('正常なリクエストでアカウント削除が成功する', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
      }

      mockCookies.mockReturnValue({
        get: jest.fn().mockReturnValue({ value: 'valid-token' }),
      } as any)
      mockDeleteAccount.mockReturnValue(mockUser)
      mockDeleteAccount.mockResolvedValue(createMockResponse(200, mockUser as any))
      mockDeleteUserAccount.mockResolvedValue(createMockResponse(200, true))

      const request = new NextRequest('http://localhost:3000/api/auth/delete-account', {
        method: 'DELETE',
        body: JSON.stringify({ password: 'test123' }),
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('アカウントが正常に削除されました')
      expect(mockDeleteUserAccount).toHaveBeenCalledWith('user-1')

      // クッキーが削除されることを確認
      const setCookieHeader = response.headers.get('set-cookie')
      expect(setCookieHeader).toContain('auth-token=;')
      expect(setCookieHeader).toContain('Expires=Thu, 01 Jan 1970')
    })

    it('アカウント削除でエラーが発生した場合は500エラーを返す', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
      }

      mockCookies.mockReturnValue({
        get: jest.fn().mockReturnValue({ value: 'valid-token' }),
      } as any)
      mockDeleteAccount.mockReturnValue(mockUser)
      mockDeleteAccount.mockResolvedValue(createMockResponse(200, mockUser as any))
      mockDeleteUserAccount.mockResolvedValue(
        createMockResponse(500, { error: 'ユーザーが見つかりません' })
      )

      const request = new NextRequest('http://localhost:3000/api/auth/delete-account', {
        method: 'DELETE',
        body: JSON.stringify({ password: 'test123' }),
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('ユーザーが見つかりません')
    })

    it('予期しないエラーが発生した場合は汎用エラーメッセージを返す', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
      }

      mockCookies.mockReturnValue({
        get: jest.fn().mockReturnValue({ value: 'valid-token' }),
      } as any)
      mockDeleteAccount.mockReturnValue(mockUser)
      mockDeleteAccount.mockResolvedValue(createMockResponse(200, mockUser as any))
      mockDeleteUserAccount.mockRejectedValue('Unknown error')

      const request = new NextRequest('http://localhost:3000/api/auth/delete-account', {
        method: 'DELETE',
        body: JSON.stringify({ password: 'test123' }),
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('アカウント削除に失敗しました')
    })
  })
})
