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
    expect(data.error).toBe('Not allowed in production')
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

    // Override the prisma mock to return null
    jest.doMock(
      '@/lib/prisma',
      () => ({
        prisma: null,
      }),
      { virtual: true }
    )

    // Clear the module cache and re-import
    jest.resetModules()
    const { POST } = await import('@/app/api/test/cleanup-user/route')

    const request = createMockRequest({ email: 'test@example.com' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Database not available')
  })

  it('successfully cleans up user and related data', async () => {
    ;(process.env as any).NODE_ENV = 'test'

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      posts: [{ id: 'post-123' }],
      empathies: [{ id: 'empathy-123' }],
      comments: [{ id: 'comment-123' }],
    }

    mockPrisma.user.findUnique.mockResolvedValue(mockUser)
    mockPrisma.empathy.deleteMany.mockResolvedValue({ count: 1 })
    mockPrisma.comment.deleteMany.mockResolvedValue({ count: 1 })
    mockPrisma.post.deleteMany.mockResolvedValue({ count: 1 })
    mockPrisma.user.delete.mockResolvedValue(mockUser)

    const request = createMockRequest({ email: 'test@example.com' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
      include: {
        posts: true,
        empathies: true,
        comments: true,
      },
    })

    expect(mockPrisma.empathy.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
    })
    expect(mockPrisma.comment.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
    })
    expect(mockPrisma.post.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
    })
    expect(mockPrisma.user.delete).toHaveBeenCalledWith({
      where: { id: 'user-123' },
    })
  })

  it('returns success when user does not exist', async () => {
    ;(process.env as any).NODE_ENV = 'test'

    mockPrisma.user.findUnique.mockResolvedValue(null)

    const request = createMockRequest({ email: 'nonexistent@example.com' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    expect(mockPrisma.empathy.deleteMany).not.toHaveBeenCalled()
    expect(mockPrisma.comment.deleteMany).not.toHaveBeenCalled()
    expect(mockPrisma.post.deleteMany).not.toHaveBeenCalled()
    expect(mockPrisma.user.delete).not.toHaveBeenCalled()
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

  it('logs successful cleanup', async () => {
    ;(process.env as any).NODE_ENV = 'test'

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      posts: [],
      empathies: [],
      comments: [],
    }

    mockPrisma.user.findUnique.mockResolvedValue(mockUser)
    mockPrisma.empathy.deleteMany.mockResolvedValue({ count: 0 })
    mockPrisma.comment.deleteMany.mockResolvedValue({ count: 0 })
    mockPrisma.post.deleteMany.mockResolvedValue({ count: 0 })
    mockPrisma.user.delete.mockResolvedValue(mockUser)

    const request = createMockRequest({ email: 'test@example.com' })
    await POST(request)

    expect(console.log).toHaveBeenCalledWith('Test user cleaned up: test@example.com')
  })

  it('logs error when cleanup fails', async () => {
    ;(process.env as any).NODE_ENV = 'test'

    const error = new Error('Database error')
    mockPrisma.user.findUnique.mockRejectedValue(error)

    const request = createMockRequest({ email: 'test@example.com' })
    await POST(request)

    expect(console.error).toHaveBeenCalledWith('Error cleaning up test user:', error)
  })
})
