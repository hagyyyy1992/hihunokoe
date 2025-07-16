import { IRateLimitService } from '@api/domain/services/RateLimitService'

interface RateLimitRecord {
  count: number
  lastReset: number
}

export class RateLimitService implements IRateLimitService {
  private rateLimits = new Map<string, RateLimitRecord>()

  checkRateLimit(userId: string, action: string, windowMs: number, maxRequests: number): boolean {
    // maxRequestsが0の場合は常に拒否
    if (maxRequests === 0) {
      return false
    }

    const now = Date.now()
    const key = `${userId}:${action}`
    const userLimit = this.rateLimits.get(key)

    if (!userLimit || now - userLimit.lastReset > windowMs) {
      this.rateLimits.set(key, { count: 1, lastReset: now })
      return true
    }

    if (userLimit.count >= maxRequests) {
      return false
    }

    userLimit.count++
    return true
  }

  clearRateLimits(): void {
    this.rateLimits.clear()
  }
}
