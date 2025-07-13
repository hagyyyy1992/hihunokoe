import { NextRequest } from 'next/server'

// Prismaのモック
jest.mock('@/lib/prisma', () => ({
  prisma: {},
}))

// AdminAuthControllerのモックを先に設定
const mockLogin = jest.fn()

jest.mock('@api/framework/controllers/AdminAuthController', () => {
  return {
    AdminAuthController: jest.fn().mockImplementation(() => {
      return {
        login: mockLogin,
      }
    }),
  }
})

describe('/api/admin/auth/login', () => {
  let POST: typeof import('@/app/api/admin/auth/login/route').POST

  beforeAll(async () => {
    // モック設定後にモジュールをインポート
    const module = await import('@/app/api/admin/auth/login/route')
    POST = module.POST
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('管理者ログインが成功する', async () => {
    const mockResponse = new Response(
      JSON.stringify({
        success: true,
        token: 'admin-token',
        admin: {
          id: 'admin-id',
          email: 'admin@example.com',
          userName: 'admin',
          role: 'ADMIN',
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

    mockLogin.mockResolvedValue(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/admin/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'adminpassword',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(mockLogin).toHaveBeenCalledWith(request)
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.token).toBe('admin-token')
    expect(data.admin.role).toBe('ADMIN')
  })

  it('無効な認証情報の場合は401を返す', async () => {
    const mockResponse = new Response(JSON.stringify({ error: 'Invalid credentials' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })

    mockLogin.mockResolvedValue(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/admin/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'wrongpassword',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Invalid credentials')
  })

  it('一般ユーザーの場合は403を返す', async () => {
    const mockResponse = new Response(
      JSON.stringify({ error: 'Access denied. Admin role required.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )

    mockLogin.mockResolvedValue(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/admin/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'user@example.com',
        password: 'userpassword',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Access denied. Admin role required.')
  })

  it('メールアドレスまたはパスワードがない場合は400を返す', async () => {
    const mockResponse = new Response(
      JSON.stringify({ error: 'Email and password are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )

    mockLogin.mockResolvedValue(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/admin/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        // パスワードが欠落
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email and password are required')
  })

  it('アカウントがロックされている場合は423を返す', async () => {
    const mockResponse = new Response(JSON.stringify({ error: 'Account is locked' }), {
      status: 423,
      headers: { 'Content-Type': 'application/json' },
    })

    mockLogin.mockResolvedValue(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/admin/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'locked@example.com',
        password: 'password',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(423)
    expect(data.error).toBe('Account is locked')
  })

  it('サーバーエラーの場合は500を返す', async () => {
    mockLogin.mockRejectedValue(new Error('Database connection error'))

    const request = new NextRequest('http://localhost:3000/api/admin/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password',
      }),
    })

    await expect(POST(request)).rejects.toThrow('Database connection error')
  })
})
