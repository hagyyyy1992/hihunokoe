import { ICacheService } from '@api/domain/services/CacheService'
import { memoryCache } from '@/lib/cache/memory-cache'

export class CacheServiceImpl implements ICacheService {
  get<T>(key: string): T | null {
    return memoryCache.get<T>(key)
  }

  set<T>(key: string, value: T, ttl?: number): void {
    memoryCache.set(key, value, ttl)
  }

  deletePattern(pattern: string): void {
    memoryCache.deletePattern(pattern)
  }
}
