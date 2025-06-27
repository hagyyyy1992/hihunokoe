interface RateLimitEntry {
  count: number
  resetTime: number
}

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
    // メモリ使用量を制御するため、定期的に古いエントリを削除
    setInterval(() => this.cleanup(), this.config.windowMs)
  }

  checkLimit(key: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now()
    const entry = this.store.get(key)

    // エントリが存在しないか、ウィンドウが過ぎている場合は新しいエントリを作成
    if (!entry || now >= entry.resetTime) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + this.config.windowMs,
      }
      this.store.set(key, newEntry)
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: newEntry.resetTime,
      }
    }

    // 制限に達している場合
    if (entry.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      }
    }

    // カウントを増加
    entry.count++
    this.store.set(key, entry)

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    }
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetTime) {
        this.store.delete(key)
      }
    }
  }

  // テスト用：ストアをクリア
  clear(): void {
    this.store.clear()
  }

  // テスト用：現在のエントリ数を取得
  size(): number {
    return this.store.size
  }
}

// パスワードリセット用のレート制限設定
// 15分間に最大3回までのリクエストを許可
export const passwordResetLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15分
  maxRequests: 3,
})

// パスワードリセット実行用のレート制限設定
// 5分間に最大5回までのリクエストを許可
export const passwordResetExecutionLimiter = new RateLimiter({
  windowMs: 5 * 60 * 1000, // 5分
  maxRequests: 5,
})

// IPアドレスを取得するヘルパー関数
export function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  if (realIP) {
    return realIP
  }
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  // フォールバック（開発環境等）
  return 'unknown'
}

// レート制限エラーレスポンスを生成するヘルパー関数
export function createRateLimitErrorResponse(resetTime: number) {
  const resetTimeInSeconds = Math.ceil((resetTime - Date.now()) / 1000)

  return {
    error: 'リクエストが多すぎます。しばらく時間をおいてから再試行してください。',
    retryAfter: resetTimeInSeconds,
    message: `${Math.ceil(resetTimeInSeconds / 60)}分後に再試行してください。`,
  }
}

// テスト用：全てのレート制限をリセット
export function resetAllRateLimiters(): void {
  if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
    passwordResetLimiter.clear()
    passwordResetExecutionLimiter.clear()
  }
}
