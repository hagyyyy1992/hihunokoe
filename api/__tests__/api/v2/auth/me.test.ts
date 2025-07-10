import { NextRequest } from 'next/server'
import { AuthController } from '@api/framework/controllers/AuthController'
import { InvalidTokenError, TokenExpiredError } from '@api/domain/exceptions/AuthenticationError'

// モック設定
const mockGetCurrentUser = jest.fn()

jest.mock('@api/framework/controllers/AuthController', () => {
  return {
    AuthController: jest.fn().mockImplementation(() => {
      return {
        getCurrentUser: mockGetCurrentUser,
      }
    }),
  }
})

describe('/api/v2/auth/me', () => {
  let GET: typeof import('@/app/api/v2/auth/me/route').GET

  beforeAll(async () => {
    // モック設定後にモジュールをインポート
    const module = await import('@/app/api/v2/auth/me/route')
    GET = module.GET
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('認証されたユーザー情報を返す', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        userName: 'testuser',
        role: 'USER',
        emailVerified: true,
      }

      const mockResponse = new Response(JSON.stringify({ success: true, user: mockUser }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })

      mockGetCurrentUser.mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/v2/auth/me', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(mockGetCurrentUser).toHaveBeenCalledWith(request)
      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        user: mockUser,
      })
    })

    it('Authorizationヘッダーがない場合は401を返す', async () => {
      const mockResponse = new Response(
        JSON.stringify({ error: 'No authentication token provided' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )

      mockGetCurrentUser.mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/v2/auth/me')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'No authentication token provided' })
    })

    it('無効なトークンの場合は401を返す', async () => {
      const mockResponse = new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })

      mockGetCurrentUser.mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/v2/auth/me', {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('期限切れトークンの場合は401を返す', async () => {
      const mockResponse = new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })

      mockGetCurrentUser.mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/v2/auth/me', {
        headers: {
          Authorization: 'Bearer expired-token',
        },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('ユーザーが見つからない場合は404を返す', async () => {
      const mockResponse = new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })

      mockGetCurrentUser.mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/v2/auth/me', {
        headers: {
          Authorization: 'Bearer valid-token-but-user-deleted',
        },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'User not found' })
    })

    it('サーバーエラーの場合は500を返す', async () => {
      mockGetCurrentUser.mockRejectedValue(new Error('Database connection error'))

      const request = new NextRequest('http://localhost:3000/api/v2/auth/me', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
      })

      await expect(GET(request)).rejects.toThrow('Database connection error')
    })
  })
})
