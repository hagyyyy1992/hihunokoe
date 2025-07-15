'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import PostForm from '@/components/forms/PostForm'
import DraggableGuidelineModal from '@/components/ui/DraggableGuidelineModal'
import { CosmeticCategory, SkinType, MoodTag, UsageSituation, ExperienceDetails } from '@/types'

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
  userId: string
}

export default function EditPostPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchPost = useCallback(async () => {
    try {
      const response = await fetch(`/api/posts/get?id=${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '投稿の取得に失敗しました')
      }

      setPost(data.post)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '投稿の取得に失敗しました'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchPost()
    }
  }, [id, fetchPost])

  // URLのハッシュフラグメントをチェックして削除ダイアログを表示
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#delete') {
      // 投稿データが読み込まれた後に削除ダイアログを表示
      if (!loading && post) {
        setShowDeleteConfirm(true)
      }
    }
  }, [loading, post])

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  // 権限チェック
  useEffect(() => {
    if (!loading && post && user && post.userId !== user.id) {
      router.push(`/posts/${id}`)
    }
  }, [post, user, loading, id, router])

  if (authLoading || loading) {
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

  // 投稿データをフォーム用に整形
  const validateCosmeticCategory = (category?: string): CosmeticCategory | '' => {
    if (!category) return ''
    const validCategories: CosmeticCategory[] = [
      'skincare',
      'toner',
      'serum',
      'emulsion',
      'cream',
      'cleanser',
      'foundation',
      'concealer',
      'powder',
      'eyeshadow',
      'lipstick',
      'sunscreen',
      'other',
    ]
    return validCategories.includes(category as CosmeticCategory)
      ? (category as CosmeticCategory)
      : ''
  }

  const validateSkinType = (type?: string): SkinType | '' => {
    if (!type) return ''
    const validTypes: SkinType[] = ['normal', 'dry', 'oily', 'combination', 'sensitive']
    return validTypes.includes(type as SkinType) ? (type as SkinType) : ''
  }

  const validateMoodTag = (tag?: string): MoodTag | '' => {
    if (!tag) return ''
    const validTags: MoodTag[] = ['disappointed', 'okay', 'good', 'love', 'perfect']
    return validTags.includes(tag as MoodTag) ? (tag as MoodTag) : ''
  }

  // 使用状況のバリデーション
  const validateUsageSituation = (situation?: Post['usageSituation']): Partial<UsageSituation> => {
    if (!situation) return {}

    const validSeasons = ['spring', 'summer', 'autumn', 'winter']
    const validTimeOfDay = ['morning', 'evening', 'both']
    const validMenstrualCycle = ['before', 'during', 'after', 'none']
    const validSkinCondition = ['good', 'unstable', 'problematic']
    const validWeatherCondition = ['humid', 'dry', 'hot', 'cold', 'normal']

    const result: Partial<UsageSituation> = {}

    if (situation.season && validSeasons.includes(situation.season)) {
      result.season = situation.season as UsageSituation['season']
    }

    if (situation.timeOfDay && validTimeOfDay.includes(situation.timeOfDay)) {
      result.timeOfDay = situation.timeOfDay as UsageSituation['timeOfDay']
    }

    if (situation.menstrualCycle && validMenstrualCycle.includes(situation.menstrualCycle)) {
      result.menstrualCycle = situation.menstrualCycle as UsageSituation['menstrualCycle']
    }

    if (situation.skinCondition && validSkinCondition.includes(situation.skinCondition)) {
      result.skinCondition = situation.skinCondition as UsageSituation['skinCondition']
    }

    if (situation.weatherCondition && validWeatherCondition.includes(situation.weatherCondition)) {
      result.weatherCondition = situation.weatherCondition as UsageSituation['weatherCondition']
    }

    return result
  }

  // 体験詳細のバリデーション - シンプル化したバージョン
  const validateExperienceDetails = (
    details?: Post['experienceDetails']
  ): Partial<ExperienceDetails> => {
    // 詳細がない場合は空オブジェクトを返す
    if (!details) return {}

    // 安全に変換するためのヘルパー関数
    const safeConvert = <T extends string>(
      value: unknown,
      validValues: readonly T[]
    ): T | undefined => {
      if (typeof value === 'string' && validValues.includes(value as T)) {
        return value as T
      }
      return undefined
    }

    // 結果オブジェクト
    const result: Partial<ExperienceDetails> = {}

    // 香りの処理
    if (details.fragrance) {
      const fragranceTypes = ['none', 'floral', 'citrus', 'herbal', 'chemical', 'other'] as const
      const intensityTypes = ['weak', 'moderate', 'strong'] as const

      const type = safeConvert(details.fragrance.type, fragranceTypes)
      const intensity = safeConvert(details.fragrance.intensity, intensityTypes)

      if (type || intensity || details.fragrance.description) {
        result.fragrance = {
          type: type || 'other',
          intensity: intensity || 'moderate',
        }

        if (details.fragrance.description) {
          result.fragrance.description = details.fragrance.description
        }
      }
    }

    // テクスチャの処理
    if (details.texture) {
      const textureTypes = ['watery', 'gel', 'cream', 'oil', 'powder', 'other'] as const
      const spreadabilityTypes = ['easy', 'moderate', 'difficult'] as const
      const absorptionTypes = ['fast', 'moderate', 'slow'] as const

      const type = safeConvert(details.texture.type, textureTypes)
      const spreadability = safeConvert(details.texture.spreadability, spreadabilityTypes)
      const absorption = safeConvert(details.texture.absorption, absorptionTypes)

      if (type || spreadability || absorption || details.texture.description) {
        result.texture = {
          type: type || 'other',
          spreadability: spreadability || 'moderate',
          absorption: absorption || 'moderate',
        }

        if (details.texture.description) {
          result.texture.description = details.texture.description
        }
      }
    }

    // 使用後の状態の処理
    if (details.afterUse) {
      const moistureTypes = ['very_dry', 'dry', 'normal', 'moist', 'very_moist'] as const
      const textureTypes = ['rough', 'normal', 'smooth', 'very_smooth'] as const
      const comfortTypes = ['uncomfortable', 'normal', 'comfortable', 'very_comfortable'] as const
      const durationTypes = ['short', 'moderate', 'long'] as const

      const moisture = safeConvert(details.afterUse.moisture, moistureTypes)
      const texture = safeConvert(details.afterUse.texture, textureTypes)
      const comfort = safeConvert(details.afterUse.comfort, comfortTypes)
      const duration = safeConvert(details.afterUse.duration, durationTypes)

      if (moisture || texture || comfort || duration || details.afterUse.description) {
        result.afterUse = {
          moisture: moisture || 'normal',
          texture: texture || 'normal',
          comfort: comfort || 'normal',
          duration: duration || 'moderate',
        }

        if (details.afterUse.description) {
          result.afterUse.description = details.afterUse.description
        }
      }
    }

    return result
  }

  const formData = {
    title: post.title,
    content: post.content,
    cosmeticName: post.cosmeticName,
    cosmeticCategory: validateCosmeticCategory(post.cosmeticCategory),
    skinType: validateSkinType(post.skinType),
    usageSituation: validateUsageSituation(post.usageSituation),
    experienceDetails: validateExperienceDetails(post.experienceDetails),
    moodTag: validateMoodTag(post.moodTag),
  }

  // 投稿削除処理
  const handleDelete = async () => {
    if (!post || !user) return

    setDeleteLoading(true)

    try {
      const response = await fetch(`/api/posts/delete?id=${post.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '投稿の削除に失敗しました')
      }

      router.push('/posts')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '投稿の削除に失敗しました'
      setError(errorMessage)
      setDeleteLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">投稿を編集</h1>
          <p className="text-sm sm:text-base text-gray-600">投稿内容を編集できます。</p>
        </div>

        <div className="relative">
          <PostForm initialData={formData} postId={post.id.toString()} isEditMode={true} />

          <DraggableGuidelineModal />
        </div>

        {/* 削除確認ダイアログ */}
        {showDeleteConfirm && (
          <>
            <div
              className="fixed inset-0 z-40"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
              onClick={() => setShowDeleteConfirm(false)}
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
              <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4 pointer-events-auto">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
                  投稿を削除しますか？
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                  この操作は取り消せません。本当に削除しますか？
                </p>
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors order-2 sm:order-1 cursor-pointer disabled:cursor-not-allowed"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleteLoading}
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors order-1 sm:order-2 cursor-pointer disabled:cursor-not-allowed"
                    onClick={handleDelete}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        削除中...
                      </span>
                    ) : (
                      '削除する'
                    )}
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
