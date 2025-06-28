import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin-middleware'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { MOCK_USERS, MOCK_POSTS } from '@/lib/mock-data'

const handler = async (req: NextRequest) => {
  try {
    if (!isDatabaseAvailable()) {
      // モックデータを使用した統計
      const mockStats = {
        totalUsers: MOCK_USERS.length,
        totalPosts: MOCK_POSTS.length,
        totalViews: MOCK_POSTS.reduce((sum, post) => sum + (post.viewCount || 0), 0),
        totalEmpathies: MOCK_POSTS.reduce((sum, post) => sum + (post.empathyCount || 0), 0),
        recentUsers: MOCK_USERS.slice(0, 5).map(user => ({
          id: user.id,
          userName: user.userName,
          email: user.email,
          createdAt: user.createdAt || new Date().toISOString(),
        })),
        recentPosts: MOCK_POSTS.slice(0, 5).map(post => ({
          id: post.id,
          title: post.title,
          userName: MOCK_USERS.find(u => u.id === post.userId)?.userName || 'Unknown',
          createdAt: post.createdAt || new Date().toISOString(),
          empathyCount: post.empathyCount || 0,
        })),
      }

      return NextResponse.json(mockStats)
    }

    // データベースから統計データを取得
    const [totalUsers, totalPosts, totalViews, totalEmpathies, recentUsers, recentPosts] =
      await Promise.all([
        prisma!.user.count({ where: { isActive: true } }),
        prisma!.post.count(),
        prisma!.post.aggregate({ _sum: { viewCount: true } }),
        prisma!.empathy.count(),
        prisma!.user.findMany({
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            userName: true,
            email: true,
            createdAt: true,
          },
        }),
        prisma!.post.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            title: true,
            createdAt: true,
            empathyCount: true,
            user: {
              select: {
                userName: true,
              },
            },
          },
        }),
      ])

    const stats = {
      totalUsers,
      totalPosts,
      totalViews: totalViews._sum.viewCount || 0,
      totalEmpathies,
      recentUsers: recentUsers.map(user => ({
        id: user.id,
        userName: user.userName,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      })),
      recentPosts: recentPosts.map(post => ({
        id: post.id,
        title: post.title,
        userName: post.user.userName,
        createdAt: post.createdAt.toISOString(),
        empathyCount: post.empathyCount,
      })),
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}

export const GET = withAdminAuth(handler)
