import { NextRequest } from 'next/server'
import { GET } from '@/app/api/admin/withdrawal-surveys/route'
import { prisma } from '@/lib/prisma'
import { verifyToken, isAdmin } from '@/lib/auth/auth'
import { WithdrawalReason } from '@api/domain/entities/WithdrawalSurvey'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    withdrawalSurvey: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth/auth', () => ({
  verifyToken: jest.fn(),
  isAdmin: jest.fn(),
}))

describe('GET /api/admin/withdrawal-surveys', () => {
  const mockAdminUser = {
    id: 'admin-user-id',
    email: 'admin@example.com',
    role: 'ADMIN',
    status: 'ACTIVE',
  }

  const mockSurveys = [
    {
      id: 'survey-1',
      userId: 'user-1',
      reason: 'not_useful',
      feedback: 'サービスが期待と違いました',
      wouldRecommend: false,
      createdAt: '2024-01-15T00:00:00.000Z',
      user: {
        userName: 'テストユーザー1',
      },
    },
    {
      id: 'survey-2',
      userId: 'user-2',
      reason: 'privacy_concerns',
      feedback: 'プライバシーが心配です',
      wouldRecommend: false,
      createdAt: '2024-01-14T00:00:00.000Z',
      user: {
        userName: 'テストユーザー2',
      },
    },
    {
      id: 'survey-3',
      userId: 'user-3',
      reason: 'other',
      reasonOther: '引っ越しのため',
      feedback: 'また機会があれば利用したいです',
      wouldRecommend: true,
      createdAt: '2024-01-13T00:00:00.000Z',
      user: {
        userName: 'テストユーザー3',
      },
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(verifyToken as jest.Mock).mockReturnValue(mockAdminUser)
    ;(isAdmin as jest.Mock).mockReturnValue(true)
    ;(prisma?.user.findUnique as jest.Mock).mockResolvedValue(mockAdminUser)
    ;(prisma?.withdrawalSurvey.findMany as jest.Mock).mockResolvedValue(mockSurveys)
    ;(prisma?.withdrawalSurvey.count as jest.Mock).mockResolvedValue(3)
  })

  const createRequest = (url: string, headers: Record<string, string> = {}) => {
    return new NextRequest(url, {
      method: 'GET',
      headers: {
        ...headers,
      },
    })
  }

  describe('成功ケース', () => {
    it('管理者権限で退会アンケート一覧を取得できる', async () => {
      const request = createRequest('http://localhost:3000/api/admin/withdrawal-surveys', {
        Authorization: 'Bearer valid-admin-token',
      })

      const response = await GET(request, { params: Promise.resolve({}) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        surveys: mockSurveys,
        total: 3,
        page: 1,
        limit: 50,
        totalPages: 1,
      })
    })

    it('ページネーションパラメータが正しく処理される', async () => {
      const request = createRequest(
        'http://localhost:3000/api/admin/withdrawal-surveys?page=2&limit=10',
        { Authorization: 'Bearer valid-admin-token' }
      )

      await GET(request, { params: Promise.resolve({}) })

      expect(prisma?.withdrawalSurvey.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 10,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              userName: true,
            },
          },
        },
      })
    })
  })

  describe('エラーケース', () => {
    it('認証トークンがない場合、401エラー', async () => {
      const request = createRequest('http://localhost:3000/api/admin/withdrawal-surveys')

      const response = await GET(request, { params: Promise.resolve({}) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({
        error: 'Unauthorized - No token provided',
      })
    })

    it('一般ユーザーの場合、403エラー', async () => {
      ;(isAdmin as jest.Mock).mockReturnValue(false)

      const request = createRequest('http://localhost:3000/api/admin/withdrawal-surveys', {
        Authorization: 'Bearer valid-user-token',
      })

      const response = await GET(request, { params: Promise.resolve({}) })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data).toEqual({
        error: 'Forbidden - Admin access required',
      })
    })

    it('無効なトークンの場合、401エラー', async () => {
      ;(verifyToken as jest.Mock).mockReturnValue(null)

      const request = createRequest('http://localhost:3000/api/admin/withdrawal-surveys', {
        Authorization: 'Bearer invalid-token',
      })

      const response = await GET(request, { params: Promise.resolve({}) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({
        error: 'Unauthorized - Invalid token',
      })
    })
  })
})
