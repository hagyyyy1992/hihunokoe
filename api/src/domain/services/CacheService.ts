export interface ICacheService {
  get<T>(key: string): T | null
  set<T>(key: string, value: T, ttl?: number): void
  deletePattern(pattern: string): void
}
