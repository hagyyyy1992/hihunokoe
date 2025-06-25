'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import PostForm from '@/components/forms/PostForm'
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

  const fetchPost = useCallback(async () => {
    try {
      const response = await fetch(`/api/posts/${id}`)
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
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

  // 体験詳細のバリデーション
  const validateExperienceDetails = (
    details?: Post['experienceDetails']
  ): Partial<ExperienceDetails> => {
    if (!details) return {}

    const result: Partial<ExperienceDetails> = {}

    // 香りのバリデーション
    if (details.fragrance) {
      const validTypes = ['none', 'floral', 'citrus', 'herbal', 'chemical', 'other']
      const validIntensities = ['weak', 'moderate', 'strong']

      const fragrance: Partial<ExperienceDetails['fragrance']> = {}

      if (details.fragrance.type && validTypes.includes(details.fragrance.type)) {
        fragrance.type = details.fragrance.type as ExperienceDetails['fragrance']['type']
      }

      if (details.fragrance.intensity && validIntensities.includes(details.fragrance.intensity)) {
        fragrance.intensity = details.fragrance
          .intensity as ExperienceDetails['fragrance']['intensity']
      }

      if (details.fragrance.description) {
        fragrance.description = details.fragrance.description
      }

      if (Object.keys(fragrance).length > 0) {
        result.fragrance = fragrance as ExperienceDetails['fragrance']
      }
    }

    // テクスチャのバリデーション
    if (details.texture) {
      const validTypes = ['watery', 'gel', 'cream', 'oil', 'powder', 'other']
      const validSpreadability = ['easy', 'moderate', 'difficult']
      const validAbsorption = ['fast', 'moderate', 'slow']

      const texture: Partial<ExperienceDetails['texture']> = {}

      if (details.texture.type && validTypes.includes(details.texture.type)) {
        texture.type = details.texture.type as ExperienceDetails['texture']['type']
      }

      if (
        details.texture.spreadability &&
        validSpreadability.includes(details.texture.spreadability)
      ) {
        texture.spreadability = details.texture
          .spreadability as ExperienceDetails['texture']['spreadability']
      }

      if (details.texture.absorption && validAbsorption.includes(details.texture.absorption)) {
        texture.absorption = details.texture
          .absorption as ExperienceDetails['texture']['absorption']
      }

      if (details.texture.description) {
        texture.description = details.texture.description
      }

      if (Object.keys(texture).length > 0) {
        result.texture = texture as ExperienceDetails['texture']
      }
    }

    // 使用後の状態のバリデーション
    if (details.afterUse) {
      const validMoisture = ['very_dry', 'dry', 'normal', 'moist', 'very_moist']
      const validTexture = ['rough', 'normal', 'smooth', 'very_smooth']
      const validComfort = ['uncomfortable', 'normal', 'comfortable', 'very_comfortable']
      const validDuration = ['short', 'moderate', 'long']

      const afterUse: Partial<ExperienceDetails['afterUse']> = {}

      if (details.afterUse.moisture && validMoisture.includes(details.afterUse.moisture)) {
        afterUse.moisture = details.afterUse.moisture as ExperienceDetails['afterUse']['moisture']
      }

      if (details.afterUse.texture && validTexture.includes(details.afterUse.texture)) {
        afterUse.texture = details.afterUse.texture as ExperienceDetails['afterUse']['texture']
      }

      if (details.afterUse.comfort && validComfort.includes(details.afterUse.comfort)) {
        afterUse.comfort = details.afterUse.comfort as ExperienceDetails['afterUse']['comfort']
      }

      if (details.afterUse.duration && validDuration.includes(details.afterUse.duration)) {
        afterUse.duration = details.afterUse.duration as ExperienceDetails['afterUse']['duration']
      }

      if (details.afterUse.description) {
        afterUse.description = details.afterUse.description
      }

      if (Object.keys(afterUse).length > 0) {
        result.afterUse = afterUse as ExperienceDetails['afterUse']
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">投稿を編集</h1>
          <p className="text-gray-600">投稿内容を編集できます。</p>
        </div>

        <PostForm initialData={formData} postId={post.id.toString()} isEditMode={true} />
      </div>
    </div>
  )
}
