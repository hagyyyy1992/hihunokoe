import { NextRequest } from 'next/server'

// モック設定
const mockPrisma = {
  user: {
    findMany: jest.fn(),
  },
  post: {
    findMany: jest.fn(),
  },
}

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

jest.mock('@/lib/auth/admin-middleware', () => ({
  verifyAdminToken: jest.fn(),
}))

jest.mock('@api/interface-adapters/repositories/CachedAdminStats.repository', () => ({
  CachedAdminStatsRepository: jest.fn().mockImplementation(() => ({
    getDashboardStats: jest.fn(),
    getUserGrowthByDate: jest.fn(),
    getPostGrowthByDate: jest.fn(),
  })),
}))

import { verifyAdminToken } from '@/lib/auth/admin-middleware'
import { CachedAdminStatsRepository } from '@api/interface-adapters/repositories/CachedAdminStats.repository'

const mockVerifyAdminToken = verifyAdminToken as jest.Mock
const mockCachedAdminStatsRepository = CachedAdminStatsRepository as unknown as jest.Mock

describe('/api/admin/dashboard/stats', () => {
  let GET: typeof import('@/app/api/admin/dashboard/stats/route').GET

  beforeAll(async () => {
    // モジュールをインポート
    const module = await import('@/app/api/admin/dashboard/stats/route')
    GET = module.GET
  })

  beforeEach(() => {
    jest.clearAllMocks()
    // Prismaモックをリセット
    mockPrisma.user.findMany.mockClear()
    mockPrisma.post.findMany.mockClear()
  })

  it('管理者ダッシュボードの統計を取得できる', async () => {
    const mockStats = {
      totalUsers: 100,
      activeUsers: 85,
      suspendedUsers: 15,
      totalPosts: 500,
      publishedPosts: 450,
      unpublishedPosts: 50,
      todayRegistrations: 5,
      todayPosts: 20,
    }

    const mockRecentUsers = [
      {
        id: 'user-1',
        userName: 'newuser',
        email: 'user@example.com',
        createdAt: new Date(),
      },
    ]

    const mockRecentPosts = [
      {
        id: 'post-1',
        title: 'Test Post',
        status: 'published',
        viewCount: 0,
        createdAt: new Date(),
        user: {
          id: 'user-1',
          userName: 'testuser',
        },
      },
    ]

    // 管理者認証のモック
    mockVerifyAdminToken.mockResolvedValue({
      isValid: true,
      user: { id: 'admin-1', role: 'ADMIN' },
    })

    // CachedAdminStatsRepositoryのモック
    const mockRepository = {
      getDashboardStats: jest.fn().mockResolvedValue(mockStats),
      getUserGrowthByDate: jest.fn().mockResolvedValue([]),
      getPostGrowthByDate: jest.fn().mockResolvedValue([]),
    }
    mockCachedAdminStatsRepository.mockImplementation(() => mockRepository)

    // Prismaのモック
    mockPrisma.user.findMany.mockResolvedValue(mockRecentUsers)
    mockPrisma.post.findMany.mockResolvedValue(mockRecentPosts)

    const request = new NextRequest('http://localhost:3000/api/admin/dashboard/stats', {
      headers: {
        Cookie: 'admin-auth-token=valid-admin-token',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.stats).toEqual(mockStats)
    expect(data.recentUsers).toHaveLength(1)
    expect(data.recentPosts).toHaveLength(1)
  })

  it('管理者権限がない場合は401を返す', async () => {
    // 認証失敗のモック
    mockVerifyAdminToken.mockResolvedValue({
      isValid: false,
      user: null,
    })

    const request = new NextRequest('http://localhost:3000/api/admin/dashboard/stats')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('管理者権限が必要です')
  })

  it('一般ユーザーの場合は401を返す', async () => {
    // 一般ユーザーの認証（管理者ではない）
    mockVerifyAdminToken.mockResolvedValue({
      isValid: false,
      user: { id: 'user-1', role: 'USER' },
    })

    const request = new NextRequest('http://localhost:3000/api/admin/dashboard/stats', {
      headers: {
        Cookie: 'admin-auth-token=user-token',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('管理者権限が必要です')
  })

  it('データベースエラーの場合は500を返す', async () => {
    // 管理者認証のモック
    mockVerifyAdminToken.mockResolvedValue({
      isValid: true,
      user: { id: 'admin-1', role: 'ADMIN' },
    })

    // リポジトリがエラーをスロー
    const mockRepository = {
      getDashboardStats: jest.fn().mockRejectedValue(new Error('Database error')),
      getUserGrowthByDate: jest.fn().mockRejectedValue(new Error('Database error')),
      getPostGrowthByDate: jest.fn().mockRejectedValue(new Error('Database error')),
    }
    mockCachedAdminStatsRepository.mockImplementation(() => mockRepository)

    // Prismaのモックをリセット
    mockPrisma.user.findMany.mockRejectedValue(new Error('Database error'))
    mockPrisma.post.findMany.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/admin/dashboard/stats', {
      headers: {
        Cookie: 'admin-auth-token=valid-admin-token',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('統計データの取得に失敗しました')
  })

  it('リポジトリが初期化できない場合は500を返す', async () => {
    // 管理者認証のモック
    mockVerifyAdminToken.mockResolvedValue({
      isValid: true,
      user: { id: 'admin-1', role: 'ADMIN' },
    })

    // CachedAdminStatsRepositoryの初期化エラー
    mockCachedAdminStatsRepository.mockImplementation(() => {
      throw new Error('Repository initialization failed')
    })

    const request = new NextRequest('http://localhost:3000/api/admin/dashboard/stats', {
      headers: {
        Cookie: 'admin-auth-token=valid-admin-token',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('統計データの取得に失敗しました')
  })
})
