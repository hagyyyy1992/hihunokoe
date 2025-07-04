'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useAuth } from '@/lib/auth/AuthContext'
// import EmpathyButton from '@/components/ui/EmpathyButton'
import { EmpathyType } from '@/types'
// import CommentList from '@/components/comments/CommentList'
// import { AuthGuard } from '@/components/auth/AuthGuard'

interface Post {
  id: string
  title: string
  content: string
  cosmeticName: string
  cosmeticCategory?: string
  skinType?: string
  usageSituation?: {
    season?: string
    timeOfDay?: string
    menstrualCycle?: string
    skinCondition?: string
    weatherCondition?: string
  }
  experienceDetails?: {
    fragrance?: {
      type?: string
      intensity?: string
      description?: string
    }
    texture?: {
      type?: string
      spreadability?: string
      absorption?: string
      description?: string
    }
    afterUse?: {
      moisture?: string
      texture?: string
      comfort?: string
      duration?: string
      description?: string
    }
  }
  moodTag?: string
  publishedAt: string
  viewCount: number
  user: {
    id: string
    userName: string
    skinType?: string
  }
  empathies: Array<{
    id: string
    empathyType: string
    user: {
      id: string
      userName: string
    }
  }>
  comments: Array<{
    id: string
    content: string
    createdAt: string
    user: {
      id: string
      userName: string
      skinType?: string
    }
    replies: Array<{
      id: string
      content: string
      createdAt: string
      user: {
        id: string
        userName: string
        skinType?: string
      }
    }>
  }>
  _count: {
    empathies: number
    comments: number
  }
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

export default function PostDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [empathyState, setEmpathyState] = useState<{
    hasEmpathized: boolean
    empathyType?: EmpathyType
    totalCount: number
    isLoading: boolean
  }>({
    hasEmpathized: false,
    totalCount: 0,
    isLoading: false,
  })
  console.log('empathyState', empathyState)

