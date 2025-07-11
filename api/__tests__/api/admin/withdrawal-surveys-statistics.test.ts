import { NextRequest } from 'next/server'
import { GET } from '@/app/api/admin/withdrawal-surveys/statistics/route'
import { prisma } from '@/lib/prisma'
import { verifyToken, isAdmin } from '@/lib/auth/auth'
import { WithdrawalReason } from '@api/domain/entities/WithdrawalSurvey'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    withdrawalSurvey: {
      count: jest.fn(),
      groupBy: jest.fn(),
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

describe('GET /api/admin/withdrawal-surveys/statistics', () => {
  const mockAdminUser = {
    id: 'admin-user-id',
    email: 'admin@example.com',
    role: 'ADMIN',
    status: 'ACTIVE',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(verifyToken as jest.Mock).mockReturnValue(mockAdminUser)
    ;(isAdmin as jest.Mock).mockReturnValue(true)
    ;(prisma?.user.findUnique as jest.Mock).mockResolvedValue(mockAdminUser)
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
    it('退会アンケートの統計情報を取得できる', async () => {
      const mockReasonCounts = [
        { reason: WithdrawalReason.NOT_USEFUL, _count: { reason: 5 } },
        { reason: WithdrawalReason.PRIVACY_CONCERNS, _count: { reason: 3 } },
        { reason: WithdrawalReason.TOO_MANY_EMAILS, _count: { reason: 2 } },
      ]

      ;(prisma?.withdrawalSurvey.count as jest.Mock)
        .mockResolvedValueOnce(20) // total
        .mockResolvedValueOnce(15) // recommendCount
        .mockResolvedValueOnce(3) // recommendYesCount
      ;(prisma?.withdrawalSurvey.groupBy as jest.Mock).mockResolvedValue(mockReasonCounts)

      const request = createRequest(
        'http://localhost:3000/api/admin/withdrawal-surveys/statistics',
        { Authorization: 'Bearer valid-admin-token' }
      )

      const response = await GET(request, { params: Promise.resolve({}) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        totalResponses: 20,
        byReason: {
          [WithdrawalReason.NOT_USEFUL]: 5,
          [WithdrawalReason.PRIVACY_CONCERNS]: 3,
          [WithdrawalReason.TOO_MANY_EMAILS]: 2,
        },
        recommendationRate: 20, // (3/15) * 100 = 20
      })
    })

    it('推薦率が0%の場合も正しく計算される', async () => {
      ;(prisma?.withdrawalSurvey.count as jest.Mock)
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(10) // recommendCount
        .mockResolvedValueOnce(0) // recommendYesCount
      ;(prisma?.withdrawalSurvey.groupBy as jest.Mock).mockResolvedValue([
        { reason: WithdrawalReason.NOT_USEFUL, _count: { reason: 10 } },
      ])

      const request = createRequest(
        'http://localhost:3000/api/admin/withdrawal-surveys/statistics',
        { Authorization: 'Bearer valid-admin-token' }
      )

      const response = await GET(request, { params: Promise.resolve({}) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.recommendationRate).toBe(0)
    })
  })

  describe('エラーケース', () => {
    it('認証トークンがない場合、401エラー', async () => {
      const request = createRequest('http://localhost:3000/api/admin/withdrawal-surveys/statistics')

      const response = await GET(request, { params: Promise.resolve({}) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({
        error: 'Unauthorized - No token provided',
      })
    })

    it('一般ユーザーの場合、403エラー', async () => {
      ;(isAdmin as jest.Mock).mockReturnValue(false)

      const request = createRequest(
        'http://localhost:3000/api/admin/withdrawal-surveys/statistics',
        { Authorization: 'Bearer valid-user-token' }
      )

      const response = await GET(request, { params: Promise.resolve({}) })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data).toEqual({
        error: 'Forbidden - Admin access required',
      })
    })

    it('無効なトークンの場合、401エラー', async () => {
      ;(verifyToken as jest.Mock).mockReturnValue(null)

      const request = createRequest(
        'http://localhost:3000/api/admin/withdrawal-surveys/statistics',
        { Authorization: 'Bearer invalid-token' }
      )

      const response = await GET(request, { params: Promise.resolve({}) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({
        error: 'Unauthorized - Invalid token',
      })
    })
  })
})
