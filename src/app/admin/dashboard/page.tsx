'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, Eye, Heart } from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  totalPosts: number
  totalViews: number
  totalEmpathies: number
  recentUsers: Array<{
    id: string
    userName: string
    email: string
    createdAt: string
  }>
  recentPosts: Array<{
    id: string
    title: string
    userName: string
    createdAt: string
    empathyCount: number
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
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1]

      const response = await fetch('/api/admin/dashboard/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('統計データの取得に失敗しました')
      }

      const data = await response.json()
      setStats(data)
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
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: '総投稿数',
      value: stats.totalPosts.toLocaleString(),
      icon: FileText,
      color: 'text-green-600',
    },
    {
      title: '総ビュー数',
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      color: 'text-purple-600',
    },
    {
      title: '総共感数',
      value: stats.totalEmpathies.toLocaleString(),
      icon: Heart,
      color: 'text-pink-600',
    },
  ]

  return (
    <div className="space-y-6">
      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近のユーザー */}
        <Card>
          <CardHeader>
            <CardTitle>最近登録されたユーザー</CardTitle>
            <CardDescription>直近5名のユーザー</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentUsers.map(user => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{user.userName}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 最近の投稿 */}
        <Card>
          <CardHeader>
            <CardTitle>最近の投稿</CardTitle>
            <CardDescription>直近5件の投稿</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentPosts.map(post => (
                <div key={post.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 line-clamp-1">{post.title}</h4>
                    <span className="flex items-center text-sm text-gray-500">
                      <Heart className="h-4 w-4 mr-1" />
                      {post.empathyCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>by {post.userName}</span>
                    <span>{new Date(post.createdAt).toLocaleDateString('ja-JP')}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
