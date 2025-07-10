import { NextRequest } from 'next/server'
import { AuthController } from '@api/framework/controllers/AuthController'
import { adaptCookieToBearer } from '@/lib/auth/cookie-auth-adapter'

// モック設定
const mockDeleteAccount = jest.fn()
const mockAdaptCookieToBearer = jest.fn()

jest.mock('@api/framework/controllers/AuthController', () => {
  return {
    AuthController: jest.fn().mockImplementation(() => {
      return {
        deleteAccount: mockDeleteAccount,
      }
    }),
  }
})

jest.mock('@/lib/auth/cookie-auth-adapter', () => {
  return {
    adaptCookieToBearer: mockAdaptCookieToBearer,
  }
})

describe('/api/auth/delete-account', () => {
  let DELETE: typeof import('@/app/api/auth/delete-account/route').DELETE

  beforeAll(async () => {
    // モック設定後にモジュールをインポート
    const module = await import('@/app/api/auth/delete-account/route')
    DELETE = module.DELETE
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockAdaptCookieToBearer.mockImplementation(request => request as NextRequest)
  })

  it('アカウントを削除できる', async () => {
    const mockResponse = new Response(
      JSON.stringify({
        success: true,
        message: 'アカウントが削除されました',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

    mockDeleteAccount.mockResolvedValue(mockResponse)

    const request = new Request('http://localhost:3000/api/auth/delete-account', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({ password: 'correct-password' }),
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(mockAdaptCookieToBearer).toHaveBeenCalledWith(request)
    expect(mockDeleteAccount).toHaveBeenCalled()
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('アカウントが削除されました')
  })

  it('認証されていない場合は401を返す', async () => {
    const mockResponse = new Response(JSON.stringify({ error: 'ログインが必要です' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })

    mockDeleteAccount.mockResolvedValue(mockResponse)

    const request = new Request('http://localhost:3000/api/auth/delete-account', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: 'password' }),
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('ログインが必要です')
  })

  it('パスワードが間違っている場合は400を返す', async () => {
    const mockResponse = new Response(JSON.stringify({ error: 'パスワードが正しくありません' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })

    mockDeleteAccount.mockResolvedValue(mockResponse)

    const request = new Request('http://localhost:3000/api/auth/delete-account', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({ password: 'wrong-password' }),
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('パスワードが正しくありません')
  })

  it('パスワードが未指定の場合は400を返す', async () => {
    const mockResponse = new Response(JSON.stringify({ error: 'パスワードが必要です' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })

    mockDeleteAccount.mockResolvedValue(mockResponse)

    const request = new Request('http://localhost:3000/api/auth/delete-account', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({}),
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('パスワードが必要です')
  })

  it('削除権限がない場合は403を返す', async () => {
    const mockResponse = new Response(
      JSON.stringify({ error: 'このアカウントを削除する権限がありません' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )

    mockDeleteAccount.mockResolvedValue(mockResponse)

    const request = new Request('http://localhost:3000/api/auth/delete-account', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer restricted-token',
      },
      body: JSON.stringify({ password: 'password' }),
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('このアカウントを削除する権限がありません')
  })

  it('サーバーエラーの場合は500を返す', async () => {
    mockDeleteAccount.mockRejectedValue(new Error('Database connection error'))

    const request = new Request('http://localhost:3000/api/auth/delete-account', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({ password: 'password' }),
    })

    await expect(DELETE(request)).rejects.toThrow('Database connection error')
  })
})
