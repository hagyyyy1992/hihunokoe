import { AdminStatsRepository, DailyGrowthData } from './AdminStats.repository'
import { memoryCache } from '@/lib/cache/memory-cache'

/**
 * 管理画面統計データのキャッシュラッパー
 * 頻繁にアクセスされる統計データをメモリキャッシュで高速化
 */
export class CachedAdminStatsRepository extends AdminStatsRepository {
  private static readonly CACHE_TTL = {
    DASHBOARD_STATS: 60000, // 1分
    DAILY_GROWTH: 300000, // 5分
    MONTHLY_STATS: 600000, // 10分
  }

  async getDashboardStats(): Promise<{
    totalUsers: number
    activeUsers: number
    suspendedUsers: number
    totalPosts: number
    publishedPosts: number
    unpublishedPosts: number
    todayRegistrations: number
    todayPosts: number
  }> {
    const cacheKey = 'admin:dashboard:stats'

    // キャッシュから取得を試行
    const cached = memoryCache.get(cacheKey)
    if (cached) {
      return cached as any
    }

    // キャッシュにない場合は親クラスのメソッドを呼び出し
    const stats = await super.getDashboardStats()

    // 結果をキャッシュに保存
    memoryCache.set(cacheKey, stats, CachedAdminStatsRepository.CACHE_TTL.DASHBOARD_STATS)

    return stats
  }

  async getUserGrowthByDate(startDate: Date, endDate: Date): Promise<DailyGrowthData[]> {
    const cacheKey = `admin:user-growth:${startDate.toISOString()}:${endDate.toISOString()}`

    const cached = memoryCache.get(cacheKey)
    if (cached) {
      return cached as DailyGrowthData[]
    }

    const data = await super.getUserGrowthByDate(startDate, endDate)
    memoryCache.set(cacheKey, data, CachedAdminStatsRepository.CACHE_TTL.DAILY_GROWTH)

    return data
  }

  async getPostGrowthByDate(startDate: Date, endDate: Date): Promise<DailyGrowthData[]> {
    const cacheKey = `admin:post-growth:${startDate.toISOString()}:${endDate.toISOString()}`

    const cached = memoryCache.get(cacheKey)
    if (cached) {
      return cached as DailyGrowthData[]
    }

    const data = await super.getPostGrowthByDate(startDate, endDate)
    memoryCache.set(cacheKey, data, CachedAdminStatsRepository.CACHE_TTL.DAILY_GROWTH)

    return data
  }

  /**
   * 統計データのキャッシュを無効化
   * データ更新時に呼び出す
   */
  static invalidateCache(): void {
    memoryCache.deletePattern('^admin:')
  }

  /**
   * ダッシュボード統計のみキャッシュを無効化
   */
  static invalidateDashboardStats(): void {
    memoryCache.delete('admin:dashboard:stats')
  }
}
