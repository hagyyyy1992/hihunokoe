import { RateLimitService } from '@api/domain/services/RateLimitService'

interface RateLimitRecord {
  count: number
  lastReset: number
}

export class RateLimitServiceImpl implements RateLimitService {
  private rateLimits = new Map<string, RateLimitRecord>()

  checkRateLimit(userId: string, action: string, windowMs: number, maxRequests: number): boolean {
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
