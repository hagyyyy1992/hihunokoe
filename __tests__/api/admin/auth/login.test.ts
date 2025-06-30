/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/admin/auth/login/route'
import { loginUser, generateToken, isAdmin, logAdminAction } from '@/lib/auth/auth'

// Mock dependencies
jest.mock('@/lib/auth/auth', () => ({
  loginUser: jest.fn(),
  generateToken: jest.fn(),
  isAdmin: jest.fn(),
  logAdminAction: jest.fn(),
}))

const mockLoginUser = loginUser as jest.MockedFunction<typeof loginUser>
const mockGenerateToken = generateToken as jest.MockedFunction<typeof generateToken>
const mockIsAdmin = isAdmin as jest.MockedFunction<typeof isAdmin>
const mockLogAdminAction = logAdminAction as jest.MockedFunction<typeof logAdminAction>

// Mock console methods to avoid noise in tests
const originalConsoleLog = console.log
const originalConsoleError = console.error

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
      json: jest.fn().mockResolvedValue(body),
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
    mockLoginUser.mockResolvedValue(null)

    const request = createMockRequest({
      email: 'admin@example.com',
      password: 'wrongpassword',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('メールアドレスまたはパスワードが間違っています')
    expect(mockLoginUser).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'wrongpassword',
    })
  })

  it('returns 403 when user is not admin', async () => {
    const user = {
      id: '1',
      userName: 'user',
      email: 'user@example.com',
      role: 'USER' as const,
    }

    mockLoginUser.mockResolvedValue(user)
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
      userName: 'admin',
      email: 'admin@example.com',
      role: 'ADMIN' as const,
    }

    mockLoginUser.mockResolvedValue(user)
    mockIsAdmin.mockReturnValue(true)
    mockGenerateToken.mockReturnValue('mock-token')
    mockLogAdminAction.mockResolvedValue(undefined)

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
      userName: 'admin',
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
      userName: 'admin',
      email: 'admin@example.com',
      role: 'ADMIN' as const,
    }

    mockLoginUser.mockResolvedValue(user)
    mockIsAdmin.mockReturnValue(true)
    mockGenerateToken.mockReturnValue('mock-token')
    mockLogAdminAction.mockResolvedValue(undefined)

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
      userName: 'admin',
      email: 'admin@example.com',
      role: 'ADMIN' as const,
    }

    mockLoginUser.mockResolvedValue(user)
    mockIsAdmin.mockReturnValue(true)
    mockGenerateToken.mockReturnValue('mock-token')
    mockLogAdminAction.mockResolvedValue(undefined)

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
    mockLoginUser.mockRejectedValue(new Error('Database error'))

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
    mockLoginUser.mockRejectedValue('String error')

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
