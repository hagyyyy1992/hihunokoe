import { WithdrawalSurvey, WithdrawalReason } from '@api/domain/entities/WithdrawalSurvey'
import { WithdrawalSurveyRepository } from '@api/domain/repositories/WithdrawalSurveyRepository'

describe('WithdrawalSurveyRepository', () => {
  let repository: WithdrawalSurveyRepository
  let mockSurveys: WithdrawalSurvey[]

  beforeEach(() => {
    // モックデータの準備
    mockSurveys = [
      {
        id: 'survey-1',
        userId: 'user-1',
        reason: WithdrawalReason.NOT_USEFUL,
        reasonOther: undefined,
        feedback: 'サービスが使いにくかった',
        wouldRecommend: false,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: 'survey-2',
        userId: 'user-2',
        reason: WithdrawalReason.PRIVACY_CONCERNS,
        reasonOther: undefined,
        feedback: 'プライバシーが心配',
        wouldRecommend: false,
        createdAt: new Date('2024-01-02'),
      },
      {
        id: 'survey-3',
        userId: 'user-3',
        reason: WithdrawalReason.FOUND_ALTERNATIVE,
        reasonOther: undefined,
        feedback: undefined,
        wouldRecommend: true,
        createdAt: new Date('2024-01-03'),
      },
      {
        id: 'survey-4',
        userId: 'user-4',
        reason: WithdrawalReason.OTHER,
        reasonOther: '{"allReasons":["other"],"otherText":"料金が高い"}',
        feedback: '月額料金が予算に合わなかった',
        wouldRecommend: true,
        createdAt: new Date('2024-01-04'),
      },
    ]

    // モックリポジトリの実装
    repository = {
      create: jest.fn(async survey => ({
        ...survey,
        id: `survey-${Date.now()}`,
        createdAt: new Date(),
      })),

      findByUserId: jest.fn(async userId => {
        return mockSurveys.find(s => s.userId === userId) || null
      }),

      findAll: jest.fn(async options => {
        let surveys = [...mockSurveys]

        // ソート処理
        if (options?.orderBy) {
          surveys.sort((a, b) => {
            const aValue = a[options.orderBy!.field as keyof WithdrawalSurvey]
            const bValue = b[options.orderBy!.field as keyof WithdrawalSurvey]

            if (options.orderBy!.direction === 'asc') {
              return (aValue || '') > (bValue || '') ? 1 : -1
            } else {
              return (aValue || '') < (bValue || '') ? 1 : -1
            }
          })
        }

        // ページネーション処理
        const skip = options?.skip || 0
        const take = options?.take || surveys.length
        const paginatedSurveys = surveys.slice(skip, skip + take)

        return {
          surveys: paginatedSurveys,
          total: mockSurveys.length,
        }
      }),

      getStatistics: jest.fn(async (startDate, endDate) => {
        let filteredSurveys = mockSurveys

        // 日付フィルタリング
        if (startDate || endDate) {
          filteredSurveys = mockSurveys.filter(survey => {
            const surveyDate = survey.createdAt
            if (startDate && surveyDate < startDate) return false
            if (endDate && surveyDate > endDate) return false
            return true
          })
        }

        // 理由別の集計
        const byReason = filteredSurveys.reduce(
          (acc, survey) => {
            acc[survey.reason] = (acc[survey.reason] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        )

        // 推奨率の計算
        const recommendCount = filteredSurveys.filter(s => s.wouldRecommend === true).length
        const totalWithRecommendation = filteredSurveys.filter(
          s => s.wouldRecommend !== undefined
        ).length
        const recommendationRate =
          totalWithRecommendation > 0 ? (recommendCount / totalWithRecommendation) * 100 : 0

        return {
          totalResponses: filteredSurveys.length,
          byReason,
          recommendationRate,
        }
      }),
    }
  })

  describe('create', () => {
    it('新しい退会アンケートを作成できる', async () => {
      const newSurvey = {
        userId: 'user-5',
        reason: WithdrawalReason.TOO_MANY_EMAILS,
        reasonOther: undefined,
        feedback: 'メールが多すぎる',
        wouldRecommend: false,
      }

      const created = await repository.create(newSurvey)

      expect(created).toMatchObject(newSurvey)
      expect(created.id).toBeDefined()
      expect(created.createdAt).toBeInstanceOf(Date)
      expect(repository.create).toHaveBeenCalledWith(newSurvey)
    })

    it('複数選択の理由を含むアンケートを作成できる', async () => {
      const newSurvey = {
        userId: 'user-6',
        reason: WithdrawalReason.OTHER,
        reasonOther:
          '{"allReasons":["not_useful","privacy_concerns","other"],"otherText":"サポートが不十分"}',
        feedback: 'いくつかの理由で退会を決めました',
        wouldRecommend: false,
      }

      const created = await repository.create(newSurvey)

      expect(created).toMatchObject(newSurvey)
      expect(created.reasonOther).toBe(newSurvey.reasonOther)
    })
  })

  describe('findByUserId', () => {
    it('ユーザーIDで退会アンケートを検索できる', async () => {
      const survey = await repository.findByUserId('user-1')

      expect(survey).toBeDefined()
      expect(survey?.userId).toBe('user-1')
      expect(survey?.reason).toBe(WithdrawalReason.NOT_USEFUL)
      expect(repository.findByUserId).toHaveBeenCalledWith('user-1')
    })

    it('存在しないユーザーIDの場合はnullを返す', async () => {
      const survey = await repository.findByUserId('non-existent-user')

      expect(survey).toBeNull()
      expect(repository.findByUserId).toHaveBeenCalledWith('non-existent-user')
    })
  })

  describe('findAll', () => {
    it('すべての退会アンケートを取得できる', async () => {
      const result = await repository.findAll()

      expect(result.surveys).toHaveLength(4)
      expect(result.total).toBe(4)
      expect(repository.findAll).toHaveBeenCalled()
    })

    it('ページネーションが適用される', async () => {
      const result = await repository.findAll({
        skip: 1,
        take: 2,
      })

      expect(result.surveys).toHaveLength(2)
      expect(result.total).toBe(4)
      expect(result.surveys[0].id).toBe('survey-2')
      expect(result.surveys[1].id).toBe('survey-3')
    })

    it('作成日時の降順でソートできる', async () => {
      const result = await repository.findAll({
        orderBy: { field: 'createdAt', direction: 'desc' },
      })

      expect(result.surveys[0].id).toBe('survey-4')
      expect(result.surveys[3].id).toBe('survey-1')
    })

    it('ページネーションとソートを組み合わせられる', async () => {
      const result = await repository.findAll({
        skip: 0,
        take: 2,
        orderBy: { field: 'createdAt', direction: 'desc' },
      })

      expect(result.surveys).toHaveLength(2)
      expect(result.surveys[0].id).toBe('survey-4')
      expect(result.surveys[1].id).toBe('survey-3')
    })
  })

  describe('getStatistics', () => {
    it('全期間の統計情報を取得できる', async () => {
      const stats = await repository.getStatistics()

      expect(stats.totalResponses).toBe(4)
      expect(stats.byReason).toEqual({
        [WithdrawalReason.NOT_USEFUL]: 1,
        [WithdrawalReason.PRIVACY_CONCERNS]: 1,
        [WithdrawalReason.FOUND_ALTERNATIVE]: 1,
        [WithdrawalReason.OTHER]: 1,
      })
      expect(stats.recommendationRate).toBe(50) // 2/4 = 50%
    })

    it('期間を指定して統計情報を取得できる', async () => {
      const startDate = new Date('2024-01-02')
      const endDate = new Date('2024-01-03')

      const stats = await repository.getStatistics(startDate, endDate)

      expect(stats.totalResponses).toBe(2)
      expect(stats.byReason).toEqual({
        [WithdrawalReason.PRIVACY_CONCERNS]: 1,
        [WithdrawalReason.FOUND_ALTERNATIVE]: 1,
      })
      expect(stats.recommendationRate).toBe(50) // 1/2 = 50%
    })

    it('推奨意向のデータがない場合は推奨率0を返す', async () => {
      // 全てのwouldRecommendをundefinedに設定
      mockSurveys.forEach(survey => {
        survey.wouldRecommend = undefined
      })

      const stats = await repository.getStatistics()

      expect(stats.recommendationRate).toBe(0)
    })

    it('期間内にデータがない場合は空の統計を返す', async () => {
      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-12-31')

      const stats = await repository.getStatistics(startDate, endDate)

      expect(stats.totalResponses).toBe(0)
      expect(stats.byReason).toEqual({})
      expect(stats.recommendationRate).toBe(0)
    })
  })
})
