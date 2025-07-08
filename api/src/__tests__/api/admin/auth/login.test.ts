jest.mock('@api/framework/controllers/AdminController', () => ({
  AdminController: jest.fn().mockImplementation(() => ({
    login: jest.fn().mockImplementation(async request => {
      // Default mock implementation
      return new Response(JSON.stringify({ message: 'Mock response' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }),
  })),
}))

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/admin/auth/login/route'

// Mock the controller

const createMockResponse = (status, data) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
  })
}

describe('/api/admin/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.log = jest.fn()
    console.error = jest.fn()
  })

  afterEach(() => {
    console.log = originalConsoleLog
    console.error = originalConsoleError
  })

  const createMockRequest = (body: any, headers: Record<string, string> = {}) => {
    return {
      json: jest.fn().mockResolvedValue(createMockResponse(200, body)),
      headers: {
        get: jest.fn((key: string) => headers[key] || null),
      },
    } as unknown as NextRequest
  }

  it('returns 400 when email is missing', async () => {
    const request = createMockRequest({ password: 'password123' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('メールアドレスとパスワードは必須です')
  })

  it('returns 400 when password is missing', async () => {
    const request = createMockRequest({ email: 'test@example.com' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('メールアドレスとパスワードは必須です')
  })

  it('returns 401 when user is not found', async () => {
    mockLogin.mockResolvedValue(createMockResponse(200, null))

    const request = createMockRequest({
      email: 'admin@example.com',
      password: 'wrongpassword',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('メールアドレスまたはパスワードが間違っています')
    expect(mockLogin).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'wrongpassword',
    })
  })

  it('returns 403 when user is not admin', async () => {
    const user = {
      id: '1',
      username: 'user',
      email: 'user@example.com',
      role: 'USER' as const,
    }

    mockLogin.mockResolvedValue(createMockResponse(200, user))
    mockIsAdmin.mockReturnValue(false)

    const request = createMockRequest({
      email: 'user@example.com',
      password: 'password123',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('管理者権限がありません')
    expect(mockIsAdmin).toHaveBeenCalledWith(user)
  })

  it('returns 200 with token when admin login is successful', async () => {
    const user = {
      id: '1',
      username: 'admin',
      email: 'admin@example.com',
      role: 'ADMIN' as const,
    }

    mockLogin.mockResolvedValue(createMockResponse(200, user))
    mockIsAdmin.mockReturnValue(true)
    mockGenerateToken.mockReturnValue('mock-token')
    mockLogAdminAction.mockResolvedValue(createMockResponse(200, undefined))

    const request = createMockRequest(
      {
        email: 'admin@example.com',
        password: 'password123',
      },
      {
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'Mozilla/5.0',
      }
    )

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.token).toBe('mock-token')
    expect(data.user).toEqual({
      id: '1',
      username: 'admin',
      email: 'admin@example.com',
      role: 'ADMIN',
    })

    expect(mockGenerateToken).toHaveBeenCalledWith(user)
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      '1',
      'ADMIN_LOGIN',
      undefined,
      { email: 'admin@example.com' },
      '192.168.1.1',
      'Mozilla/5.0'
    )
  })

  it('handles IP address fallback correctly', async () => {
    const user = {
      id: '1',
      username: 'admin',
      email: 'admin@example.com',
      role: 'ADMIN' as const,
    }

    mockLogin.mockResolvedValue(createMockResponse(200, user))
    mockIsAdmin.mockReturnValue(true)
    mockGenerateToken.mockReturnValue('mock-token')
    mockLogAdminAction.mockResolvedValue(createMockResponse(200, undefined))

    const request = createMockRequest(
      {
        email: 'admin@example.com',
        password: 'password123',
      },
      {
        'x-real-ip': '10.0.0.1',
        'user-agent': 'Chrome',
      }
    )

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      '1',
      'ADMIN_LOGIN',
      undefined,
      { email: 'admin@example.com' },
      '10.0.0.1',
      'Chrome'
    )
  })

  it('uses unknown values when headers are missing', async () => {
    const user = {
      id: '1',
      username: 'admin',
      email: 'admin@example.com',
      role: 'ADMIN' as const,
    }

    mockLogin.mockResolvedValue(createMockResponse(200, user))
    mockIsAdmin.mockReturnValue(true)
    mockGenerateToken.mockReturnValue('mock-token')
    mockLogAdminAction.mockResolvedValue(createMockResponse(200, undefined))

    const request = createMockRequest({
      email: 'admin@example.com',
      password: 'password123',
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      '1',
      'ADMIN_LOGIN',
      undefined,
      { email: 'admin@example.com' },
      'unknown',
      'unknown'
    )
  })

  it('returns 500 when an error occurs', async () => {
    mockLogin.mockResolvedValue(createMockResponse(500, { error: 'Database error' }))

    const request = createMockRequest({
      email: 'admin@example.com',
      password: 'password123',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('サーバーエラーが発生しました')
  })

  it('handles non-Error exceptions', async () => {
    mockLogin.mockRejectedValue('String error')

    const request = createMockRequest({
      email: 'admin@example.com',
      password: 'password123',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('サーバーエラーが発生しました')
  })
})
