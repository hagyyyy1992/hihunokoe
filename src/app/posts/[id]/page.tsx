'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useAuth } from '@/lib/auth/AuthContext'
import { useQuery } from '@apollo/client'
import { GET_POST } from '@/graphql/queries/post'
// import EmpathyButton from '@/components/ui/EmpathyButton'
// import { EmpathyType } from '@/types'
// import CommentList from '@/components/comments/CommentList'
// import { AuthGuard } from '@/components/auth/AuthGuard'
import {
  fragranceTypeLabels,
  fragranceIntensityLabels,
  textureTypeLabels,
  spreadabilityLabels,
  absorptionLabels,
  moistureLabels,
  textureAfterUseLabels,
  comfortLabels,
} from '@/lib/constants'

interface PostData {
  post: {
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
    createdAt: string
    viewCount: number
    empathyCount: number
    user: {
      id: string
      displayName: string
      profileImageUrl?: string
      bio?: string
    }
    empathies: Array<{
      id: string
      empathyType: string
      user: {
        id: string
      }
    }>
    comments: Array<{
      id: string
      content: string
      createdAt: string
      user: {
        id: string
        displayName: string
        profileImageUrl?: string
      }
    }>
  }
}

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

const seasonLabels: Record<string, string> = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',
}

const timeOfDayLabels: Record<string, string> = {
  morning: '朝',
  evening: '夜',
  both: '朝・夜両方',
}

const menstrualCycleLabels: Record<string, string> = {
  before: '生理前',
  during: '生理中',
  after: '生理後',
  none: '関係なし',
}

const skinConditionLabels: Record<string, string> = {
  good: '調子が良い',
  unstable: '不安定',
  problematic: 'トラブル中',
}

const durationLabels: Record<string, string> = {
  short: '短い（1-2時間）',
  moderate: '普通（3-6時間）',
  long: '長い（半日以上）',
}

