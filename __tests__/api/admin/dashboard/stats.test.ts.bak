/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/admin/dashboard/stats/route'
import { verifyToken, isAdmin } from '@/lib/auth/auth'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { MOCK_USERS, MOCK_POSTS } from '@/lib/mock-data'

// Mock dependencies
jest.mock('@/lib/auth/auth', () => ({
  verifyToken: jest.fn(),
  isAdmin: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    post: {
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    empathy: {
      count: jest.fn(),
    },
  },
  isDatabaseAvailable: jest.fn(),
}))

jest.mock('@/lib/mock-data', () => ({
  MOCK_USERS: [
    { id: '1', userName: 'user1', email: 'user1@example.com', createdAt: '2023-01-01T00:00:00Z' },
    { id: '2', userName: 'user2', email: 'user2@example.com', createdAt: '2023-01-02T00:00:00Z' },
  ],
  MOCK_POSTS: [
    {
      id: '1',
      title: 'Post 1',
      userId: '1',
      viewCount: 10,
      empathyCount: 5,
      createdAt: '2023-01-01T00:00:00Z',
    },
    {
      id: '2',
      title: 'Post 2',
      userId: '2',
      viewCount: 20,
      empathyCount: 15,
      createdAt: '2023-01-02T00:00:00Z',
    },
  ],
}))

const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>
const mockIsAdmin = isAdmin as jest.MockedFunction<typeof isAdmin>
const mockIsDatabaseAvailable = isDatabaseAvailable as jest.MockedFunction<
  typeof isDatabaseAvailable
>

