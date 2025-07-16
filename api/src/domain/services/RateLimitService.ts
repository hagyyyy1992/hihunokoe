export interface IRateLimitService {
  checkRateLimit(userId: string, action: string, windowMs: number, maxRequests: number): boolean
  clearRateLimits(): void
}
