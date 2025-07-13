import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken } from '@/lib/auth/admin-middleware'
import { CachedAdminStatsRepository } from '@api/interface-adapters/repositories/CachedAdminStats.repository'

// Force dynamic rendering to avoid caching issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// シングルトンインスタンスでリポジトリを管理
let statsRepository: CachedAdminStatsRepository | null = null

function getStatsRepository() {
  if (!statsRepository && prisma) {
    statsRepository = new CachedAdminStatsRepository()
  }
  return statsRepository
}

export async function GET(request: NextRequest) {
  try {
    // 管理者認証チェック
    const authResult = await verifyAdminToken(request)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 401 })
    }

    const repository = getStatsRepository()
    if (!repository) {
      return NextResponse.json(
        { error: 'データベース接続エラーが発生しました。管理者にお問い合わせください。' },
        { status: 500 }
      )
    }

    // 日付範囲の計算（30日間）
    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Prismaの利用可能性チェック
    if (!prisma) {
      return NextResponse.json(
        { error: 'データベース接続エラーが発生しました。管理者にお問い合わせください。' },
        { status: 500 }
      )
    }

    // 並列ですべてのデータを取得
    const [stats, userGrowth, postGrowth, recentUsers, recentPosts] = await Promise.all([
      repository.getDashboardStats(),
      repository.getUserGrowthByDate(thirtyDaysAgo, now),
      repository.getPostGrowthByDate(thirtyDaysAgo, now),
      // 最近のユーザー（5件）
      prisma.user.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          userName: true,
          email: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // 最近の投稿（5件）
      prisma.post.findMany({
        include: {
          user: {
            select: {
              id: true,
              userName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ])

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: stats.totalUsers,
        activeUsers: stats.activeUsers,
        suspendedUsers: stats.suspendedUsers,
        totalPosts: stats.totalPosts,
        publishedPosts: stats.publishedPosts,
        unpublishedPosts: stats.totalPosts - stats.publishedPosts,
        todayRegistrations: stats.todayRegistrations,
        todayPosts: stats.todayPosts,
      },
      userGrowth,
      postGrowth,
      recentUsers: recentUsers.map(user => ({
        id: user.id,
        userName: user.userName,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      })),
      recentPosts: recentPosts.map(post => ({
        id: post.id,
        title: post.title,
        status: post.status,
        viewCount: post.viewCount,
        createdAt: post.createdAt.toISOString(),
        user: {
          id: post.user.id,
          userName: post.user.userName,
        },
      })),
    })
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    return NextResponse.json({ error: '統計データの取得に失敗しました' }, { status: 500 })
  }
}