describe('/api/admin/dashboard/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (
    headers: Record<string, string> = {},
    cookies: Record<string, string> = {}
  ) => {
    return {
      headers: {
        get: jest.fn((key: string) => headers[key] || null),
      },
      cookies: {
        get: jest.fn((key: string) => (cookies[key] ? { value: cookies[key] } : undefined)),
      },
    } as unknown as NextRequest
  }

  it('returns 401 when no token is provided', async () => {
    const request = createMockRequest()
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized - No token provided')
  })

  it('returns 401 when token is invalid', async () => {
    mockVerifyToken.mockReturnValue(null)

    const request = createMockRequest({ authorization: 'Bearer invalid-token' })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized - Invalid token')
    expect(mockVerifyToken).toHaveBeenCalledWith('invalid-token')
  })

  it('returns 403 when user is not admin', async () => {
    const user = { id: '1', role: 'USER' }
    mockVerifyToken.mockReturnValue(user as any)
    mockIsAdmin.mockReturnValue(false)

    const request = createMockRequest({ authorization: 'Bearer valid-token' })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Forbidden - Admin access required')
    expect(mockIsAdmin).toHaveBeenCalledWith(user)
  })

  it('uses token from cookie when authorization header is not present', async () => {
    const user = { id: '1', role: 'ADMIN' }
    mockVerifyToken.mockReturnValue(user as any)
    mockIsAdmin.mockReturnValue(true)
    mockIsDatabaseAvailable.mockReturnValue(false)

    const request = createMockRequest({}, { 'auth-token': 'cookie-token' })
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockVerifyToken).toHaveBeenCalledWith('cookie-token')
  })

  it('returns mock stats when database is not available', async () => {
    const user = { id: '1', role: 'ADMIN' }
    mockVerifyToken.mockReturnValue(user as any)
    mockIsAdmin.mockReturnValue(true)
    mockIsDatabaseAvailable.mockReturnValue(false)

    const request = createMockRequest({ authorization: 'Bearer valid-token' })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      totalUsers: 2,
      totalPosts: 2,
      totalViews: 30,
      totalEmpathies: 20,
      recentUsers: [
        {
          id: '1',
          userName: 'user1',
          email: 'user1@example.com',
          createdAt: '2023-01-01T00:00:00Z',
        },
        {
          id: '2',
          userName: 'user2',
          email: 'user2@example.com',
          createdAt: '2023-01-02T00:00:00Z',
        },
      ],
      recentPosts: [
        {
          id: '1',
          title: 'Post 1',
          userName: 'user1',
          createdAt: '2023-01-01T00:00:00Z',
          empathyCount: 5,
        },
        {
          id: '2',
          title: 'Post 2',
          userName: 'user2',
          createdAt: '2023-01-02T00:00:00Z',
          empathyCount: 15,
        },
      ],
    })
  })

  it('returns database stats when database is available', async () => {
    const user = { id: '1', role: 'ADMIN' }
    mockVerifyToken.mockReturnValue(user as any)
    mockIsAdmin.mockReturnValue(true)
    mockIsDatabaseAvailable.mockReturnValue(true)

    // Mock database responses
    const mockPrisma = prisma as any
    mockPrisma.user.count.mockResolvedValue(100)
    mockPrisma.post.count.mockResolvedValue(50)
    mockPrisma.post.aggregate.mockResolvedValue({ _sum: { viewCount: 1000 } })
    mockPrisma.empathy.count.mockResolvedValue(200)
    mockPrisma.user.findMany.mockResolvedValue([
      { id: '1', userName: 'user1', email: 'user1@example.com', createdAt: new Date('2023-01-01') },
    ])
    mockPrisma.post.findMany.mockResolvedValue([
      {
        id: '1',
        title: 'Post 1',
        createdAt: new Date('2023-01-01'),
        empathyCount: 5,
        user: { userName: 'user1' },
      },
    ])

    const request = createMockRequest({ authorization: 'Bearer valid-token' })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      totalUsers: 100,
      totalPosts: 50,
      totalViews: 1000,
      totalEmpathies: 200,
      recentUsers: [
        {
          id: '1',
          userName: 'user1',
          email: 'user1@example.com',
          createdAt: '2023-01-01T00:00:00.000Z',
        },
      ],
      recentPosts: [
        {
          id: '1',
          title: 'Post 1',
          userName: 'user1',
          createdAt: '2023-01-01T00:00:00.000Z',
          empathyCount: 5,
        },
      ],
    })
  })

  it('handles null viewCount aggregate', async () => {
    const user = { id: '1', role: 'ADMIN' }
    mockVerifyToken.mockReturnValue(user as any)
    mockIsAdmin.mockReturnValue(true)
    mockIsDatabaseAvailable.mockReturnValue(true)

    const mockPrisma = prisma as any
    mockPrisma.user.count.mockResolvedValue(10)
    mockPrisma.post.count.mockResolvedValue(5)
    mockPrisma.post.aggregate.mockResolvedValue({ _sum: { viewCount: null } })
    mockPrisma.empathy.count.mockResolvedValue(20)
    mockPrisma.user.findMany.mockResolvedValue([])
    mockPrisma.post.findMany.mockResolvedValue([])

    const request = createMockRequest({ authorization: 'Bearer valid-token' })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.totalViews).toBe(0)
  })

  it('returns 500 when database error occurs', async () => {
    const user = { id: '1', role: 'ADMIN' }
    mockVerifyToken.mockReturnValue(user as any)
    mockIsAdmin.mockReturnValue(true)
    mockIsDatabaseAvailable.mockReturnValue(true)

    const mockPrisma = prisma as any
    mockPrisma.user.count.mockRejectedValue(new Error('Database error'))

    const request = createMockRequest({ authorization: 'Bearer valid-token' })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch dashboard stats')
  })

  it('handles missing createdAt in mock users', async () => {
    const user = { id: '1', role: 'ADMIN' }
    mockVerifyToken.mockReturnValue(user as any)
    mockIsAdmin.mockReturnValue(true)
    mockIsDatabaseAvailable.mockReturnValue(false)

    // Override mock data with missing createdAt
    jest.doMock('@/lib/mock-data', () => ({
      MOCK_USERS: [{ id: '1', userName: 'user1', email: 'user1@example.com' }],
      MOCK_POSTS: [{ id: '1', title: 'Post 1', userId: '1' }],
    }))

    const request = createMockRequest({ authorization: 'Bearer valid-token' })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.recentUsers[0]).toHaveProperty('createdAt')
    expect(data.recentPosts[0]).toHaveProperty('createdAt')
  })
})
