import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
// import { useState, useEffect, useCallback } from 'react'
// import { useAuth } from '@/lib/auth/AuthContext'
// import EmpathyButton from '@/components/ui/EmpathyButton'
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

const categoryLabels: Record<string, string> = {
  toner: '化粧水',
  serum: '美容液',
  emulsion: '乳液',
  cream: 'クリーム',
  cleanser: '洗顔',
  foundation: 'ファンデーション',
  concealer: 'コンシーラー',
  powder: 'フェイスパウダー',
  eyeshadow: 'アイシャドウ',
  lipstick: 'リップ',
  sunscreen: '日焼け止め',
  other: 'その他',
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

export default function PostCard({ post }: PostCardProps) {
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

  const truncatedContent =
    post.content.length > 150 ? post.content.substring(0, 150) + '...' : post.content

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
              <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
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
            {formatDistanceToNow(new Date(post.publishedAt), {
              addSuffix: true,
              locale: ja,
            })}
          </span>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span>{post.viewCount}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
