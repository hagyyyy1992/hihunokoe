import { NextRequest } from 'next/server'
import { DELETE } from '../../../src/app/api/auth/delete-account/route'
import { deleteUserAccount, verifyToken } from '../../../src/lib/auth/auth'
import { cookies } from 'next/headers'

// モック
jest.mock('../../../src/lib/auth/auth')
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

const mockDeleteUserAccount = deleteUserAccount as jest.MockedFunction<typeof deleteUserAccount>
const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>
const mockCookies = cookies as jest.MockedFunction<typeof cookies>

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
      mockVerifyToken.mockReturnValue(null)

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
      mockVerifyToken.mockReturnValue({
        id: 'user-1',
        userName: 'testuser',
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

    it('正常なリクエストでアカウント削除が成功する', async () => {
      const mockUser = {
        id: 'user-1',
        userName: 'testuser',
        email: 'test@example.com',
      }

      mockCookies.mockReturnValue({
        get: jest.fn().mockReturnValue({ value: 'valid-token' }),
      } as any)
      mockVerifyToken.mockReturnValue(mockUser)
      mockDeleteUserAccount.mockResolvedValue(true)

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
        userName: 'testuser',
        email: 'test@example.com',
      }

      mockCookies.mockReturnValue({
        get: jest.fn().mockReturnValue({ value: 'valid-token' }),
      } as any)
      mockVerifyToken.mockReturnValue(mockUser)
      mockDeleteUserAccount.mockRejectedValue(new Error('ユーザーが見つかりません'))

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
        userName: 'testuser',
        email: 'test@example.com',
      }

      mockCookies.mockReturnValue({
        get: jest.fn().mockReturnValue({ value: 'valid-token' }),
      } as any)
      mockVerifyToken.mockReturnValue(mockUser)
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
