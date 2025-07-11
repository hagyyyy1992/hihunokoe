import { PrismaClient } from '@prisma/client'
import { WithdrawalSurveyRepository } from '@api/interface-adapters/repositories/WithdrawalSurvey.repository'
import { WithdrawalSurvey, WithdrawalReason } from '@api/domain/entities/WithdrawalSurvey'

// Prismaクライアントのモック
const mockPrismaClient = {
  withdrawalSurvey: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
}

describe('WithdrawalSurveyRepository', () => {
  let repository: WithdrawalSurveyRepository

  beforeEach(() => {
    jest.clearAllMocks()
    repository = new WithdrawalSurveyRepository(mockPrismaClient as unknown as PrismaClient)
  })

  describe('create', () => {
    it('新しい退会アンケートを作成できる', async () => {
      const surveyData = {
        userId: 'user-123',
        reason: WithdrawalReason.PRIVACY_CONCERNS,
        reasonOther: 'プライバシーポリシーが不明確',
        feedback: 'もっと透明性が必要です',
        wouldRecommend: false,
      }

      const mockCreatedSurvey = {
        id: 'survey-456',
        userId: surveyData.userId,
        reason: 'privacy_concerns',
        reasonOther: surveyData.reasonOther,
        feedback: surveyData.feedback,
        wouldRecommend: false,
        createdAt: new Date('2024-01-15T10:00:00Z'),
      }

      mockPrismaClient.withdrawalSurvey.create.mockResolvedValue(mockCreatedSurvey)

      const result = await repository.create(surveyData)

      expect(mockPrismaClient.withdrawalSurvey.create).toHaveBeenCalledWith({
        data: {
          userId: surveyData.userId,
          reason: 'privacy_concerns',
          reasonOther: surveyData.reasonOther,
          feedback: surveyData.feedback,
          wouldRecommend: surveyData.wouldRecommend,
        },
      })

      expect(result).toEqual({
        id: 'survey-456',
        userId: surveyData.userId,
        reason: WithdrawalReason.PRIVACY_CONCERNS,
        reasonOther: surveyData.reasonOther,
        feedback: surveyData.feedback,
        wouldRecommend: surveyData.wouldRecommend,
        createdAt: new Date('2024-01-15T10:00:00Z'),
      })
    })

    it('オプショナルフィールドがnullの場合、undefinedに変換される', async () => {
      const surveyData = {
        userId: 'user-789',
        reason: WithdrawalReason.NOT_USEFUL,
      }

      const mockCreatedSurvey = {
        id: 'survey-012',
        userId: surveyData.userId,
        reason: 'not_useful',
        reasonOther: null,
        feedback: null,
        wouldRecommend: null,
        createdAt: new Date(),
      }

      mockPrismaClient.withdrawalSurvey.create.mockResolvedValue(mockCreatedSurvey)

      const result = await repository.create(surveyData)

      expect(result.reasonOther).toBeUndefined()
      expect(result.feedback).toBeUndefined()
      expect(result.wouldRecommend).toBeUndefined()
    })
  })

  describe('findByUserId', () => {
    it('ユーザーIDで最新の退会アンケートを取得できる', async () => {
      const mockSurvey = {
        id: 'survey-123',
        userId: 'user-456',
        reason: 'temporary_break',
        reasonOther: null,
        feedback: '一時的に休止します',
        wouldRecommend: true,
        createdAt: new Date('2024-01-20T15:00:00Z'),
      }

      mockPrismaClient.withdrawalSurvey.findFirst.mockResolvedValue(mockSurvey)

      const result = await repository.findByUserId('user-456')

      expect(mockPrismaClient.withdrawalSurvey.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-456' },
        orderBy: { createdAt: 'desc' },
      })

      expect(result).toEqual({
        id: 'survey-123',
        userId: 'user-456',
        reason: WithdrawalReason.TEMPORARY_BREAK,
        reasonOther: undefined,
        feedback: '一時的に休止します',
        wouldRecommend: true,
        createdAt: new Date('2024-01-20T15:00:00Z'),
      })
    })

    it('該当するアンケートがない場合、nullを返す', async () => {
      mockPrismaClient.withdrawalSurvey.findFirst.mockResolvedValue(null)

      const result = await repository.findByUserId('non-existent-user')

      expect(result).toBeNull()
    })
  })

  describe('findAll', () => {
    it('ページネーション付きでアンケート一覧を取得できる', async () => {
      const mockSurveys = [
        {
          id: 'survey-1',
          userId: 'user-1',
          reason: 'not_useful',
          reasonOther: null,
          feedback: 'フィードバック1',
          wouldRecommend: false,
          createdAt: new Date('2024-01-15'),
        },
        {
          id: 'survey-2',
          userId: 'user-2',
          reason: 'too_many_emails',
          reasonOther: null,
          feedback: null,
          wouldRecommend: false,
          createdAt: new Date('2024-01-14'),
        },
      ]

      mockPrismaClient.withdrawalSurvey.findMany.mockResolvedValue(mockSurveys)
      mockPrismaClient.withdrawalSurvey.count.mockResolvedValue(50)

      const result = await repository.findAll({
        skip: 0,
        take: 10,
        orderBy: { field: 'createdAt', direction: 'desc' },
      })

      expect(mockPrismaClient.withdrawalSurvey.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      })

      expect(result.surveys).toHaveLength(2)
      expect(result.total).toBe(50)
      expect(result.surveys[0].reason).toBe(WithdrawalReason.NOT_USEFUL)
      expect(result.surveys[1].reason).toBe(WithdrawalReason.TOO_MANY_EMAILS)
    })

    it('オプションなしでデフォルトのソート順を使用する', async () => {
      mockPrismaClient.withdrawalSurvey.findMany.mockResolvedValue([])
      mockPrismaClient.withdrawalSurvey.count.mockResolvedValue(0)

      await repository.findAll()

      expect(mockPrismaClient.withdrawalSurvey.findMany).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('getStatistics', () => {
    it('全期間の統計情報を取得できる', async () => {
      const mockReasonCounts = [
        { reason: 'not_useful', _count: { reason: 5 } },
        { reason: 'privacy_concerns', _count: { reason: 3 } },
        { reason: 'technical_issues', _count: { reason: 2 } },
      ]

      mockPrismaClient.withdrawalSurvey.count
        .mockResolvedValueOnce(10) // total count
        .mockResolvedValueOnce(3) // positive recommendation count
        .mockResolvedValueOnce(10) // total recommendation count
      mockPrismaClient.withdrawalSurvey.groupBy.mockResolvedValue(mockReasonCounts)

      const result = await repository.getStatistics()

      expect(result).toEqual({
        totalResponses: 10,
        byReason: {
          [WithdrawalReason.NOT_USEFUL]: 5,
          [WithdrawalReason.PRIVACY_CONCERNS]: 3,
          [WithdrawalReason.TECHNICAL_ISSUES]: 2,
        },
        recommendationRate: 30, // (3/10) * 100
      })
    })

    it('期間指定で統計情報を取得できる', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      mockPrismaClient.withdrawalSurvey.count
        .mockResolvedValueOnce(5) // total count
        .mockResolvedValueOnce(0) // positive recommendation count
        .mockResolvedValueOnce(0) // total recommendation count
      mockPrismaClient.withdrawalSurvey.groupBy.mockResolvedValue([])

      await repository.getStatistics(startDate, endDate)

      const expectedWhere = {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      }

      expect(mockPrismaClient.withdrawalSurvey.count).toHaveBeenCalledWith({
        where: expectedWhere,
      })

      expect(mockPrismaClient.withdrawalSurvey.groupBy).toHaveBeenCalledWith({
        by: ['reason'],
        where: expectedWhere,
        _count: { reason: true },
      })

      expect(mockPrismaClient.withdrawalSurvey.count).toHaveBeenCalledWith({
        where: {
          ...expectedWhere,
          wouldRecommend: true,
        },
      })

      expect(mockPrismaClient.withdrawalSurvey.count).toHaveBeenCalledWith({
        where: {
          ...expectedWhere,
          wouldRecommend: { not: null },
        },
      })
    })

    it('推奨データがない場合、推奨率0%を返す', async () => {
      mockPrismaClient.withdrawalSurvey.count
        .mockResolvedValueOnce(5) // total count
        .mockResolvedValueOnce(0) // positive recommendation count
        .mockResolvedValueOnce(0) // total recommendation count
      mockPrismaClient.withdrawalSurvey.groupBy.mockResolvedValue([])

      const result = await repository.getStatistics()

      expect(result.recommendationRate).toBe(0)
    })
  })

  describe('理由の変換メソッド', () => {
    it('ドメインエンティティからPrismaへの変換が正しく行われる', async () => {
      const surveyData = {
        userId: 'user-test',
        reason: WithdrawalReason.FOUND_ALTERNATIVE,
      }

      mockPrismaClient.withdrawalSurvey.create.mockResolvedValue({
        id: 'survey-test',
        userId: surveyData.userId,
        reason: 'found_alternative',
        reasonOther: null,
        feedback: null,
        wouldRecommend: null,
        createdAt: new Date(),
      })

      await repository.create(surveyData)

      expect(mockPrismaClient.withdrawalSurvey.create).toHaveBeenCalledWith({
        data: {
          userId: surveyData.userId,
          reason: 'found_alternative', // 正しく変換されている
          reasonOther: undefined,
          feedback: undefined,
          wouldRecommend: undefined,
        },
      })
    })

    it('すべての退会理由が双方向で正しく変換される', async () => {
      const reasonMappings = [
        { domain: WithdrawalReason.NOT_USEFUL, prisma: 'not_useful' },
        { domain: WithdrawalReason.PRIVACY_CONCERNS, prisma: 'privacy_concerns' },
        { domain: WithdrawalReason.TOO_MANY_EMAILS, prisma: 'too_many_emails' },
        { domain: WithdrawalReason.FOUND_ALTERNATIVE, prisma: 'found_alternative' },
        { domain: WithdrawalReason.TEMPORARY_BREAK, prisma: 'temporary_break' },
        { domain: WithdrawalReason.TECHNICAL_ISSUES, prisma: 'technical_issues' },
        { domain: WithdrawalReason.OTHER, prisma: 'other' },
      ]

      for (const mapping of reasonMappings) {
        // ドメイン → Prisma
        mockPrismaClient.withdrawalSurvey.create.mockResolvedValue({
          id: `survey-${mapping.prisma}`,
          userId: 'user-test',
          reason: mapping.prisma,
          reasonOther: null,
          feedback: null,
          wouldRecommend: null,
          createdAt: new Date(),
        })

        const created = await repository.create({
          userId: 'user-test',
          reason: mapping.domain,
        })

        expect(mockPrismaClient.withdrawalSurvey.create).toHaveBeenLastCalledWith({
          data: expect.objectContaining({
            reason: mapping.prisma,
          }),
        })

        // Prisma → ドメイン（作成結果の確認）
        expect(created.reason).toBe(mapping.domain)
      }
    })
  })

  describe('エラーハンドリング', () => {
    it('create時のデータベースエラーが適切に伝播される', async () => {
      mockPrismaClient.withdrawalSurvey.create.mockRejectedValue(
        new Error('Database connection error')
      )

      await expect(
        repository.create({
          userId: 'user-error',
          reason: WithdrawalReason.OTHER,
        })
      ).rejects.toThrow('Database connection error')
    })

    it('findByUserId時のデータベースエラーが適切に伝播される', async () => {
      mockPrismaClient.withdrawalSurvey.findFirst.mockRejectedValue(new Error('Query timeout'))

      await expect(repository.findByUserId('user-error')).rejects.toThrow('Query timeout')
    })

    it('getStatistics時のデータベースエラーが適切に伝播される', async () => {
      mockPrismaClient.withdrawalSurvey.count.mockRejectedValue(new Error('Count error'))

      await expect(repository.getStatistics()).rejects.toThrow('Count error')
    })
  })
})
