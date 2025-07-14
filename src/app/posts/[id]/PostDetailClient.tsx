'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useAuth } from '@/lib/auth/AuthContext'
import { useQuery } from '@apollo/client'
import { GET_POST } from '@/graphql/queries/post'
import { categoryLabels, skincareCategories } from '@/lib/constants/categories'
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
    commentCount: number
    user: {
      id: string
      displayName: string
      profileImageUrl?: string
      bio?: string
    }
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

interface PostDetailClientProps {
  initialData?: PostData
  postId: string
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

export default function PostDetailClient({ initialData, postId }: PostDetailClientProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [post, setPost] = useState<Post | null>(null)

  // GraphQL query with cache-first policy
  const { data, loading, error } = useQuery<PostData>(GET_POST, {
    variables: { id: postId },
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
    skip: !!initialData, // 初期データがある場合はスキップ
  })

  const graphqlPost = data?.post || initialData?.post

  // REST API fallback for fetching post data
  const fetchPost = useCallback(async () => {
    if (!postId) return

    try {
      const response = await fetch(`/api/posts/${postId}`)
      if (!response.ok) {
        throw new Error('投稿の取得に失敗しました')
      }

      const data = await response.json()
      if (!data.post) {
        throw new Error('投稿データが見つかりません')
      }

      setPost(data.post)
    } catch (err: unknown) {
      console.error('Failed to fetch post:', err)
    }
  }, [postId])

  useEffect(() => {
    // If GraphQL query fails, try REST API
    if (error && !graphqlPost && !post) {
      fetchPost()
    }
  }, [error, graphqlPost, post, fetchPost])

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

  if (loading && !initialData) {
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
                    {currentPost.user
                      ? ('displayName' in currentPost.user
                          ? currentPost.user.displayName
                          : currentPost.user.userName
                        )
                          ?.charAt(0)
                          .toUpperCase() || 'U'
                      : 'U'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="font-medium text-gray-900 text-sm sm:text-base truncate"
                    data-testid="post-author"
                    title={
                      currentPost.user
                        ? ('displayName' in currentPost.user
                            ? currentPost.user.displayName
                            : currentPost.user.userName) || 'Unknown User'
                        : 'Unknown User'
                    }
                  >
                    {currentPost.user
                      ? ('displayName' in currentPost.user
                          ? currentPost.user.displayName
                          : currentPost.user.userName) || 'Unknown User'
                      : 'Unknown User'}
                  </p>
                  {currentPost.user && 'bio' in currentPost.user && currentPost.user.bio && (
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
                  className={`inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${
                    skincareCategories.includes(currentPost.cosmeticCategory)
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
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
          {/* 利用規約未同意のログイン済みユーザー向け表示 */}
          {user && (!user.termsAcceptedAt || !user.privacyAcceptedAt) && (
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
                    <span className="ml-2 text-gray-400">利用規約同意が必要</span>
                  </div>
                  <div>
                    <span className="text-gray-500">時間帯:</span>
                    <span className="ml-2 text-gray-400">利用規約同意が必要</span>
                  </div>
                  <div>
                    <span className="text-gray-500">肌状態:</span>
                    <span className="ml-2 text-gray-400">利用規約同意が必要</span>
                  </div>
                  <div>
                    <span className="text-gray-500">生理周期:</span>
                    <span className="ml-2 text-gray-400">利用規約同意が必要</span>
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
                    <span className="ml-2 text-gray-400">利用規約同意が必要</span>
                  </div>
                  <div>
                    <span className="text-gray-500">テクスチャ:</span>
                    <span className="ml-2 text-gray-400">利用規約同意が必要</span>
                  </div>
                  <div>
                    <span className="text-gray-500">使用後:</span>
                    <span className="ml-2 text-gray-400">利用規約同意が必要</span>
                  </div>
                </div>
              </div>

              {/* 利用規約同意促進 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 text-center">
                <p className="text-yellow-800 mb-3 text-sm sm:text-base font-medium">
                  ⚠️ 詳細情報を見るには利用規約への同意が必要です
                </p>
                <p className="text-yellow-700 mb-3 text-xs sm:text-sm">
                  サービスの詳細機能をご利用いただくために、利用規約とプライバシーポリシーへの同意をお願いします。
                </p>
                <Link
                  href="/auth/terms-agreement"
                  className="inline-block px-4 sm:px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm sm:text-base"
                >
                  利用規約に同意する
                </Link>
              </div>
            </div>
          )}

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

          {/* ログイン時かつ利用規約同意済みユーザーのみ詳細情報を表示 */}
          {user &&
            user.termsAcceptedAt &&
            user.privacyAcceptedAt &&
            (currentPost.usageSituation || currentPost.experienceDetails) && (
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
            {user && currentPost.user && user.id === currentPost.user.id && (
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
                  className="flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors flex-1 sm:flex-initial cursor-pointer"
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
          </div>
        </article>

        {/* 削除確認モーダル */}
        {showDeleteModal && (
          <>
            {/* 背景オーバーレイ */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowDeleteModal(false)}
            />
            {/* モーダル本体 */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
              <div
                className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full pointer-events-auto"
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
          </>
        )}
      </div>
    </div>
  )
}