  const fetchPost = useCallback(async () => {
    try {
      const response = await fetch(`/api/posts/get?id=${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '投稿の取得に失敗しました')
      }

      if (!data.post) {
        throw new Error('投稿データが見つかりません')
      }

      setPost(data.post)
      setEmpathyState(prevState => ({
        ...prevState,
        totalCount: data.post._count?.empathies || 0,
      }))
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '投稿の取得に失敗しました'
      setError(errorMessage)
      setPost(null) // エラー時は明示的にnullを設定
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchEmpathyState = useCallback(async () => {
    if (!user || !id) return

    setEmpathyState(prevState => ({
      ...prevState,
      isLoading: true,
    }))

    try {
      const response = await fetch(`/api/posts/empathy?id=${id}`)
      if (response.ok) {
        const data = await response.json()
        setEmpathyState({
          hasEmpathized: data.hasEmpathized || false,
          empathyType: data.empathyType,
          totalCount: data.totalCount || 0,
          isLoading: false,
        })
      } else {
        // 404やその他のエラーの場合、デフォルト状態を設定
        setEmpathyState({
          hasEmpathized: false,
          totalCount: 0,
          isLoading: false,
        })
      }
    } catch (err) {
      // 共感状態の取得に失敗してもエラーにはしない
      console.warn('Failed to fetch empathy state:', err)
      setEmpathyState({
        hasEmpathized: false,
        totalCount: 0,
        isLoading: false,
      })
    }
  }, [user, id])

  useEffect(() => {
    if (id) {
      fetchPost()
    }
  }, [id, fetchPost])

  useEffect(() => {
    if (id && user && post) {
      fetchEmpathyState()
    }
  }, [id, user, post, fetchEmpathyState])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-apple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">投稿が見つかりません</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 投稿メイン */}
        <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 mb-8">
          {/* ヘッダー */}
          <header className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-apple-100 rounded-full flex items-center justify-center">
                  <span className="text-apple-600 font-medium text-sm">
                    {post.user.userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{post.user.userName}</p>
                  {post.user.skinType && (
                    <p className="text-xs text-gray-500">{skinTypeLabels[post.user.skinType]}</p>
                  )}
                </div>
              </div>
              <time className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(post.publishedAt), {
                  addSuffix: true,
                  locale: ja,
                })}
              </time>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>

            <div className="flex flex-wrap gap-2 mb-4">
              {post.cosmeticCategory && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {categoryLabels[post.cosmeticCategory]}
                </span>
              )}
              {post.moodTag && (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${moodTagColors[post.moodTag]}`}
                >
                  {moodTagLabels[post.moodTag]}
                </span>
              )}
              {post.skinType && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                  {skinTypeLabels[post.skinType]}
                </span>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">使用したコスメ</h3>
              <p className="text-gray-700">{post.cosmeticName}</p>
            </div>
          </header>

          {/* 本文 */}
          <div className="prose max-w-none mb-8">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">{post.content}</div>
          </div>

          {/* 詳細情報 */}
          {(post.usageSituation || post.experienceDetails) && (
            <div className="border-t pt-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">詳細情報</h3>

              {/* 使用状況 */}
              {post.usageSituation && Object.keys(post.usageSituation).length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">使用状況</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    {post.usageSituation.season && (
                      <div>
                        <span className="text-gray-500">季節:</span>
                        <span className="ml-2 text-gray-900">{post.usageSituation.season}</span>
                      </div>
                    )}
                    {post.usageSituation.timeOfDay && (
                      <div>
                        <span className="text-gray-500">時間帯:</span>
                        <span className="ml-2 text-gray-900">{post.usageSituation.timeOfDay}</span>
                      </div>
                    )}
                    {post.usageSituation.skinCondition && (
                      <div>
                        <span className="text-gray-500">肌状態:</span>
                        <span className="ml-2 text-gray-900">
                          {post.usageSituation.skinCondition}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 体験詳細 */}
              {post.experienceDetails && Object.keys(post.experienceDetails).length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">体験詳細</h4>
                  <div className="space-y-4 text-sm">
                    {post.experienceDetails.fragrance && (
                      <div>
                        <span className="text-gray-500">香り:</span>
                        <span className="ml-2 text-gray-900">
                          {post.experienceDetails.fragrance.type}
                          {post.experienceDetails.fragrance.intensity &&
                            ` (${post.experienceDetails.fragrance.intensity})`}
                        </span>
                      </div>
                    )}
                    {post.experienceDetails.texture && (
                      <div>
                        <span className="text-gray-500">テクスチャ:</span>
                        <span className="ml-2 text-gray-900">
                          {post.experienceDetails.texture.type}
                          {post.experienceDetails.texture.spreadability &&
                            ` / ${post.experienceDetails.texture.spreadability}`}
                        </span>
                      </div>
                    )}
                    {post.experienceDetails.afterUse && (
                      <div>
                        <span className="text-gray-500">使用後:</span>
                        <span className="ml-2 text-gray-900">
                          うるおい感 {post.experienceDetails.afterUse.moisture}
                          {post.experienceDetails.afterUse.comfort &&
                            ` / ${post.experienceDetails.afterUse.comfort}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* アクション */}
          <div className="flex items-center justify-between pt-6 border-t">
            {/* 編集・削除ボタン（投稿者のみ表示） */}
            {user && user.id === post.user.id && (
              <div className="flex items-center space-x-3">
                <Link
                  href={`/posts/${post.id}/edit`}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                  <span>編集</span>
                </Link>
                <Link
                  href={`/posts/${post.id}/edit#delete`}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span>削除</span>
                </Link>
              </div>
            )}

            {/* <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span>{post._count.comments} コメント</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <span>{post.viewCount} 閲覧</span>
              </div>
            </div> */}

            {/* <AuthGuard
              fallback={
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <span>{empathyState.totalCount} 共感</span>
                  </div>
                  <Link
                    href="/auth/login"
                    className="text-sm text-primary-600 hover:text-primary-700 underline"
                  >
                    ログインして共感
                  </Link>
                </div>
              }
            >
              <EmpathyButton
                postId={post.id}
                initialCount={empathyState.totalCount}
                initialHasEmpathized={empathyState.hasEmpathized}
                initialEmpathyType={empathyState.empathyType}
                initializing={empathyState.isLoading}
                size="md"
              />
            </AuthGuard> */}
          </div>
        </article>

        {/* コメントセクション */}
        {/* <AuthGuard
          fallback={
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <p className="text-gray-600 mb-4">コメントを見るにはログインが必要です</p>
              <Link
                href="/auth/login"
                className="inline-block bg-primary-500 text-white px-6 py-2 rounded-md hover:bg-primary-600 transition-colors"
              >
                ログインする
              </Link>
            </div>
          }
        >
          <CommentList postId={post.id} initialCommentsCount={post._count.comments} />
        </AuthGuard> */}
      </div>
    </div>
  )
}
