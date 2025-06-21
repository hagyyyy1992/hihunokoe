'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SkinType, CosmeticCategory, MoodTag, UsageSituation, ExperienceDetails } from '@/types'

interface PostFormData {
  title: string
  content: string
  cosmeticName: string
  cosmeticCategory: CosmeticCategory | ''
  skinType: SkinType | ''
  usageSituation: Partial<UsageSituation>
  experienceDetails: Partial<ExperienceDetails>
  moodTag: MoodTag | ''
}

export default function PostForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    content: '',
    cosmeticName: '',
    cosmeticCategory: '',
    skinType: '',
    usageSituation: {},
    experienceDetails: {},
    moodTag: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleNestedChange = (section: 'usageSituation' | 'experienceDetails', field: string, value: any, subField?: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: subField ? {
          ...(prev[section] as any)?.[field],
          [subField]: value,
        } : value,
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          cosmeticCategory: formData.cosmeticCategory || undefined,
          skinType: formData.skinType || undefined,
          moodTag: formData.moodTag || undefined,
          usageSituation: Object.keys(formData.usageSituation).length > 0 ? formData.usageSituation : undefined,
          experienceDetails: Object.keys(formData.experienceDetails).length > 0 ? formData.experienceDetails : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '投稿の作成に失敗しました')
      }

      router.push(`/posts/${data.post.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.title && formData.cosmeticName && formData.content
      case 2:
        return true // オプショナル
      case 3:
        return true // オプショナル
      case 4:
        return true // オプショナル
      default:
        return false
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* ステップインジケーター */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step}
              </div>
              {step < 4 && (
                <div
                  className={`w-full h-1 mx-2 ${
                    step < currentStep ? 'bg-pink-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 text-sm text-gray-600 text-center">
          {currentStep === 1 && '基本情報'}
          {currentStep === 2 && '使用状況'}
          {currentStep === 3 && '体験の詳細'}
          {currentStep === 4 && '感想とまとめ'}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* ステップ1: 基本情報 */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">基本情報</h3>
            
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                タイトル *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                placeholder="例: ○○クリームを敏感肌で試してみました"
              />
            </div>

            <div>
              <label htmlFor="cosmeticName" className="block text-sm font-medium text-gray-700">
                使用したコスメ名 *
              </label>
              <input
                type="text"
                id="cosmeticName"
                name="cosmeticName"
                required
                value={formData.cosmeticName}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                placeholder="例: ○○ブランド モイスチャークリーム"
              />
            </div>

            <div>
              <label htmlFor="cosmeticCategory" className="block text-sm font-medium text-gray-700">
                コスメカテゴリ
              </label>
              <select
                id="cosmeticCategory"
                name="cosmeticCategory"
                value={formData.cosmeticCategory}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">選択してください</option>
                <option value="toner">化粧水</option>
                <option value="serum">美容液</option>
                <option value="emulsion">乳液</option>
                <option value="cream">クリーム</option>
                <option value="cleanser">洗顔</option>
                <option value="foundation">ファンデーション</option>
                <option value="concealer">コンシーラー</option>
                <option value="powder">フェイスパウダー</option>
                <option value="eyeshadow">アイシャドウ</option>
                <option value="lipstick">リップ</option>
                <option value="sunscreen">日焼け止め</option>
                <option value="other">その他</option>
              </select>
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                体験談 *
              </label>
              <textarea
                id="content"
                name="content"
                required
                rows={8}
                value={formData.content}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                placeholder="使用した感想を自由に書いてください。肌の変化、使い心地、気づいたことなど..."
              />
            </div>
          </div>
        )}

        {/* ステップ2: 使用状況 */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">使用状況（任意）</h3>
            <p className="text-sm text-gray-600">より具体的な体験を共有するために、使用時の状況を教えてください。</p>
            
            <div>
              <label htmlFor="skinType" className="block text-sm font-medium text-gray-700">
                あなたの肌タイプ
              </label>
              <select
                id="skinType"
                name="skinType"
                value={formData.skinType}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">選択してください</option>
                <option value="normal">普通肌</option>
                <option value="dry">乾燥肌</option>
                <option value="oily">脂性肌</option>
                <option value="combination">混合肌</option>
                <option value="sensitive">敏感肌</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">使用した季節</label>
              <select
                value={formData.usageSituation.season || ''}
                onChange={(e) => handleNestedChange('usageSituation', 'season', e.target.value || undefined)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">選択してください</option>
                <option value="spring">春</option>
                <option value="summer">夏</option>
                <option value="autumn">秋</option>
                <option value="winter">冬</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">使用時間帯</label>
              <select
                value={formData.usageSituation.timeOfDay || ''}
                onChange={(e) => handleNestedChange('usageSituation', 'timeOfDay', e.target.value || undefined)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">選択してください</option>
                <option value="morning">朝</option>
                <option value="evening">夜</option>
                <option value="both">朝・夜両方</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">生理周期との関係</label>
              <select
                value={formData.usageSituation.menstrualCycle || ''}
                onChange={(e) => handleNestedChange('usageSituation', 'menstrualCycle', e.target.value || undefined)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">選択してください</option>
                <option value="before">生理前</option>
                <option value="during">生理中</option>
                <option value="after">生理後</option>
                <option value="none">関係なし</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">使用時の肌状態</label>
              <select
                value={formData.usageSituation.skinCondition || ''}
                onChange={(e) => handleNestedChange('usageSituation', 'skinCondition', e.target.value || undefined)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">選択してください</option>
                <option value="good">調子が良い</option>
                <option value="unstable">不安定</option>
                <option value="problematic">トラブル中</option>
              </select>
            </div>
          </div>
        )}

        {/* ステップ3: 体験の詳細 */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">体験の詳細（任意）</h3>
            <p className="text-sm text-gray-600">香りやテクスチャについて、より詳しく教えてください。</p>
            
            {/* 香り */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">香りについて</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">香りのタイプ</label>
                  <select
                    value={formData.experienceDetails.fragrance?.type || ''}
                    onChange={(e) => handleNestedChange('experienceDetails', 'fragrance', e.target.value || undefined, 'type')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="">選択してください</option>
                    <option value="none">無香料</option>
                    <option value="floral">フローラル系</option>
                    <option value="citrus">シトラス系</option>
                    <option value="herbal">ハーブ系</option>
                    <option value="chemical">化学的な香り</option>
                    <option value="other">その他</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">香りの強さ</label>
                  <select
                    value={formData.experienceDetails.fragrance?.intensity || ''}
                    onChange={(e) => handleNestedChange('experienceDetails', 'fragrance', e.target.value || undefined, 'intensity')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="">選択してください</option>
                    <option value="weak">弱い</option>
                    <option value="moderate">普通</option>
                    <option value="strong">強い</option>
                  </select>
                </div>
              </div>
            </div>

            {/* テクスチャ */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">テクスチャについて</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">テクスチャのタイプ</label>
                  <select
                    value={formData.experienceDetails.texture?.type || ''}
                    onChange={(e) => handleNestedChange('experienceDetails', 'texture', e.target.value || undefined, 'type')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="">選択してください</option>
                    <option value="watery">水のような</option>
                    <option value="gel">ジェル状</option>
                    <option value="cream">クリーム状</option>
                    <option value="oil">オイル状</option>
                    <option value="powder">パウダー状</option>
                    <option value="other">その他</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">伸びやすさ</label>
                  <select
                    value={formData.experienceDetails.texture?.spreadability || ''}
                    onChange={(e) => handleNestedChange('experienceDetails', 'texture', e.target.value || undefined, 'spreadability')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="">選択してください</option>
                    <option value="easy">よく伸びる</option>
                    <option value="moderate">普通</option>
                    <option value="difficult">伸びにくい</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">浸透の早さ</label>
                  <select
                    value={formData.experienceDetails.texture?.absorption || ''}
                    onChange={(e) => handleNestedChange('experienceDetails', 'texture', e.target.value || undefined, 'absorption')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="">選択してください</option>
                    <option value="fast">早い</option>
                    <option value="moderate">普通</option>
                    <option value="slow">遅い</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ステップ4: 感想とまとめ */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">感想とまとめ（任意）</h3>
            <p className="text-sm text-gray-600">使用後の肌状態や総合的な感想を教えてください。</p>
            
            {/* 使用後の肌状態 */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">使用後の肌状態</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">うるおい感</label>
                  <select
                    value={formData.experienceDetails.afterUse?.moisture || ''}
                    onChange={(e) => handleNestedChange('experienceDetails', 'afterUse', e.target.value || undefined, 'moisture')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="">選択してください</option>
                    <option value="very_dry">とても乾燥</option>
                    <option value="dry">乾燥</option>
                    <option value="normal">普通</option>
                    <option value="moist">しっとり</option>
                    <option value="very_moist">とてもしっとり</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">肌の手触り</label>
                  <select
                    value={formData.experienceDetails.afterUse?.texture || ''}
                    onChange={(e) => handleNestedChange('experienceDetails', 'afterUse', e.target.value || undefined, 'texture')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="">選択してください</option>
                    <option value="rough">ざらざら</option>
                    <option value="normal">普通</option>
                    <option value="smooth">なめらか</option>
                    <option value="very_smooth">とてもなめらか</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">使用感の快適さ</label>
                  <select
                    value={formData.experienceDetails.afterUse?.comfort || ''}
                    onChange={(e) => handleNestedChange('experienceDetails', 'afterUse', e.target.value || undefined, 'comfort')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="">選択してください</option>
                    <option value="uncomfortable">不快</option>
                    <option value="normal">普通</option>
                    <option value="comfortable">快適</option>
                    <option value="very_comfortable">とても快適</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 総合的な感想 */}
            <div>
              <label htmlFor="moodTag" className="block text-sm font-medium text-gray-700">
                総合的な感想
              </label>
              <select
                id="moodTag"
                name="moodTag"
                value={formData.moodTag}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">選択してください</option>
                <option value="disappointed">ちょっと残念</option>
                <option value="okay">まあまあ</option>
                <option value="good">良かった</option>
                <option value="love">また使いたい</option>
                <option value="perfect">完璧</option>
              </select>
            </div>
          </div>
        )}

        {/* ナビゲーションボタン */}
        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            前へ
          </button>
          
          {currentStep < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!isStepValid(currentStep)}
              className="px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              次へ
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading || !isStepValid(1)}
              className="px-6 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '投稿中...' : '投稿する'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}