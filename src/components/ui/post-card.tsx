import React, { memo, useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { categoryLabels, skincareCategories } from '@/lib/constants/categories'
// import { useCallback } from 'react'
// import { useAuth } from '@/lib/auth/AuthContext'
// import EmpathyButton from '@/components/ui/empathy-button'
// import { EmpathyType } from '@/types'

interface Post {
  id: string
  title: string
  content: string
  cosmeticName: string
  cosmeticCategory?: string
  skinType?: string
  moodTag?: string
  publishedAt: string
  empathyCount: number
  viewCount: number
  user: {
    id: string
    userName: string
    skinType?: string
  }
  _count: {
    empathies: number
    comments: number
  }
}

interface PostCardProps {
  post: Post
}

const skinTypeLabels: Record<string, string> = {
  normal: '普通肌',
  dry: '乾燥肌',
  oily: '脂性肌',
  combination: '混合肌',
  sensitive: '敏感肌',
}

const moodTagLabels: Record<string, string> = {
  disappointed: 'ちょっと残念',
  okay: 'まあまあ',
  good: '良かった',
  love: 'また使いたい',
  perfect: '完璧',
}

const moodTagColors: Record<string, string> = {
  disappointed: 'bg-gray-100 text-gray-700',
  okay: 'bg-yellow-100 text-yellow-700',
  good: 'bg-green-100 text-green-700',
  love: 'bg-apple-100 text-apple-700',
  perfect: 'bg-purple-100 text-purple-700',
}

function PostCard({ post }: PostCardProps) {
  // const { user } = useAuth()
  // const [empathyState, setEmpathyState] = useState<{
  //   hasEmpathized: boolean
  //   empathyType?: EmpathyType
  //   totalCount: number
  // }>({
  //   hasEmpathized: false,
  //   totalCount: post._count.empathies,
  // })

  // const fetchEmpathyState = useCallback(async () => {
  //   if (!user || !post.id) return

  //   try {
  //     const response = await fetch(`/api/posts/empathy?id=${post.id}`)
  //     if (response.ok) {
  //       const data = await response.json()
  //       setEmpathyState({
  //         hasEmpathized: data.hasEmpathized,
  //         empathyType: data.empathyType,
  //         totalCount: data.totalCount,
  //       })
  //     }
  //   } catch (err) {
  //     // エラーハンドリングは控えめに
  //     console.warn('Failed to fetch empathy state:', err)
  //   }
  // }, [user, post.id])

  // useEffect(() => {
  //   if (user && post.id) {
  //     fetchEmpathyState()
  //   }
  // }, [user, post.id, fetchEmpathyState])

  const truncatedContent = useMemo(
    () => (post.content.length > 150 ? post.content.substring(0, 150) + '...' : post.content),
    [post.content]
  )

  // ハイドレーションエラーを防ぐため、相対時間はクライアントサイドでのみ計算
  const [formattedDate, setFormattedDate] = useState<string>('')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient) {
      setFormattedDate(
        formatDistanceToNow(new Date(post.publishedAt), {
          addSuffix: true,
          locale: ja,
        })
      )
    }
  }, [post.publishedAt, isClient])

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow"
      data-testid="post-card"
    >
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex-1">
          <Link
            href={`/posts/${post.id}`}
            className="text-base sm:text-lg font-semibold text-gray-900 hover:text-apple-600 transition-colors line-clamp-2"
            data-testid="post-title"
          >
            {post.title}
          </Link>
          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mt-2">
            {post.cosmeticCategory && (
              <span
                className={`inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  skincareCategories.includes(post.cosmeticCategory)
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {categoryLabels[post.cosmeticCategory]}
              </span>
            )}
            {post.moodTag && (
              <span
                className={`inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${moodTagColors[post.moodTag]}`}
              >
                {moodTagLabels[post.moodTag]}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mb-3 sm:mb-4">
        <p className="text-xs sm:text-sm font-medium text-gray-900 mb-1 truncate">
          使用コスメ: {post.cosmeticName}
        </p>
        <p className="text-gray-600 text-xs sm:text-sm leading-relaxed line-clamp-3">
          {truncatedContent}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <span className="font-medium truncate max-w-20 sm:max-w-none">
              {post.user.userName}
            </span>
            {post.user.skinType && (
              <span className="text-xs bg-gray-100 text-gray-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded hidden sm:inline">
                {skinTypeLabels[post.user.skinType]}
              </span>
            )}
          </div>
          <span className="hidden sm:inline">•</span>
          <span className="text-xs">
            {formattedDate || (
              <span className="inline-block w-12 h-3 bg-gray-200 rounded animate-pulse" />
            )}
          </span>
        </div>
      </div>
    </div>
  )
}

export default memo(PostCard)
