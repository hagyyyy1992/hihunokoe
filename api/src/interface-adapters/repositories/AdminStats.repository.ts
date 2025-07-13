import { prisma } from '@/lib/prisma'

export interface DailyGrowthData {
  date: string
  count: number
}

export class AdminStatsRepository {
  /**
   * 指定期間のユーザー登録数を日ごとに集計
   * 単一のクエリで全期間のデータを取得
   */
  async getUserGrowthByDate(startDate: Date, endDate: Date): Promise<DailyGrowthData[]> {
    if (!prisma) throw new Error('Database connection not available')

    // Prismaの生クエリを使用して効率的な集計を実行
    const result = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as count
      FROM users
      WHERE created_at >= ${startDate}
        AND created_at < ${endDate}
        AND deleted_at IS NULL
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date ASC
    `

    // 結果を整形して返す
    return result.map(row => ({
      date: row.date.toISOString().split('T')[0],
      count: Number(row.count),
    }))
  }

  /**
   * 指定期間の投稿数を日ごとに集計
   * 単一のクエリで全期間のデータを取得
   */
  async getPostGrowthByDate(startDate: Date, endDate: Date): Promise<DailyGrowthData[]> {
    if (!prisma) throw new Error('Database connection not available')

    const result = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as count
      FROM posts
      WHERE created_at >= ${startDate}
        AND created_at < ${endDate}
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date ASC
    `

    return result.map(row => ({
      date: row.date.toISOString().split('T')[0],
      count: Number(row.count),
    }))
  }

  /**
   * ダッシュボード用の統計情報を一括取得
   * 複数の集計を並列実行
   */
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
    if (!prisma) throw new Error('Database connection not available')

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // すべての集計クエリを並列実行
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalPosts,
      publishedPosts,
      todayRegistrations,
      todayPosts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          isActive: true,
          deletedAt: null,
        },
      }),
      prisma.user.count({
        where: {
          OR: [{ isActive: false }, { deletedAt: { not: null } }],
        },
      }),
      prisma.post.count(),
      prisma.post.count({
        where: { status: 'published' },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: today },
        },
      }),
      prisma.post.count({
        where: {
          createdAt: { gte: today },
        },
      }),
    ])

    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalPosts,
      publishedPosts,
      unpublishedPosts: totalPosts - publishedPosts,
      todayRegistrations,
      todayPosts,
    }
  }

  /**
   * 月ごとの統計データを取得（より大きな期間用）
   */
  async getMonthlyStats(months: number): Promise<{
    userGrowth: Array<{ month: string; count: number }>
    postGrowth: Array<{ month: string; count: number }>
  }> {
    if (!prisma) throw new Error('Database connection not available')

    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    const [userGrowth, postGrowth] = await Promise.all([
      prisma.$queryRaw<Array<{ month: Date; count: bigint }>>`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as count
        FROM users
        WHERE created_at >= ${startDate}
          AND created_at < ${endDate}
          AND deleted_at IS NULL
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month ASC
      `,
      prisma.$queryRaw<Array<{ month: Date; count: bigint }>>`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as count
        FROM posts
        WHERE created_at >= ${startDate}
          AND created_at < ${endDate}
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month ASC
      `,
    ])

    return {
      userGrowth: userGrowth.map(row => ({
        month: row.month.toISOString().substring(0, 7),
        count: Number(row.count),
      })),
      postGrowth: postGrowth.map(row => ({
        month: row.month.toISOString().substring(0, 7),
        count: Number(row.count),
      })),
    }
  }
}
