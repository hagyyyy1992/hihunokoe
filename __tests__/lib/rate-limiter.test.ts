import {
  RateLimiter,
  passwordResetLimiter,
  passwordResetExecutionLimiter,
  getClientIP,
  createRateLimitErrorResponse,
  resetAllRateLimiters,
} from '../../src/lib/rate-limiter'

describe('Rate Limiter', () => {
  beforeEach(() => {
    // テスト前にレート制限をクリア
    passwordResetLimiter.clear()
    passwordResetExecutionLimiter.clear()
  })

  describe('passwordResetLimiter', () => {
    it('制限内のリクエストは許可される', () => {
      const result1 = passwordResetLimiter.checkLimit('127.0.0.1')
      expect(result1.allowed).toBe(true)
      expect(result1.remaining).toBe(2)

      const result2 = passwordResetLimiter.checkLimit('127.0.0.1')
      expect(result2.allowed).toBe(true)
      expect(result2.remaining).toBe(1)

      const result3 = passwordResetLimiter.checkLimit('127.0.0.1')
      expect(result3.allowed).toBe(true)
      expect(result3.remaining).toBe(0)
    })

    it('制限を超えたリクエストは拒否される', () => {
      // 3回まで許可
      passwordResetLimiter.checkLimit('127.0.0.1')
      passwordResetLimiter.checkLimit('127.0.0.1')
      passwordResetLimiter.checkLimit('127.0.0.1')

      // 4回目は拒否
      const result = passwordResetLimiter.checkLimit('127.0.0.1')
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('異なるIPアドレスは独立してカウントされる', () => {
      // IP1で3回リクエスト
      passwordResetLimiter.checkLimit('127.0.0.1')
      passwordResetLimiter.checkLimit('127.0.0.1')
      passwordResetLimiter.checkLimit('127.0.0.1')

      // IP1の4回目は拒否
      const result1 = passwordResetLimiter.checkLimit('127.0.0.1')
      expect(result1.allowed).toBe(false)

      // 異なるIPでは許可される
      const result2 = passwordResetLimiter.checkLimit('192.168.1.1')
      expect(result2.allowed).toBe(true)
      expect(result2.remaining).toBe(2)
    })

    it('ウィンドウ時間が過ぎると制限がリセットされる', () => {
      // 現在時刻をモック
      const originalNow = Date.now
      let mockTime = 1000000

      Date.now = jest.fn(() => mockTime)

      // 3回リクエストして制限に達する
      passwordResetLimiter.checkLimit('127.0.0.1')
      passwordResetLimiter.checkLimit('127.0.0.1')
      passwordResetLimiter.checkLimit('127.0.0.1')

      // 4回目は拒否
      const result1 = passwordResetLimiter.checkLimit('127.0.0.1')
      expect(result1.allowed).toBe(false)

      // 15分と1秒後
      mockTime += 15 * 60 * 1000 + 1000

      // リセットされて再び許可される
      const result2 = passwordResetLimiter.checkLimit('127.0.0.1')
      expect(result2.allowed).toBe(true)
      expect(result2.remaining).toBe(2)

      // 元に戻す
      Date.now = originalNow
    })
  })

  describe('passwordResetExecutionLimiter', () => {
    it('5回まで許可される', () => {
      for (let i = 0; i < 5; i++) {
        const result = passwordResetExecutionLimiter.checkLimit('127.0.0.1')
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBe(4 - i)
      }
    })

    it('6回目は拒否される', () => {
      // 5回リクエスト
      for (let i = 0; i < 5; i++) {
        passwordResetExecutionLimiter.checkLimit('127.0.0.1')
      }

      // 6回目は拒否
      const result = passwordResetExecutionLimiter.checkLimit('127.0.0.1')
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })
  })

  describe('getClientIP', () => {
    it('x-forwarded-for ヘッダーからIPを取得する', () => {
      const mockRequest = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1'
            return null
          }),
        },
      } as any

      const ip = getClientIP(mockRequest)
      expect(ip).toBe('192.168.1.1')
    })

    it('x-real-ip ヘッダーからIPを取得する', () => {
      const mockRequest = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'x-real-ip') return '192.168.1.2'
            return null
          }),
        },
      } as any

      const ip = getClientIP(mockRequest)
      expect(ip).toBe('192.168.1.2')
    })

    it('cf-connecting-ip ヘッダーからIPを取得する', () => {
      const mockRequest = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'cf-connecting-ip') return '192.168.1.3'
            return null
          }),
        },
      } as any

      const ip = getClientIP(mockRequest)
      expect(ip).toBe('192.168.1.3')
    })

    it('IPが取得できない場合は "unknown" を返す', () => {
      const mockRequest = {
        headers: {
          get: jest.fn(() => null),
        },
      } as any

      const ip = getClientIP(mockRequest)
      expect(ip).toBe('unknown')
    })

    it('x-forwarded-for が優先される', () => {
      const mockRequest = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'x-forwarded-for') return '192.168.1.1'
            if (header === 'x-real-ip') return '192.168.1.2'
            if (header === 'cf-connecting-ip') return '192.168.1.3'
            return null
          }),
        },
      } as any

      const ip = getClientIP(mockRequest)
      expect(ip).toBe('192.168.1.1')
    })
  })

  describe('createRateLimitErrorResponse', () => {
    it('適切なエラーレスポンスを生成する', () => {
      const resetTime = Date.now() + 5 * 60 * 1000 // 5分後
      const response = createRateLimitErrorResponse(resetTime)

      expect(response.error).toBe(
        'リクエストが多すぎます。しばらく時間をおいてから再試行してください。'
      )
      expect(response.retryAfter).toBeGreaterThan(290) // 約5分
      expect(response.retryAfter).toBeLessThanOrEqual(300) // 5分以下
      expect(response.message).toBe('5分後に再試行してください。')
    })

    it('1分未満の場合は1分後と表示される', () => {
      const resetTime = Date.now() + 30 * 1000 // 30秒後
      const response = createRateLimitErrorResponse(resetTime)

      expect(response.retryAfter).toBe(30)
      expect(response.message).toBe('1分後に再試行してください。')
    })
  })

  describe('RateLimiter cleanup機能', () => {
    it('期限切れエントリの動作確認', () => {
      const originalNow = Date.now
      let mockTime = 1000000
      Date.now = jest.fn(() => mockTime)

      // エントリを作成
      passwordResetLimiter.checkLimit('127.0.0.1')
      expect(passwordResetLimiter.size()).toBe(1)

      // 時間を進めて期限切れにする
      mockTime += 16 * 60 * 1000 // 16分後

      // 期限切れエントリで再リクエスト（新しいエントリが作成される）
      const result = passwordResetLimiter.checkLimit('127.0.0.1')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(2) // 新しいエントリなので最大値-1

      Date.now = originalNow
    })

    it('setIntervalによるcleanup()で期限切れエントリが削除される', () => {
      const originalNow = Date.now
      const originalSetInterval = global.setInterval
      const originalClearInterval = global.clearInterval

      let mockTime = 1000000
      let cleanupCallback: (() => void) | undefined

      Date.now = jest.fn(() => mockTime)
      global.setInterval = jest.fn((callback: any) => {
        cleanupCallback = callback
        return 123 as any
      }) as any
      global.clearInterval = jest.fn()

      // 新しいレート制限インスタンスを作成（cleanup setIntervalが設定される）
      const testLimiter = new RateLimiter({
        maxRequests: 3,
        windowMs: 15 * 60 * 1000,
      })

      // 複数のエントリを作成
      testLimiter.checkLimit('127.0.0.1')
      testLimiter.checkLimit('192.168.1.1')
      testLimiter.checkLimit('10.0.0.1')
      expect(testLimiter.size()).toBe(3)

      // 時間を進めて期限切れにする
      mockTime += 16 * 60 * 1000 // 16分後

      // cleanup()を手動実行
      cleanupCallback?.()

      // 期限切れエントリがすべて削除される
      expect(testLimiter.size()).toBe(0)

      Date.now = originalNow
      global.setInterval = originalSetInterval
      global.clearInterval = originalClearInterval
    })

    it('size()メソッドで現在のエントリ数を取得できる', () => {
      expect(passwordResetLimiter.size()).toBe(0)

      passwordResetLimiter.checkLimit('127.0.0.1')
      expect(passwordResetLimiter.size()).toBe(1)

      passwordResetLimiter.checkLimit('192.168.1.1')
      expect(passwordResetLimiter.size()).toBe(2)
    })
  })

  describe('resetAllRateLimiters', () => {
    it('test環境で全てのレート制限をリセットする', () => {
      const originalNodeEnv = process.env.NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'test',
        configurable: true,
      })

      // レート制限を作成
      passwordResetLimiter.checkLimit('127.0.0.1')
      passwordResetExecutionLimiter.checkLimit('127.0.0.1')

      expect(passwordResetLimiter.size()).toBe(1)
      expect(passwordResetExecutionLimiter.size()).toBe(1)

      // リセット実行
      resetAllRateLimiters()

      expect(passwordResetLimiter.size()).toBe(0)
      expect(passwordResetExecutionLimiter.size()).toBe(0)

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalNodeEnv,
        configurable: true,
      })
    })

    it('development環境で全てのレート制限をリセットする', () => {
      const originalNodeEnv = process.env.NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        configurable: true,
      })

      // レート制限を作成
      passwordResetLimiter.checkLimit('127.0.0.1')
      passwordResetExecutionLimiter.checkLimit('127.0.0.1')

      expect(passwordResetLimiter.size()).toBe(1)
      expect(passwordResetExecutionLimiter.size()).toBe(1)

      // リセット実行
      resetAllRateLimiters()

      expect(passwordResetLimiter.size()).toBe(0)
      expect(passwordResetExecutionLimiter.size()).toBe(0)

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalNodeEnv,
        configurable: true,
      })
    })

    it('production環境では何もしない', () => {
      const originalNodeEnv = process.env.NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        configurable: true,
      })

      // レート制限を作成
      passwordResetLimiter.checkLimit('127.0.0.1')
      passwordResetExecutionLimiter.checkLimit('127.0.0.1')

      expect(passwordResetLimiter.size()).toBe(1)
      expect(passwordResetExecutionLimiter.size()).toBe(1)

      // リセット実行（何もしない）
      resetAllRateLimiters()

      // エントリは残っている
      expect(passwordResetLimiter.size()).toBe(1)
      expect(passwordResetExecutionLimiter.size()).toBe(1)

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalNodeEnv,
        configurable: true,
      })
    })
  })
})
