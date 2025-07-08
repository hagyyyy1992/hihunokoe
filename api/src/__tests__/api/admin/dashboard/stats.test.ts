jest.mock('@api/framework/controllers/AdminController', () => ({
  AdminController: jest.fn().mockImplementation(() => ({
    getDashboardStats: jest.fn().mockImplementation(async request => {
      // Default mock implementation
      return new Response(JSON.stringify({ message: 'Mock response' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }),
  })),
}))

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/admin/dashboard/stats/route'

// Mock the controller

const createMockResponse = (status, data) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
  })
}

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
    mockGetDashboardStats.mockReturnValue(null)

    const request = createMockRequest({ authorization: 'Bearer invalid-token' })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized - Invalid token')
    expect(mockGetDashboardStats).toHaveBeenCalledWith('invalid-token')
  })

  it('returns 403 when user is not admin', async () => {
    const user = { id: '1', role: 'USER' }
    mockGetDashboardStats.mockReturnValue(user as any)
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
    mockGetDashboardStats.mockReturnValue(user as any)
    mockIsAdmin.mockReturnValue(true)
    mockIsDatabaseAvailable.mockReturnValue(false)

    const request = createMockRequest({}, { 'auth-token': 'cookie-token' })
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockGetDashboardStats).toHaveBeenCalledWith('cookie-token')
  })

  it('returns mock stats when database is not available', async () => {
    const user = { id: '1', role: 'ADMIN' }
    mockGetDashboardStats.mockReturnValue(user as any)
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
          username: 'user1',
          email: 'user1@example.com',
          createdAt: '2023-01-01T00:00:00Z',
        },
        {
          id: '2',
          username: 'user2',
          email: 'user2@example.com',
          createdAt: '2023-01-02T00:00:00Z',
        },
      ],
      recentPosts: [
        {
          id: '1',
          title: 'Post 1',
          username: 'user1',
          createdAt: '2023-01-01T00:00:00Z',
          empathyCount: 5,
        },
        {
          id: '2',
          title: 'Post 2',
          username: 'user2',
          createdAt: '2023-01-02T00:00:00Z',
          empathyCount: 15,
        },
      ],
    })
  })

  it('returns database stats when database is available', async () => {
    const user = { id: '1', role: 'ADMIN' }
    mockGetDashboardStats.mockReturnValue(user as any)
    mockIsAdmin.mockReturnValue(true)
    mockIsDatabaseAvailable.mockReturnValue(true)

    // Mock database responses
    const mockPrisma = prisma as any
    mockPrisma.user.count.mockResolvedValue(createMockResponse(200, 100))
    mockPrisma.post.count.mockResolvedValue(createMockResponse(200, 50))
    mockPrisma.post.aggregate.mockResolvedValue(
      createMockResponse(200, { _sum: { viewCount: 1000 } })
    )
    mockPrisma.empathy.count.mockResolvedValue(createMockResponse(200, 200))
    mockPrisma.user.findMany.mockResolvedValue(
      createMockResponse(200, [
        {
          id: '1',
          username: 'user1',
          email: 'user1@example.com',
          createdAt: new Date('2023-01-01'),
        },
      ])
    )
    mockPrisma.post.findMany.mockResolvedValue(
      createMockResponse(200, [
        {
          id: '1',
          title: 'Post 1',
          createdAt: new Date('2023-01-01'),
          empathyCount: 5,
          user: { username: 'user1' },
        },
      ])
    )

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
          username: 'user1',
          email: 'user1@example.com',
          createdAt: '2023-01-01T00:00:00.000Z',
        },
      ],
      recentPosts: [
        {
          id: '1',
          title: 'Post 1',
          username: 'user1',
          createdAt: '2023-01-01T00:00:00.000Z',
          empathyCount: 5,
        },
      ],
    })
  })

  it('handles null viewCount aggregate', async () => {
    const user = { id: '1', role: 'ADMIN' }
    mockGetDashboardStats.mockReturnValue(user as any)
    mockIsAdmin.mockReturnValue(true)
    mockIsDatabaseAvailable.mockReturnValue(true)

    const mockPrisma = prisma as any
    mockPrisma.user.count.mockResolvedValue(createMockResponse(200, 10))
    mockPrisma.post.count.mockResolvedValue(createMockResponse(200, 5))
    mockPrisma.post.aggregate.mockResolvedValue(
      createMockResponse(200, { _sum: { viewCount: null } })
    )
    mockPrisma.empathy.count.mockResolvedValue(createMockResponse(200, 20))
    mockPrisma.user.findMany.mockResolvedValue(createMockResponse(200, []))
    mockPrisma.post.findMany.mockResolvedValue(createMockResponse(200, []))

    const request = createMockRequest({ authorization: 'Bearer valid-token' })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.totalViews).toBe(0)
  })

  it('returns 500 when database error occurs', async () => {
    const user = { id: '1', role: 'ADMIN' }
    mockGetDashboardStats.mockReturnValue(user as any)
    mockIsAdmin.mockReturnValue(true)
    mockIsDatabaseAvailable.mockReturnValue(true)

    const mockPrisma = prisma as any
    mockPrisma.user.count.mockResolvedValue(createMockResponse(500, { error: 'Database error' }))

    const request = createMockRequest({ authorization: 'Bearer valid-token' })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch dashboard stats')
  })

  it('handles missing createdAt in mock users', async () => {
    const user = { id: '1', role: 'ADMIN' }
    mockGetDashboardStats.mockReturnValue(user as any)
    mockIsAdmin.mockReturnValue(true)
    mockIsDatabaseAvailable.mockReturnValue(false)

    // Override mock data with missing createdAt
    jest.doMock('@/lib/mock-data', () => ({
      MOCK_USERS: [{ id: '1', username: 'user1', email: 'user1@example.com' }],
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
