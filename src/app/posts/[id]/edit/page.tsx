'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { useQuery, useApolloClient } from '@apollo/client'
import { GET_POST } from '@/graphql/queries/post'
import PostForm from '@/components/forms/post-form'
import DraggableGuidelineModal from '@/components/ui/draggable-guideline-modal'
import { CosmeticCategory, SkinType, MoodTag, UsageSituation, ExperienceDetails } from '@/types'

interface UsageSituationData {
  season?: string
  timeOfDay?: string
  menstrualCycle?: string
  skinCondition?: string
  weatherCondition?: string
}

interface FragranceData {
  hasFragrance?: boolean
  type?: string
  otherType?: string
  description?: string
}

interface TextureData {
  type?: string
  spreadability?: string
  absorption?: string
  description?: string
}

interface AfterUseData {
  moisture?: string
  texture?: string
  comfort?: string
  duration?: string
  description?: string
}

interface ExperienceDetailsData {
  fragrance?: FragranceData
  texture?: TextureData
  afterUse?: AfterUseData
}

interface PostData {
  post: {
    id: string
    title: string
    content: string
    cosmeticName: string
    productName?: string
    brandName?: string
    color?: string
    cosmeticCategory?: string
    category?: string
    skinType?: string
    usageSituation?: UsageSituationData
    experienceDetails?: ExperienceDetailsData
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
  }
}

export default function EditPostPage() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const apolloClient = useApolloClient()
  const { user, loading: authLoading } = useAuth()
  const [error, setError] = useState('')

  // GraphQL query for post data
  const {
    data,
    loading,
    error: gqlError,
    refetch,
  } = useQuery<PostData>(GET_POST, {
    variables: { id },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  })

  const post = data?.post

  // URLパラメータの変更を監視してデータ再取得
  useEffect(() => {
    const t = searchParams.get('t')
    if (t && id) {
      // タイムスタンプが変更された場合はキャッシュを無効化して再取得
      apolloClient.cache.evict({ id: apolloClient.cache.identify({ __typename: 'Post', id }) })
      refetch()
    }
  }, [searchParams, id, apolloClient, refetch])

  // GraphQLエラーの処理
  useEffect(() => {
    if (gqlError) {
      setError(gqlError.message || '投稿の取得に失敗しました')
    }
  }, [gqlError])

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  // 権限チェック
  useEffect(() => {
    if (!loading && post && user && post.user.id !== user.id) {
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
  const validateUsageSituation = (situation?: UsageSituationData): Partial<UsageSituation> => {
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
    details?: ExperienceDetailsData
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
      const fragranceTypes = ['none', 'floral', 'citrus', 'herbal', 'other'] as const

      const type = safeConvert(details.fragrance.type, fragranceTypes)

      if (type || details.fragrance.description || details.fragrance.hasFragrance !== undefined) {
        result.fragrance = {
          hasFragrance: details.fragrance.hasFragrance,
          type: type,
        }

        if (details.fragrance.otherType) {
          result.fragrance.otherType = details.fragrance.otherType
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
    cosmeticName: post.cosmeticName || post.productName || '',
    brandName: post.brandName,
    color: post.color,
    cosmeticCategory: validateCosmeticCategory(post.cosmeticCategory || post.category),
    skinType: validateSkinType(post.skinType),
    usageSituation: validateUsageSituation(post.usageSituation),
    experienceDetails: validateExperienceDetails(post.experienceDetails),
    moodTag: validateMoodTag(post.moodTag),
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">投稿を編集</h1>
              <p className="text-sm sm:text-base text-gray-600">投稿内容を編集できます。</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <PostForm initialData={formData} postId={post.id.toString()} isEditMode={true} />

          <DraggableGuidelineModal />
        </div>
      </div>
    </div>
  )
}
