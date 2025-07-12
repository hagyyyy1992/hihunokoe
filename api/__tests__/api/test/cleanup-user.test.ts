/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/test/cleanup-user/route'
import { prisma } from '@/lib/prisma'

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    empathy: {
      deleteMany: jest.fn(),
    },
    comment: {
      deleteMany: jest.fn(),
    },
    post: {
      deleteMany: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as any

describe('/api/test/cleanup-user', () => {
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    jest.clearAllMocks()
    console.log = jest.fn()
    console.error = jest.fn()
  })

  afterEach(() => {
    if (originalEnv) {
      ;(process.env as any).NODE_ENV = originalEnv
    }
  })

  const createMockRequest = (body: any) => {
    return {
      json: jest.fn().mockResolvedValue(body),
    } as unknown as NextRequest
  }

  it('returns 403 in production environment', async () => {
    ;(process.env as any).NODE_ENV = 'production'

    const request = createMockRequest({ email: 'test@example.com' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('このエンドポイントは本番環境では利用できません')
  })

  it('returns 400 when email is missing', async () => {
    ;(process.env as any).NODE_ENV = 'test'

    const request = createMockRequest({})
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email is required')
  })

  it('returns 500 when database is not available', async () => {
    ;(process.env as any).NODE_ENV = 'test'

    // Mock findByEmail to throw an error (simulating database unavailable)
    mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection not available'))

    const request = createMockRequest({ email: 'test@example.com' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Cleanup failed')
  })

  it('successfully cleans up user and related data', async () => {
    ;(process.env as any).NODE_ENV = 'test'

    // Reset mock to successful behavior
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })
    mockPrisma.user.update.mockResolvedValue({})

    const request = createMockRequest({ email: 'test@example.com' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('User cleanup completed')
  })

  it('returns success when user does not exist', async () => {
    ;(process.env as any).NODE_ENV = 'test'

    // Reset mock to return null (user not found)
    mockPrisma.user.findUnique.mockResolvedValue(null)

    const request = createMockRequest({ email: 'nonexistent@example.com' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('User cleanup completed')
  })

  it('returns 500 when database error occurs', async () => {
    ;(process.env as any).NODE_ENV = 'test'

    mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'))

    const request = createMockRequest({ email: 'test@example.com' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Cleanup failed')
  })

  it('logs error when cleanup fails', async () => {
    ;(process.env as any).NODE_ENV = 'test'

    const error = new Error('Database error')
    mockPrisma.user.findUnique.mockRejectedValue(error)

    const request = createMockRequest({ email: 'test@example.com' })
    await POST(request)

    expect(console.error).toHaveBeenCalledWith('Cleanup user error:', error)
  })
})
