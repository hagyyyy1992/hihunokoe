'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, Eye, Heart } from 'lucide-react'

// 管理画面は動的レンダリングが必要
export const dynamic = 'force-dynamic'

interface DashboardStats {
  stats: {
    totalUsers: number
    activeUsers: number
    suspendedUsers: number
    totalPosts: number
    publishedPosts: number
    unpublishedPosts: number
    totalComments: number
    todayRegistrations: number
    todayPosts: number
    todayComments: number
  }
  userGrowth: Array<{ date: string; count: number }>
  postGrowth: Array<{ date: string; count: number }>
  recentUsers?: Array<{
    id: string
    userName: string
    email: string
    createdAt: string
  }>
  recentPosts?: Array<{
    id: string
    title: string
    userName: string
    empathyCount: number
    createdAt: string
  }>
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/stats', {
        credentials: 'include', // HTTPOnlyクッキーを送信
      })

      if (!response.ok) {
        throw new Error('統計データの取得に失敗しました')
      }

      const data = await response.json()
      // APIレスポンスの構造を正しく扱う
      setStats({
        stats: data.stats,
        userGrowth: data.userGrowth || [],
        postGrowth: data.postGrowth || [],
        recentUsers: data.recentUsers || [],
        recentPosts: data.recentPosts || [],
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : '不明なエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const statCards = [
    {
      title: '総ユーザー数',
      value: stats?.stats?.totalUsers?.toLocaleString() || '0',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: '総投稿数',
      value: stats?.stats?.totalPosts?.toLocaleString() || '0',
      icon: FileText,
      color: 'text-green-600',
    },
    {
      title: '総ビュー数',
      value: '0', // TODO: Implement view counting
      icon: Eye,
      color: 'text-purple-600',
    },
    {
      title: '総共感数',
      value: '0', // TODO: Implement empathy counting
      icon: Heart,
      color: 'text-apple-600',
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 統計カード */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <stat.icon className={`h-6 w-6 sm:h-8 sm:w-8 ${stat.color} hidden sm:block`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 最近のユーザー */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">最近登録されたユーザー</CardTitle>
            <CardDescription className="text-xs sm:text-sm">直近5名のユーザー</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="space-y-3">
              {stats?.recentUsers?.length ? (
                stats.recentUsers.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base text-gray-900 truncate">
                        {user.userName}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{user.email}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-xs text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">データがありません</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 最近の投稿 */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">最近の投稿</CardTitle>
            <CardDescription className="text-xs sm:text-sm">直近5件の投稿</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="space-y-3">
              {stats?.recentPosts?.length ? (
                stats.recentPosts.map(post => (
                  <div key={post.id} className="p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-1 sm:mb-2">
                      <h4 className="font-medium text-sm sm:text-base text-gray-900 line-clamp-2 flex-1 mr-2">
                        {post.title}
                      </h4>
                      <span className="flex items-center text-xs sm:text-sm text-gray-500 flex-shrink-0">
                        <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        {post.empathyCount}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm text-gray-600">
                      <span className="truncate">by {post.userName}</span>
                      <span className="text-xs">
                        {new Date(post.createdAt).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">データがありません</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
