import { RateLimitServiceImpl } from '@api/interface-adapters/services/RateLimitServiceImpl'

describe('RateLimitServiceImpl', () => {
  let rateLimitService: RateLimitServiceImpl

  beforeEach(() => {
    rateLimitService = new RateLimitServiceImpl()
    jest.clearAllMocks()
  })

  describe('checkRateLimit', () => {
    it('初回リクエストは許可される', () => {
      const userId = 'user-123'
      const action = 'login'
      const windowMs = 60000 // 1分
      const maxRequests = 5

      const result = rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)

      expect(result).toBe(true)
    })

    it('制限内のリクエストは許可される', () => {
      const userId = 'user-123'
      const action = 'login'
      const windowMs = 60000
      const maxRequests = 3

      // 3回まで許可される
      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(true)
      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(true)
      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(true)
    })

    it('制限を超えたリクエストは拒否される', () => {
      const userId = 'user-123'
      const action = 'password_reset'
      const windowMs = 60000
      const maxRequests = 2

      // 2回まで許可
      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(true)
      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(true)

      // 3回目は拒否
      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(false)
      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(false)
    })

    it('異なるユーザーのレート制限は独立している', () => {
      const user1 = 'user-1'
      const user2 = 'user-2'
      const action = 'api_call'
      const windowMs = 60000
      const maxRequests = 2

      // user1が制限に達する
      expect(rateLimitService.checkRateLimit(user1, action, windowMs, maxRequests)).toBe(true)
      expect(rateLimitService.checkRateLimit(user1, action, windowMs, maxRequests)).toBe(true)
      expect(rateLimitService.checkRateLimit(user1, action, windowMs, maxRequests)).toBe(false)

      // user2は影響を受けない
      expect(rateLimitService.checkRateLimit(user2, action, windowMs, maxRequests)).toBe(true)
      expect(rateLimitService.checkRateLimit(user2, action, windowMs, maxRequests)).toBe(true)
    })

    it('異なるアクションのレート制限は独立している', () => {
      const userId = 'user-123'
      const action1 = 'login'
      const action2 = 'register'
      const windowMs = 60000
      const maxRequests = 2

      // action1が制限に達する
      expect(rateLimitService.checkRateLimit(userId, action1, windowMs, maxRequests)).toBe(true)
      expect(rateLimitService.checkRateLimit(userId, action1, windowMs, maxRequests)).toBe(true)
      expect(rateLimitService.checkRateLimit(userId, action1, windowMs, maxRequests)).toBe(false)

      // action2は影響を受けない
      expect(rateLimitService.checkRateLimit(userId, action2, windowMs, maxRequests)).toBe(true)
      expect(rateLimitService.checkRateLimit(userId, action2, windowMs, maxRequests)).toBe(true)
    })

    it('時間ウィンドウが経過するとリセットされる', () => {
      const userId = 'user-123'
      const action = 'api_call'
      const windowMs = 1000 // 1秒
      const maxRequests = 2

      const originalDateNow = Date.now
      let mockTime = 1000000

      Date.now = jest.fn(() => mockTime)

      // 制限まで使用
      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(true)
      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(true)
      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(false)

      // 時間を進める（ウィンドウを超える）
      mockTime += windowMs + 1

      // リセットされて再び使用可能
      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(true)
      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(true)

      Date.now = originalDateNow
    })

    it('ウィンドウ内でのリセットは発生しない', () => {
      const userId = 'user-123'
      const action = 'api_call'
      const windowMs = 10000 // 10秒
      const maxRequests = 1

      const originalDateNow = Date.now
      let mockTime = 1000000

      Date.now = jest.fn(() => mockTime)

      // 1回目
      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(true)

      // 時間を少し進める（ウィンドウ内）
      mockTime += windowMs / 2

      // まだ制限中
      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(false)

      Date.now = originalDateNow
    })

    it('maxRequestsが0の場合は常に拒否される', () => {
      const userId = 'user-123'
      const action = 'blocked_action'
      const windowMs = 60000
      const maxRequests = 0

      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(false)
      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(false)
    })

    it('maxRequestsが1の場合は1回のみ許可される', () => {
      const userId = 'user-123'
      const action = 'one_time_action'
      const windowMs = 60000
      const maxRequests = 1

      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(true)
      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(false)
    })
  })

  describe('clearRateLimits', () => {
    it('全てのレート制限をクリアできる', () => {
      const userId = 'user-123'
      const action = 'api_call'
      const windowMs = 60000
      const maxRequests = 1

      // 制限に達する
      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(true)
      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(false)

      // クリア実行
      rateLimitService.clearRateLimits()

      // 再び使用可能
      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(true)
    })

    it('複数のユーザーとアクションをまとめてクリアできる', () => {
      const windowMs = 60000
      const maxRequests = 1

      // 複数のユーザー・アクションで制限に達する
      rateLimitService.checkRateLimit('user1', 'action1', windowMs, maxRequests)
      rateLimitService.checkRateLimit('user1', 'action2', windowMs, maxRequests)
      rateLimitService.checkRateLimit('user2', 'action1', windowMs, maxRequests)

      // 全て制限状態
      expect(rateLimitService.checkRateLimit('user1', 'action1', windowMs, maxRequests)).toBe(false)
      expect(rateLimitService.checkRateLimit('user1', 'action2', windowMs, maxRequests)).toBe(false)
      expect(rateLimitService.checkRateLimit('user2', 'action1', windowMs, maxRequests)).toBe(false)

      // クリア
      rateLimitService.clearRateLimits()

      // 全て使用可能
      expect(rateLimitService.checkRateLimit('user1', 'action1', windowMs, maxRequests)).toBe(true)
      expect(rateLimitService.checkRateLimit('user1', 'action2', windowMs, maxRequests)).toBe(true)
      expect(rateLimitService.checkRateLimit('user2', 'action1', windowMs, maxRequests)).toBe(true)
    })

    it('クリア後は新しいリクエストから制限が開始される', () => {
      const userId = 'user-123'
      const action = 'api_call'
      const windowMs = 60000
      const maxRequests = 3

      // 2回使用
      rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)
      rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)

      // クリア
      rateLimitService.clearRateLimits()

      // 再び3回まで使用可能
      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(true)
      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(true)
      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(true)
      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(false)
    })
  })

  describe('同時実行', () => {
    it('同じユーザーの並行リクエストを正しく処理する', () => {
      const userId = 'user-123'
      const action = 'concurrent_action'
      const windowMs = 60000
      const maxRequests = 5

      // 並行でリクエストを実行
      const results = Array.from({ length: 10 }, () =>
        rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)
      )

      // 最初の5つがtrue、残りがfalse
      const trueCount = results.filter(Boolean).length
      const falseCount = results.filter(r => !r).length

      expect(trueCount).toBe(5)
      expect(falseCount).toBe(5)
    })
  })

  describe('エッジケース', () => {
    it('空文字列のユーザーIDでも動作する', () => {
      const userId = ''
      const action = 'action'
      const windowMs = 60000
      const maxRequests = 1

      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(true)
      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(false)
    })

    it('空文字列のアクションでも動作する', () => {
      const userId = 'user-123'
      const action = ''
      const windowMs = 60000
      const maxRequests = 1

      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(true)
      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(false)
    })

    it('特殊文字を含むユーザーIDとアクションで動作する', () => {
      const userId = 'user@example.com'
      const action = 'api:v1:call'
      const windowMs = 60000
      const maxRequests = 2

      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(true)
      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(true)
      expect(rateLimitService.checkRateLimit(userId, action, windowMs, maxRequests)).toBe(false)
    })
  })
})
