import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import EmpathyButton from '@/components/ui/EmpathyButton'
import { EmpathyType } from '@/types'

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
  love: 'bg-pink-100 text-pink-700',
  perfect: 'bg-purple-100 text-purple-700',
}

export default function PostCard({ post }: PostCardProps) {
  const { user } = useAuth()
  const [empathyState, setEmpathyState] = useState<{
    hasEmpathized: boolean
    empathyType?: EmpathyType
    totalCount: number
  }>({
    hasEmpathized: false,
    totalCount: post._count.empathies,
  })

  const fetchEmpathyState = useCallback(async () => {
    if (!user || !post.id) return

    try {
      const response = await fetch(`/api/posts/empathy?id=${post.id}`)
      if (response.ok) {
        const data = await response.json()
        setEmpathyState({
          hasEmpathized: data.hasEmpathized,
          empathyType: data.empathyType,
          totalCount: data.totalCount,
        })
      }
    } catch (err) {
      // エラーハンドリングは控えめに
      console.warn('Failed to fetch empathy state:', err)
    }
  }, [user, post.id])

  useEffect(() => {
    if (user && post.id) {
      fetchEmpathyState()
    }
  }, [user, post.id, fetchEmpathyState])

  const truncatedContent =
    post.content.length > 150 ? post.content.substring(0, 150) + '...' : post.content

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Link
            href={`/posts/${post.id}`}
            className="text-lg font-semibold text-gray-900 hover:text-pink-600 transition-colors"
          >
            {post.title}
          </Link>
          <div className="flex items-center space-x-2 mt-2">
            {post.cosmeticCategory && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {categoryLabels[post.cosmeticCategory]}
              </span>
            )}
            {post.moodTag && (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${moodTagColors[post.moodTag]}`}
              >
                {moodTagLabels[post.moodTag]}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-900 mb-1">使用コスメ: {post.cosmeticName}</p>
        <p className="text-gray-600 text-sm leading-relaxed">{truncatedContent}</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <span className="font-medium">{post.user.userName}</span>
            {post.user.skinType && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {skinTypeLabels[post.user.skinType]}
              </span>
            )}
          </div>
          <span>•</span>
          <span>
            {formatDistanceToNow(new Date(post.publishedAt), {
              addSuffix: true,
              locale: ja,
            })}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span>{post._count.comments}</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {user ? (
            <EmpathyButton
              postId={post.id}
              initialCount={empathyState.totalCount}
              initialHasEmpathized={empathyState.hasEmpathized}
              initialEmpathyType={empathyState.empathyType}
              size="sm"
            />
          ) : (
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span>{empathyState.totalCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
