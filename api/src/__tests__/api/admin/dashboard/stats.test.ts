import { NextRequest } from 'next/server'

// AdminControllerのモックを先に設定
const mockGetDashboardStats = jest.fn()

jest.mock('@api/framework/controllers/AdminController', () => {
  return {
    AdminController: jest.fn().mockImplementation(() => {
      return {
        getDashboardStats: mockGetDashboardStats,
      }
    }),
  }
})

describe('/api/admin/dashboard/stats', () => {
  let GET: typeof import('@/app/api/admin/dashboard/stats/route').GET

  beforeAll(async () => {
    // モック設定後にモジュールをインポート
    const module = await import('@/app/api/admin/dashboard/stats/route')
    GET = module.GET
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('管理者ダッシュボードの統計を取得できる', async () => {
    const mockStats = {
      totalUsers: 100,
      activeUsers: 85,
      totalPosts: 500,
      publishedPosts: 450,
      totalComments: 2000,
      newUsersToday: 5,
      newPostsToday: 20,
      recentActivities: [
        {
          id: 'activity-1',
          type: 'user_registration',
          userId: 'user-1',
          userName: 'newuser',
          timestamp: new Date().toISOString(),
        },
      ],
    }

    const mockResponse = new Response(JSON.stringify({ success: true, stats: mockStats }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

    mockGetDashboardStats.mockResolvedValue(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/admin/dashboard/stats', {
      headers: {
        Cookie: 'admin-auth-token=valid-admin-token',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(mockGetDashboardStats).toHaveBeenCalledWith(request)
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.stats).toEqual(mockStats)
  })

  it('管理者権限がない場合は401を返す', async () => {
    const mockResponse = new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })

    mockGetDashboardStats.mockResolvedValue(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/admin/dashboard/stats')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('一般ユーザーの場合は403を返す', async () => {
    const mockResponse = new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })

    mockGetDashboardStats.mockResolvedValue(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/admin/dashboard/stats', {
      headers: {
        Cookie: 'admin-auth-token=user-token', // 一般ユーザーのトークン
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Forbidden')
  })

  it('データベースエラーの場合は500を返す', async () => {
    const mockResponse = new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })

    mockGetDashboardStats.mockResolvedValue(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/admin/dashboard/stats', {
      headers: {
        Cookie: 'admin-auth-token=valid-admin-token',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal Server Error')
  })

  it('モックモードでも統計を取得できる', async () => {
    const mockStats = {
      totalUsers: 50,
      activeUsers: 45,
      totalPosts: 200,
      publishedPosts: 180,
      totalComments: 800,
      newUsersToday: 2,
      newPostsToday: 10,
      recentActivities: [],
      message: 'デモモード',
    }

    const mockResponse = new Response(JSON.stringify({ success: true, stats: mockStats }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

    mockGetDashboardStats.mockResolvedValue(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/admin/dashboard/stats', {
      headers: {
        Cookie: 'admin-auth-token=valid-admin-token',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.stats.message).toBe('デモモード')
  })
})
