// Mock the entire AuthController class
jest.mock('@api/framework/controllers/AuthController', () => {
  return {
    AuthController: jest.fn().mockImplementation(() => {
      return {
        getCurrentUser: jest.fn().mockImplementation(async request => {
          const token = request.cookies.get('auth-token')?.value

          if (!token) {
            return new Response(JSON.stringify({ error: '認証が必要です' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          if (token === 'invalid-token') {
            return new Response(JSON.stringify({ error: 'トークンが無効です' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          if (token === 'not-found-token') {
            return new Response(JSON.stringify({ error: 'ユーザーが見つかりません' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          if (token === 'unverified-token') {
            return new Response(JSON.stringify({ error: 'メールアドレスの確認が必要です' }), {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          if (token === 'error-token') {
            return new Response(JSON.stringify({ error: 'ユーザー情報の取得に失敗しました' }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          // Default valid token response
          return new Response(
            JSON.stringify({
              user: {
                id: '1',
                username: 'testuser',
                email: 'test@example.com',
                emailVerified: true,
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        }),
      }
    }),
  }
})

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/auth/me/route'

describe('/api/auth/me', () => {
  const createRequest = (cookies?: { [key: string]: string }) => {
    const headers = new Headers()
    if (cookies) {
      const cookieString = Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ')
      headers.set('Cookie', cookieString)
    }

    return new NextRequest('http://localhost:3000/api/auth/me', {
      method: 'GET',
      headers,
    })
  }

  describe('GET', () => {
    it('有効なトークンでユーザー情報を返す', async () => {
      const request = createRequest({ 'auth-token': 'valid-token' })
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.user).toEqual({
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        emailVerified: true,
      })
    })

    it('トークンが存在しない場合、401エラーを返す', async () => {
      const request = createRequest()
      const response = await GET(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('認証が必要です')
    })

    it('無効なトークンの場合、401エラーを返す', async () => {
      const request = createRequest({ 'auth-token': 'invalid-token' })
      const response = await GET(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('トークンが無効です')
    })

    it('ユーザーが見つからない場合、404エラーを返す', async () => {
      const request = createRequest({ 'auth-token': 'not-found-token' })
      const response = await GET(request)

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('ユーザーが見つかりません')
    })

    it('メール認証が未完了の場合、403エラーを返す', async () => {
      const request = createRequest({ 'auth-token': 'unverified-token' })
      const response = await GET(request)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('メールアドレスの確認が必要です')
    })

    it('エラーが発生した場合、500エラーを返す', async () => {
      const request = createRequest({ 'auth-token': 'error-token' })
      const response = await GET(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('ユーザー情報の取得に失敗しました')
    })

    it('空のトークンの場合、401エラーを返す', async () => {
      const request = createRequest({ 'auth-token': '' })
      const response = await GET(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('認証が必要です')
    })
  })
})
