/**
 * パフォーマンス計測用のロガー
 * 各処理の実行時間を計測し、ボトルネックを特定するために使用
 */

type TimingEntry = {
  label: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, any>
}

export class PerformanceLogger {
  private timings: Map<string, TimingEntry> = new Map()
  private operationId: string
  private startTime: number

  constructor(operationName: string, metadata?: Record<string, any>) {
    this.operationId = `${operationName}-${Date.now()}-${Math.random().toString(36).substring(7)}`
    this.startTime = Date.now()

    console.log(`[PERF] 🚀 Started: ${operationName}`, {
      operationId: this.operationId,
      timestamp: new Date().toISOString(),
      ...metadata,
    })
  }

  /**
   * 計測開始
   */
  start(label: string, metadata?: Record<string, any>): void {
    const startTime = Date.now()
    this.timings.set(label, {
      label,
      startTime,
      metadata,
    })

    console.log(`[PERF] ⏱️  Start: ${label}`, {
      operationId: this.operationId,
      label,
      timestamp: new Date().toISOString(),
      ...metadata,
    })
  }

  /**
   * 計測終了
   */
  end(label: string, metadata?: Record<string, any>): void {
    const timing = this.timings.get(label)
    if (!timing) {
      console.warn(`[PERF] ⚠️  Warning: No start timing found for label: ${label}`)
      return
    }

    const endTime = Date.now()
    const duration = endTime - timing.startTime

    timing.endTime = endTime
    timing.duration = duration

    console.log(`[PERF] ✅ End: ${label}`, {
      operationId: this.operationId,
      label,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      ...metadata,
    })
  }

  /**
   * 全体のサマリーを出力
   */
  finish(metadata?: Record<string, any>): void {
    const totalDuration = Date.now() - this.startTime
    const timingDetails: Record<string, any> = {}

    // 各タイミングの詳細を整理
    this.timings.forEach((timing, label) => {
      timingDetails[label] = {
        duration: timing.duration ? `${timing.duration}ms` : 'Not completed',
        percentage: timing.duration
          ? `${Math.round((timing.duration / totalDuration) * 100)}%`
          : 'N/A',
        metadata: timing.metadata,
      }
    })

    console.log(`[PERF] 🏁 Finished: Operation Summary`, {
      operationId: this.operationId,
      totalDuration: `${totalDuration}ms`,
      timestamp: new Date().toISOString(),
      timings: timingDetails,
      ...metadata,
    })

    // パフォーマンス警告
    if (totalDuration > 3000) {
      console.warn(`[PERF] ⚠️  SLOW OPERATION: ${totalDuration}ms (>3s)`, {
        operationId: this.operationId,
      })
    }
  }

  /**
   * 非同期処理のラッパー
   */
  async measure<T>(
    label: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.start(label, metadata)
    try {
      const result = await fn()
      this.end(label, { success: true })
      return result
    } catch (error) {
      this.end(label, { success: false, error: (error as Error).message })
      throw error
    }
  }
}

/**
 * GraphQLリクエスト用のパフォーマンスロガーを作成
 */
export function createGraphQLPerfLogger(operationName: string, variables?: any): PerformanceLogger {
  return new PerformanceLogger(`GraphQL:${operationName}`, { variables })
}

/**
 * データベースクエリ用のパフォーマンスロガーを作成
 */
export function createDBPerfLogger(queryType: string, tableName: string): PerformanceLogger {
  return new PerformanceLogger(`DB:${queryType}:${tableName}`)
}
