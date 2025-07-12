interface CacheItem<T> {
  data: T
  expiry: number
}

class MemoryCache {
  private cache: Map<string, CacheItem<unknown>> = new Map()
  private maxSize: number = 1000 // 最大エントリー数
  private defaultTtl: number = 30 * 1000 // デフォルト30秒

  /**
   * キャッシュから値を取得
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) {
      return null
    }

    // 有効期限チェック
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  /**
   * キャッシュに値を設定
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    // キャッシュサイズ制限チェック
    if (this.cache.size >= this.maxSize) {
      // 最も古いエントリーを削除（簡易的なLRU）
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    const ttl = ttlMs || this.defaultTtl
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
    })
  }

  /**
   * キャッシュから値を削除
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * パターンに一致するキーを削除
   */
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 全てのキャッシュをクリア
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * 期限切れのエントリーを削除
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key)
      }
    }
  }
}

// シングルトンインスタンス
export const memoryCache = new MemoryCache()

// 定期的なクリーンアップ（5分ごと）
if (typeof window === 'undefined') {
  setInterval(
    () => {
      memoryCache.cleanup()
    },
    5 * 60 * 1000
  )
}