export default function PostDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [post, setPost] = useState<Post | null>(null)
  // const [commentCount, setCommentCount] = useState(0)
  // const [empathyState, setEmpathyState] = useState<{
  //   hasEmpathized: boolean
  //   empathyType?: EmpathyType
  //   totalCount: number
  //   isLoading: boolean
  // }>({
  //   hasEmpathized: false,
  //   totalCount: 0,
  //   isLoading: false,
  // })

  // GraphQL query
  const { data, loading, error } = useQuery<PostData>(GET_POST, {
    variables: { id },
    skip: !id,
  })

  const graphqlPost = data?.post

  // REST API fallback for fetching post data
  const fetchPost = useCallback(async () => {
    if (!id) return

    try {
      const response = await fetch(`/api/posts/${id}`)
      if (!response.ok) {
        throw new Error('投稿の取得に失敗しました')
      }

      const data = await response.json()
      if (!data.post) {
        throw new Error('投稿データが見つかりません')
      }

      setPost(data.post)
      // setCommentCount(data.post._count?.comments || 0)
      // setEmpathyState(prevState => ({
      //   ...prevState,
      //   totalCount: data.post._count?.empathies || 0,
      // }))
    } catch (err: unknown) {
      console.error('Failed to fetch post:', err)
    }
  }, [id])

  // const fetchEmpathyState = useCallback(async () => {
  //   if (!user || !id) return

  //   setEmpathyState(prevState => ({
  //     ...prevState,
  //     isLoading: true,
  //   }))

  //   try {
  //     const response = await fetch(`/api/posts/empathy?id=${id}`)
  //     if (response.ok) {
  //       const data = await response.json()
  //       setEmpathyState({
  //         hasEmpathized: data.hasEmpathized || false,
  //         empathyType: data.empathyType,
  //         totalCount: data.totalCount || 0,
  //         isLoading: false,
  //       })
  //     } else {
  //       // 404やその他のエラーの場合、デフォルト状態を設定
  //       setEmpathyState({
  //         hasEmpathized: false,
  //         totalCount: 0,
  //         isLoading: false,
  //       })
  //     }
  //   } catch (err) {
  //     // 共感状態の取得に失敗してもエラーにはしない
  //     console.warn('Failed to fetch empathy state:', err)
  //     setEmpathyState({
  //       hasEmpathized: false,
  //       totalCount: 0,
  //       isLoading: false,
  //     })
  //   }
  // }, [user, id])
  useEffect(() => {
    // If GraphQL query fails, try REST API
    if (error && !graphqlPost && !post) {
      fetchPost()
    }
  }, [error, graphqlPost, post, fetchPost])

  // useEffect(() => {
  //   // Update counts from GraphQL data
  //   if (graphqlPost) {
  //     setCommentCount(graphqlPost.comments.length)
  //     setEmpathyState(prevState => ({
  //       ...prevState,
  //       totalCount: graphqlPost.empathyCount,
  //       hasEmpathized: graphqlPost.empathies.some(e => e.user.id === user?.id),
  //       empathyType: graphqlPost.empathies.find(e => e.user.id === user?.id)?.empathyType as EmpathyType,
  //     }))
  //   }
  // }, [graphqlPost, user])

  // useEffect(() => {
  //   if (id && user && post) {
  //     fetchEmpathyState()
  //   }
  // }, [id, user, post, fetchEmpathyState])

  const handleDelete = async () => {
    const currentPost = graphqlPost || post
    if (!currentPost || isDeleting) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/posts/delete?id=${currentPost.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '投稿の削除に失敗しました')
      }

      // 削除成功後、投稿一覧に戻る
      router.push('/posts')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '投稿の削除に失敗しました'
      alert(errorMessage) // 簡易的なエラー表示
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

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

  const currentPost = graphqlPost || post

  if (error && !currentPost) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">投稿が見つかりません</h2>
          <p className="text-gray-600">{error?.message || '投稿が見つかりませんでした'}</p>
        </div>
      </div>
    )
  }

  if (!currentPost) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-apple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
        {/* 投稿メイン */}
        <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          {/* ヘッダー */}
          <header className="mb-4 sm:mb-6">
            <div className="flex items-start justify-between mb-4 gap-3">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-apple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-apple-600 font-medium text-xs sm:text-sm">
                    {('displayName' in currentPost.user
                      ? currentPost.user.displayName
                      : currentPost.user.userName
                    )
                      ?.charAt(0)
                      .toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="font-medium text-gray-900 text-sm sm:text-base truncate"
                    data-testid="post-author"
                    title={
                      'displayName' in currentPost.user
                        ? currentPost.user.displayName
                        : currentPost.user.userName
                    }
                  >
                    {'displayName' in currentPost.user
                      ? currentPost.user.displayName
                      : currentPost.user.userName}
                  </p>
                  {'bio' in currentPost.user && currentPost.user.bio && (
                    <p className="text-xs text-gray-500 truncate" title={currentPost.user.bio}>
                      {currentPost.user.bio}
                    </p>
                  )}
                </div>
              </div>
              <time
                className="text-xs sm:text-sm text-gray-500 whitespace-nowrap flex-shrink-0"
                data-testid="post-date"
              >
                {formatDistanceToNow(
                  new Date(
                    'createdAt' in currentPost ? currentPost.createdAt : currentPost.publishedAt
                  ),
                  {
                    addSuffix: true,
                    locale: ja,
                  }
                )}
              </time>
            </div>

            <h1
              className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight"
              data-testid="post-title"
            >
              {currentPost.title}
            </h1>

            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              {currentPost.cosmeticCategory && (
                <span
                  className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-800"
                  data-testid="post-category"
                >
                  {categoryLabels[currentPost.cosmeticCategory]}
                </span>
              )}
              {currentPost.moodTag && (
                <span
                  className={`inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${moodTagColors[currentPost.moodTag]}`}
                >
                  {moodTagLabels[currentPost.moodTag]}
                </span>
              )}
              {currentPost.skinType && (
                <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium bg-gray-100 text-gray-700">
                  {skinTypeLabels[currentPost.skinType]}
                </span>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">
                使用したコスメ
              </h3>
              <p className="text-gray-700 text-sm sm:text-base break-words">
                {currentPost.cosmeticName}
              </p>
            </div>
          </header>

          {/* 本文 */}
          <div className="prose max-w-none mb-6 sm:mb-8">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-sm sm:text-base">
              {currentPost.content}
            </div>
          </div>

          {/* 詳細情報 */}
          {/* 非ログイン時は項目名のみを表示 */}
          {!user && (
            <div className="border-t pt-4 sm:pt-6 mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
                詳細情報
              </h3>

              {/* 使用状況の項目名のみ表示 */}
              <div className="mb-4 sm:mb-6">
                <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">
                  使用状況
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-gray-500">季節:</span>
                    <span className="ml-2 text-gray-400">ログインして確認</span>
                  </div>
                  <div>
                    <span className="text-gray-500">時間帯:</span>
                    <span className="ml-2 text-gray-400">ログインして確認</span>
                  </div>
                  <div>
                    <span className="text-gray-500">肌状態:</span>
                    <span className="ml-2 text-gray-400">ログインして確認</span>
                  </div>
                  <div>
                    <span className="text-gray-500">生理周期:</span>
                    <span className="ml-2 text-gray-400">ログインして確認</span>
                  </div>
                </div>
              </div>

              {/* 体験詳細の項目名のみ表示 */}
              <div className="mb-4 sm:mb-6">
                <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">
                  体験詳細
                </h4>
                <div className="space-y-2 sm:space-y-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-gray-500">香り:</span>
                    <span className="ml-2 text-gray-400">ログインして確認</span>
                  </div>
                  <div>
                    <span className="text-gray-500">テクスチャ:</span>
                    <span className="ml-2 text-gray-400">ログインして確認</span>
                  </div>
                  <div>
                    <span className="text-gray-500">使用後:</span>
                    <span className="ml-2 text-gray-400">ログインして確認</span>
                  </div>
                </div>
              </div>

              {/* ログイン促進 */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 text-center">
                <p className="text-gray-700 mb-3 text-sm sm:text-base">
                  詳細情報を見るにはログインが必要です
                </p>
                <Link
                  href="/auth/login"
                  className="inline-block px-4 sm:px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm sm:text-base"
                >
                  ログイン
                </Link>
              </div>
            </div>
          )}

          {/* ログイン時のみ詳細情報を表示 */}
          {user && (currentPost.usageSituation || currentPost.experienceDetails) && (
            <div className="border-t pt-4 sm:pt-6 mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
                詳細情報
              </h3>

              {/* ログイン時の通常表示 */}
              <>
                {/* 使用状況 */}
                {currentPost.usageSituation &&
                  Object.keys(currentPost.usageSituation).length > 0 && (
                    <div className="mb-4 sm:mb-6">
                      <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">
                        使用状況
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                        {currentPost.usageSituation.season && (
                          <div>
                            <span className="text-gray-500">季節:</span>
                            <span className="ml-2 text-gray-900">
                              {seasonLabels[currentPost.usageSituation.season] ||
                                currentPost.usageSituation.season}
                            </span>
                          </div>
                        )}
                        {currentPost.usageSituation.timeOfDay && (
                          <div>
                            <span className="text-gray-500">時間帯:</span>
                            <span className="ml-2 text-gray-900">
                              {timeOfDayLabels[currentPost.usageSituation.timeOfDay] ||
                                currentPost.usageSituation.timeOfDay}
                            </span>
                          </div>
                        )}
                        {currentPost.usageSituation.skinCondition && (
                          <div>
                            <span className="text-gray-500">肌状態:</span>
                            <span className="ml-2 text-gray-900">
                              {skinConditionLabels[currentPost.usageSituation.skinCondition] ||
                                currentPost.usageSituation.skinCondition}
                            </span>
                          </div>
                        )}
                        {currentPost.usageSituation.menstrualCycle && (
                          <div>
                            <span className="text-gray-500">生理周期:</span>
                            <span className="ml-2 text-gray-900">
                              {menstrualCycleLabels[currentPost.usageSituation.menstrualCycle] ||
                                currentPost.usageSituation.menstrualCycle}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* 体験詳細 */}
                {currentPost.experienceDetails &&
                  Object.keys(currentPost.experienceDetails).length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">
                        体験詳細
                      </h4>
                      <div className="space-y-2 sm:space-y-4 text-xs sm:text-sm">
                        {currentPost.experienceDetails.fragrance && (
                          <div>
                            <span className="text-gray-500">香り:</span>
                            <span className="ml-2 text-gray-900">
                              {fragranceTypeLabels[
                                currentPost.experienceDetails.fragrance.type || ''
                              ] || currentPost.experienceDetails.fragrance.type}
                              {currentPost.experienceDetails.fragrance.intensity &&
                                ` (${fragranceIntensityLabels[currentPost.experienceDetails.fragrance.intensity] || currentPost.experienceDetails.fragrance.intensity})`}
                            </span>
                          </div>
                        )}
                        {currentPost.experienceDetails.texture && (
                          <div>
                            <span className="text-gray-500">テクスチャ:</span>
                            <span className="ml-2 text-gray-900">
                              {textureTypeLabels[
                                currentPost.experienceDetails.texture.type || ''
                              ] || currentPost.experienceDetails.texture.type}
                              {currentPost.experienceDetails.texture.spreadability &&
                                ` / ${spreadabilityLabels[currentPost.experienceDetails.texture.spreadability] || currentPost.experienceDetails.texture.spreadability}`}
                              {currentPost.experienceDetails.texture.absorption &&
                                ` / 浸透: ${absorptionLabels[currentPost.experienceDetails.texture.absorption] || currentPost.experienceDetails.texture.absorption}`}
                            </span>
                          </div>
                        )}
                        {currentPost.experienceDetails.afterUse && (
                          <div>
                            <span className="text-gray-500">使用後:</span>
                            <span className="ml-2 text-gray-900">
                              {currentPost.experienceDetails.afterUse.moisture &&
                                `うるおい感: ${moistureLabels[currentPost.experienceDetails.afterUse.moisture] || currentPost.experienceDetails.afterUse.moisture}`}
                              {currentPost.experienceDetails.afterUse.texture &&
                                ` / 手触り: ${textureAfterUseLabels[currentPost.experienceDetails.afterUse.texture] || currentPost.experienceDetails.afterUse.texture}`}
                              {currentPost.experienceDetails.afterUse.comfort &&
                                ` / ${comfortLabels[currentPost.experienceDetails.afterUse.comfort] || currentPost.experienceDetails.afterUse.comfort}`}
                              {currentPost.experienceDetails.afterUse.duration &&
                                ` / 持続時間: ${durationLabels[currentPost.experienceDetails.afterUse.duration] || currentPost.experienceDetails.afterUse.duration}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
              </>
            </div>
          )}

          {/* アクション */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 sm:pt-6 border-t space-y-3 sm:space-y-0">
            {/* 編集・削除ボタン（投稿者のみ表示） */}
            {user && user.id === currentPost.user.id && (
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Link
                  href={`/posts/${currentPost.id}/edit`}
                  className="flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors flex-1 sm:flex-initial"
                  data-testid="edit-post-button"
                >
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
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                  <span>編集</span>
                </Link>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors flex-1 sm:flex-initial"
                  data-testid="post-menu-button"
                >
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span>削除</span>
                </button>
              </div>
            )}

            <div className="flex items-center space-x-4 sm:space-x-6 text-xs sm:text-sm text-gray-500 order-first sm:order-last">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span data-testid="comment-count">0 コメント</span>
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
                <span data-testid="view-count">{currentPost.viewCount} 閲覧</span>
              </div>
            </div>

            {/* 共感ボタン（スタブ実装） */}
            <div className="flex items-center space-x-3">
              {user ? (
                <button
                  data-testid="empathy-button"
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors cursor-not-allowed opacity-50"
                  disabled
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span>共感する</span>
                </button>
              ) : (
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
                    <span>0 共感</span>
                  </div>
                  <Link
                    href="/auth/login"
                    className="text-sm text-green-600 hover:text-green-700 underline"
                  >
                    ログインして共感
                  </Link>
                </div>
              )}
            </div>
          </div>
        </article>

        {/* コメントセクション（スタブ実装） */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <h3 className="text-lg font-semibold mb-4">コメント</h3>
          {user ? (
            <div>
              <div className="mb-4">
                <textarea
                  data-testid="comment-input"
                  className="w-full p-3 border border-gray-300 rounded-md resize-none"
                  placeholder="コメントを入力してください"
                  rows={3}
                  disabled
                />
                <button
                  data-testid="add-comment-button"
                  className="mt-2 px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed"
                  disabled
                >
                  コメントする（準備中）
                </button>
              </div>
              <p className="text-gray-500 text-sm">コメント機能は現在準備中です。</p>
            </div>
          ) : (
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <p className="text-gray-600 mb-4">コメントを見るにはログインが必要です</p>
              <Link
                href="/auth/login"
                className="inline-block bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition-colors"
              >
                ログインする
              </Link>
            </div>
          )}
        </div>

        {/* 関連投稿セクション（スタブ実装） */}
        <div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8"
          data-testid="related-posts"
        >
          <h3 className="text-lg font-semibold mb-4">関連する投稿</h3>
          <p className="text-gray-500">関連投稿機能は開発中です。</p>
        </div>

        {/* 削除確認モーダル */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full"
              data-testid="delete-confirmation"
            >
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
                投稿を削除しますか？
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                この操作は取り消すことができません。本当に削除してもよろしいですか？
              </p>
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 order-2 sm:order-1"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 order-1 sm:order-2"
                  data-testid="confirm-delete-button"
                >
                  {isDeleting ? '削除中...' : '削除する'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
