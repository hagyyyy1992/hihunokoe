import { LRUCache } from 'lru-cache'

interface TokenCacheEntry {
  userId: string
  expiresAt: number
}

// トークン検証結果のキャッシュ（メモリ内）
// 最大1000エントリ、TTL 5分
const tokenCache = new LRUCache<string, TokenCacheEntry>({
  max: 1000,
  ttl: 5 * 60 * 1000, // 5分
})

export const tokenCacheService = {
  get(token: string): string | null {
    const entry = tokenCache.get(token)
    if (!entry) return null

    // 有効期限チェック
    if (Date.now() > entry.expiresAt) {
      tokenCache.delete(token)
      return null
    }

    return entry.userId
  },

  set(token: string, userId: string, expiresAt: number): void {
    tokenCache.set(token, { userId, expiresAt })
  },

  delete(token: string): void {
    tokenCache.delete(token)
  },

  clear(): void {
    tokenCache.clear()
  },
}
