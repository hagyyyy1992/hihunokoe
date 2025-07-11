import { WithdrawalSurvey, WithdrawalReason } from '@api/domain/entities/WithdrawalSurvey'

describe('WithdrawalSurvey Entity', () => {
  describe('WithdrawalSurvey インターフェース', () => {
    it('必須フィールドのみで有効なWithdrawalSurveyを作成できる', () => {
      const survey: WithdrawalSurvey = {
        id: 'survey-123',
        userId: 'user-456',
        reason: WithdrawalReason.NOT_USEFUL,
        createdAt: new Date('2024-01-15T10:00:00Z'),
      }

      expect(survey.id).toBe('survey-123')
      expect(survey.userId).toBe('user-456')
      expect(survey.reason).toBe(WithdrawalReason.NOT_USEFUL)
      expect(survey.createdAt).toEqual(new Date('2024-01-15T10:00:00Z'))
      expect(survey.reasonOther).toBeUndefined()
      expect(survey.feedback).toBeUndefined()
      expect(survey.wouldRecommend).toBeUndefined()
    })

    it('すべてのフィールドを含むWithdrawalSurveyを作成できる', () => {
      const survey: WithdrawalSurvey = {
        id: 'survey-789',
        userId: 'user-012',
        reason: WithdrawalReason.OTHER,
        reasonOther: 'サービスの方向性が変わったため',
        feedback: 'UIは使いやすかったが、機能が期待と異なっていた',
        wouldRecommend: false,
        createdAt: new Date('2024-01-20T15:30:00Z'),
      }

      expect(survey.id).toBe('survey-789')
      expect(survey.userId).toBe('user-012')
      expect(survey.reason).toBe(WithdrawalReason.OTHER)
      expect(survey.reasonOther).toBe('サービスの方向性が変わったため')
      expect(survey.feedback).toBe('UIは使いやすかったが、機能が期待と異なっていた')
      expect(survey.wouldRecommend).toBe(false)
      expect(survey.createdAt).toEqual(new Date('2024-01-20T15:30:00Z'))
    })

    it('推奨意向がtrueのWithdrawalSurveyを作成できる', () => {
      const survey: WithdrawalSurvey = {
        id: 'survey-345',
        userId: 'user-678',
        reason: WithdrawalReason.TEMPORARY_BREAK,
        feedback: '一時的に利用を停止しますが、サービスは素晴らしいです',
        wouldRecommend: true,
        createdAt: new Date(),
      }

      expect(survey.reason).toBe(WithdrawalReason.TEMPORARY_BREAK)
      expect(survey.wouldRecommend).toBe(true)
      expect(survey.feedback).toBe('一時的に利用を停止しますが、サービスは素晴らしいです')
    })

    it('推奨意向がnullのWithdrawalSurveyを作成できる', () => {
      const survey: WithdrawalSurvey = {
        id: 'survey-901',
        userId: 'user-234',
        reason: WithdrawalReason.PRIVACY_CONCERNS,
        wouldRecommend: null as any, // 明示的にnullを設定
        createdAt: new Date(),
      }

      expect(survey.wouldRecommend).toBeNull()
    })
  })

  describe('WithdrawalReason Enum', () => {
    it('すべての退会理由が正しい値を持つ', () => {
      expect(WithdrawalReason.NOT_USEFUL).toBe('not_useful')
      expect(WithdrawalReason.PRIVACY_CONCERNS).toBe('privacy_concerns')
      expect(WithdrawalReason.TOO_MANY_EMAILS).toBe('too_many_emails')
      expect(WithdrawalReason.FOUND_ALTERNATIVE).toBe('found_alternative')
      expect(WithdrawalReason.TEMPORARY_BREAK).toBe('temporary_break')
      expect(WithdrawalReason.TECHNICAL_ISSUES).toBe('technical_issues')
      expect(WithdrawalReason.OTHER).toBe('other')
    })

    it('退会理由の総数が7つである', () => {
      const reasonValues = Object.values(WithdrawalReason)
      expect(reasonValues).toHaveLength(7)
    })

    it('各退会理由が一意である', () => {
      const reasonValues = Object.values(WithdrawalReason)
      const uniqueValues = new Set(reasonValues)
      expect(uniqueValues.size).toBe(reasonValues.length)
    })
  })

  describe('ビジネスロジックのテスト', () => {
    it('OTHERの理由を選択した場合、reasonOtherフィールドを設定すべき', () => {
      const survey: WithdrawalSurvey = {
        id: 'survey-567',
        userId: 'user-890',
        reason: WithdrawalReason.OTHER,
        reasonOther: '具体的な理由をここに記載',
        createdAt: new Date(),
      }

      expect(survey.reason).toBe(WithdrawalReason.OTHER)
      expect(survey.reasonOther).toBeTruthy()
      expect(survey.reasonOther).toBe('具体的な理由をここに記載')
    })

    it('OTHER以外の理由でもreasonOtherを設定できる（複数選択の場合）', () => {
      const survey: WithdrawalSurvey = {
        id: 'survey-111',
        userId: 'user-222',
        reason: WithdrawalReason.PRIVACY_CONCERNS,
        reasonOther: JSON.stringify({
          allReasons: ['privacy_concerns', 'too_many_emails', 'technical_issues'],
          otherText: '技術的な問題が多すぎる',
        }),
        createdAt: new Date(),
      }

      expect(survey.reason).toBe(WithdrawalReason.PRIVACY_CONCERNS)
      expect(survey.reasonOther).toBeTruthy()

      const parsedReasonOther = JSON.parse(survey.reasonOther!)
      expect(parsedReasonOther.allReasons).toContain('privacy_concerns')
      expect(parsedReasonOther.allReasons).toContain('too_many_emails')
      expect(parsedReasonOther.allReasons).toContain('technical_issues')
      expect(parsedReasonOther.otherText).toBe('技術的な問題が多すぎる')
    })

    it('feedbackフィールドは長いテキストを格納できる', () => {
      const longFeedback =
        'このサービスを利用してみて、'.repeat(50) + '改善の余地があると感じました。'

      const survey: WithdrawalSurvey = {
        id: 'survey-333',
        userId: 'user-444',
        reason: WithdrawalReason.NOT_USEFUL,
        feedback: longFeedback,
        createdAt: new Date(),
      }

      expect(survey.feedback).toBe(longFeedback)
      expect(survey.feedback?.length).toBeGreaterThan(500)
    })

    it('createdAtは過去の日付でも未来の日付でも設定できる', () => {
      const pastDate = new Date('2020-01-01')
      const futureDate = new Date('2030-12-31')

      const pastSurvey: WithdrawalSurvey = {
        id: 'survey-past',
        userId: 'user-past',
        reason: WithdrawalReason.FOUND_ALTERNATIVE,
        createdAt: pastDate,
      }

      const futureSurvey: WithdrawalSurvey = {
        id: 'survey-future',
        userId: 'user-future',
        reason: WithdrawalReason.TEMPORARY_BREAK,
        createdAt: futureDate,
      }

      expect(pastSurvey.createdAt).toEqual(pastDate)
      expect(futureSurvey.createdAt).toEqual(futureDate)
    })
  })

  describe('型の安全性テスト', () => {
    it('WithdrawalSurveyの型チェックが正しく機能する', () => {
      const validSurvey: WithdrawalSurvey = {
        id: 'survey-type-test',
        userId: 'user-type-test',
        reason: WithdrawalReason.TECHNICAL_ISSUES,
        createdAt: new Date(),
      }

      // TypeScriptの型チェックにより、以下のような不正な代入はコンパイルエラーになる
      // validSurvey.id = 123; // Error: Type 'number' is not assignable to type 'string'
      // validSurvey.reason = 'invalid_reason'; // Error: Type '"invalid_reason"' is not assignable to type 'WithdrawalReason'
      // validSurvey.wouldRecommend = 'yes'; // Error: Type 'string' is not assignable to type 'boolean | undefined'

      expect(validSurvey).toBeDefined()
    })

    it('オプショナルフィールドは省略可能', () => {
      const minimalSurvey: WithdrawalSurvey = {
        id: 'minimal-survey',
        userId: 'minimal-user',
        reason: WithdrawalReason.TOO_MANY_EMAILS,
        createdAt: new Date(),
      }

      // オプショナルフィールドは未定義
      expect(minimalSurvey.reasonOther).toBeUndefined()
      expect(minimalSurvey.feedback).toBeUndefined()
      expect(minimalSurvey.wouldRecommend).toBeUndefined()
    })
  })
})
