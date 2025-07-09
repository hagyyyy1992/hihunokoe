'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SkinType, CosmeticCategory, MoodTag, UsageSituation, ExperienceDetails } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MoodTag as MoodTagComponent } from '@/components/ui/MoodTag'
import { useMutation } from '@apollo/client'
import { CREATE_POST, UPDATE_POST, DELETE_POST } from '@/graphql/queries/post'

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

interface PostFormProps {
  initialData?: PostFormData
  postId?: string
  isEditMode?: boolean
}

export default function PostForm({ initialData, postId, isEditMode = false }: PostFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [canSubmit, setCanSubmit] = useState(false)

  const [createPost] = useMutation(CREATE_POST)
  const [updatePost] = useMutation(UPDATE_POST)
  const [deletePost] = useMutation(DELETE_POST)

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

  // 編集モードの場合、初期データをセット
  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    }
  }, [initialData])

  // ステップ変更を監視
  useEffect(() => {
    if (currentStep === 4) {
      // ステップ4に到達時、全てのアクティブな要素をログ
      setTimeout(() => {
        // ステップ4に到達してから一定時間後にのみ送信を許可
        setTimeout(() => {
          setCanSubmit(true)
        }, 500)
      }, 100)
    } else {
      setCanSubmit(false)
    }
  }, [currentStep])

  // エンターキーでステップ移動を処理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const target = e.target as HTMLElement
      const isTextarea = target.tagName === 'TEXTAREA'
      const isSubmitButton = target.getAttribute('data-testid') === 'publish-button'

      // テキストエリアと投稿ボタン以外でEnterキーが押された場合
      if (!isTextarea && !isSubmitButton) {
        e.preventDefault()

        // 現在のステップが4未満で、バリデーションが通る場合は次のステップへ
        if (currentStep < 4 && isStepValid(currentStep)) {
          nextStep()
        }
      }
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleNestedChange = (
    section: 'usageSituation' | 'experienceDetails',
    field: string,
    value: unknown,
    subField?: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: subField
          ? {
              ...((prev[section] as Record<string, unknown>)?.[field] as Record<string, unknown>),
              [subField]: value,
            }
          : value,
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // ステップ4以外では投稿を許可しない
    if (currentStep !== 4) {
      console.warn('Submit attempted on step', currentStep, '- blocking')
      return
    }

    // 送信が許可されていない場合はブロック
    if (!canSubmit) {
      console.warn('Submit attempted before canSubmit is true - blocking')
      return
    }

    // 明示的な投稿ボタンクリック以外は許可しない
    const submitter = (e.nativeEvent as SubmitEvent)?.submitter as HTMLButtonElement
    if (!submitter || submitter.getAttribute('data-testid') !== 'publish-button') {
      console.warn('Submit attempted without publish button - blocking')
      return
    }

    setError('')
    setLoading(true)

    const input = {
      title: formData.title,
      content: formData.content,
      cosmeticName: formData.cosmeticName,
      cosmeticCategory: formData.cosmeticCategory || undefined,
      skinType: formData.skinType || undefined,
      moodTag: formData.moodTag || undefined,
      usageSituation:
        Object.keys(formData.usageSituation).length > 0 ? formData.usageSituation : undefined,
      experienceDetails:
        Object.keys(formData.experienceDetails).length > 0 ? formData.experienceDetails : undefined,
    }

    try {
      if (isEditMode && postId) {
        await updatePost({
          variables: { id: postId, input },
        })
        router.push(`/posts/${postId}`)
      } else {
        const result = await createPost({
          variables: { input },
        })
        if (result.data?.createPost) {
          router.push(`/posts/${result.data.createPost.id}`)
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '投稿の処理に失敗しました'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
      // ステップ変更後、ページトップにスクロール
      window.scrollTo(0, 0)
      // ステップ変更後、フォーカスをリセットして意図しないサブミットを防ぐ
      setTimeout(() => {
        // 投稿ボタンへのフォーカスを防ぐ
        const publishButton = document.querySelector(
          '[data-testid="publish-button"]'
        ) as HTMLElement
        if (publishButton && document.activeElement === publishButton) {
          publishButton.blur()
        }

        // ステップ4の場合は、最初のselect要素にフォーカスを移動
        if (currentStep + 1 === 4) {
          const firstSelect = document.querySelector('#moodTag') as HTMLSelectElement
          if (firstSelect) {
            // フォーカスを移動するが、selectしない
            firstSelect.focus({ preventScroll: true })
          }
        }
      }, 100)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      // ステップ変更後、ページトップにスクロール
      window.scrollTo(0, 0)
    }
  }

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return (
          formData.title && formData.cosmeticName && formData.content && formData.cosmeticCategory
        )
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

  const handleDelete = async () => {
    if (!postId || !isEditMode) return

    setLoading(true)
    setError('')

    try {
      await deletePost({
        variables: { id: postId },
      })
      router.push('/posts')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '投稿の削除に失敗しました'
      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* ステップインジケーター */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-center space-x-2 sm:space-x-4">
          {[1, 2, 3, 4].map((step, index) => (
            <React.Fragment key={step}>
              <div
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                  step <= currentStep ? 'bg-apple-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step}
              </div>
              {index < 3 && (
                <div
                  className={`w-8 sm:w-16 h-1 ${step < currentStep ? 'bg-apple-600' : 'bg-gray-200'}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="mt-2 text-xs sm:text-sm text-gray-600 text-center">
          {currentStep === 1 && '基本情報'}
          {currentStep === 2 && '使用状況'}
          {currentStep === 3 && '体験の詳細'}
          {currentStep === 4 && '感想とまとめ'}
        </div>
      </div>

      <form
        onSubmit={e => {
          handleSubmit(e)
        }}
        onKeyDown={handleKeyDown}
        className="space-y-4 sm:space-y-6"
      >
        {error && <div className="alert alert-error">{error}</div>}

        {/* ステップ1: 基本情報 */}
        {currentStep === 1 && (
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">基本情報</h3>

            <Input
              label="タイトル"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleInputChange}
              placeholder="例: ○○クリームを敏感肌で試してみました"
              showPlaceholderHint
              data-testid="post-title-input"
              aria-label="タイトル"
              onInvalid={e => {
                const element = e.target as HTMLInputElement
                element.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }}
            />

            <Input
              label="使用したコスメ名"
              id="cosmeticName"
              name="cosmeticName"
              required
              value={formData.cosmeticName}
              onChange={handleInputChange}
              placeholder="例: ○○ブランド モイスチャークリーム"
              showPlaceholderHint
              aria-label="使用したコスメ名"
            />

            <div className="form-group">
              <label htmlFor="cosmeticCategory" className="form-label">
                コスメカテゴリ <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                id="cosmeticCategory"
                name="cosmeticCategory"
                value={formData.cosmeticCategory}
                onChange={handleInputChange}
                className="select"
                data-testid="category-select"
                required
              >
                <option value="">選択してください</option>
                <option value="skincare">スキンケア</option>
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

            <div className="form-group">
              <label htmlFor="content" className="form-label">
                体験談 <span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                required
                rows={8}
                value={formData.content}
                onChange={handleInputChange}
                className="textarea"
                placeholder="使用した感想を自由に書いてください。肌の変化、使い心地、気づいたことなど..."
                data-testid="post-content-textarea"
                onInvalid={e => {
                  // バリデーションエラー時に要素を表示領域にスクロール
                  const element = e.target as HTMLTextAreaElement
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }}
              />
            </div>
          </div>
        )}

        {/* ステップ2: 使用状況 */}
        {currentStep === 2 && (
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">使用状況（任意）</h3>
            <p className="text-xs sm:text-sm text-gray-600">
              より具体的な体験を共有するために、使用時の状況を教えてください。
            </p>

            <div className="form-group">
              <label htmlFor="skinType" className="form-label">
                あなたの肌タイプ
              </label>
              <select
                id="skinType"
                name="skinType"
                value={formData.skinType}
                onChange={handleInputChange}
                className="select"
              >
                <option value="">選択してください</option>
                <option value="normal">普通肌</option>
                <option value="dry">乾燥肌</option>
                <option value="oily">脂性肌</option>
                <option value="combination">混合肌</option>
                <option value="sensitive">敏感肌</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">使用した季節</label>
              <select
                value={formData.usageSituation.season || ''}
                onChange={e =>
                  handleNestedChange('usageSituation', 'season', e.target.value || undefined)
                }
                className="select"
              >
                <option value="">選択してください</option>
                <option value="spring">春</option>
                <option value="summer">夏</option>
                <option value="autumn">秋</option>
                <option value="winter">冬</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">使用時間帯</label>
              <select
                value={formData.usageSituation.timeOfDay || ''}
                onChange={e =>
                  handleNestedChange('usageSituation', 'timeOfDay', e.target.value || undefined)
                }
                className="select"
              >
                <option value="">選択してください</option>
                <option value="morning">朝</option>
                <option value="evening">夜</option>
                <option value="both">朝・夜両方</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">生理周期との関係</label>
              <select
                value={formData.usageSituation.menstrualCycle || ''}
                onChange={e =>
                  handleNestedChange(
                    'usageSituation',
                    'menstrualCycle',
                    e.target.value || undefined
                  )
                }
                className="select"
              >
                <option value="">選択してください</option>
                <option value="before">生理前</option>
                <option value="during">生理中</option>
                <option value="after">生理後</option>
                <option value="none">関係なし</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">使用時の肌状態</label>
              <select
                value={formData.usageSituation.skinCondition || ''}
                onChange={e =>
                  handleNestedChange('usageSituation', 'skinCondition', e.target.value || undefined)
                }
                className="select"
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
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">体験の詳細（任意）</h3>
            <p className="text-xs sm:text-sm text-gray-600">
              香りやテクスチャについて、より詳しく教えてください。
            </p>

            {/* 香り */}
            <div className="border rounded-lg p-3 sm:p-4">
              <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2 sm:mb-3">
                香りについて
              </h4>
              <div className="space-y-2 sm:space-y-3">
                <div className="form-group">
                  <label className="form-label">香りのタイプ</label>
                  <select
                    value={formData.experienceDetails.fragrance?.type || ''}
                    onChange={e =>
                      handleNestedChange(
                        'experienceDetails',
                        'fragrance',
                        e.target.value || undefined,
                        'type'
                      )
                    }
                    className="select"
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

                <div className="form-group">
                  <label className="form-label">香りの強さ</label>
                  <select
                    value={formData.experienceDetails.fragrance?.intensity || ''}
                    onChange={e =>
                      handleNestedChange(
                        'experienceDetails',
                        'fragrance',
                        e.target.value || undefined,
                        'intensity'
                      )
                    }
                    className="select"
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
            <div className="border rounded-lg p-3 sm:p-4">
              <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2 sm:mb-3">
                テクスチャについて
              </h4>
              <div className="space-y-2 sm:space-y-3">
                <div className="form-group">
                  <label className="form-label">テクスチャのタイプ</label>
                  <select
                    value={formData.experienceDetails.texture?.type || ''}
                    onChange={e =>
                      handleNestedChange(
                        'experienceDetails',
                        'texture',
                        e.target.value || undefined,
                        'type'
                      )
                    }
                    className="select"
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

                <div className="form-group">
                  <label className="form-label">伸びやすさ</label>
                  <select
                    value={formData.experienceDetails.texture?.spreadability || ''}
                    onChange={e =>
                      handleNestedChange(
                        'experienceDetails',
                        'texture',
                        e.target.value || undefined,
                        'spreadability'
                      )
                    }
                    className="select"
                  >
                    <option value="">選択してください</option>
                    <option value="easy">よく伸びる</option>
                    <option value="moderate">普通</option>
                    <option value="difficult">伸びにくい</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">浸透の早さ</label>
                  <select
                    value={formData.experienceDetails.texture?.absorption || ''}
                    onChange={e =>
                      handleNestedChange(
                        'experienceDetails',
                        'texture',
                        e.target.value || undefined,
                        'absorption'
                      )
                    }
                    className="select"
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
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">感想とまとめ（任意）</h3>
            <p className="text-xs sm:text-sm text-gray-600">
              使用後の肌状態や総合的な感想を教えてください。
            </p>

            {/* 使用後の肌状態 */}
            <div className="border rounded-lg p-3 sm:p-4">
              <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2 sm:mb-3">
                使用後の肌状態
              </h4>
              <div className="space-y-2 sm:space-y-3">
                <div className="form-group">
                  <label className="form-label">うるおい感</label>
                  <select
                    value={formData.experienceDetails.afterUse?.moisture || ''}
                    onChange={e =>
                      handleNestedChange(
                        'experienceDetails',
                        'afterUse',
                        e.target.value || undefined,
                        'moisture'
                      )
                    }
                    className="select"
                  >
                    <option value="">選択してください</option>
                    <option value="very_dry">とても乾燥</option>
                    <option value="dry">乾燥</option>
                    <option value="normal">普通</option>
                    <option value="moist">しっとり</option>
                    <option value="very_moist">とてもしっとり</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">肌の手触り</label>
                  <select
                    value={formData.experienceDetails.afterUse?.texture || ''}
                    onChange={e =>
                      handleNestedChange(
                        'experienceDetails',
                        'afterUse',
                        e.target.value || undefined,
                        'texture'
                      )
                    }
                    className="select"
                  >
                    <option value="">選択してください</option>
                    <option value="rough">ざらざら</option>
                    <option value="normal">普通</option>
                    <option value="smooth">なめらか</option>
                    <option value="very_smooth">とてもなめらか</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">使用感の快適さ</label>
                  <select
                    value={formData.experienceDetails.afterUse?.comfort || ''}
                    onChange={e =>
                      handleNestedChange(
                        'experienceDetails',
                        'afterUse',
                        e.target.value || undefined,
                        'comfort'
                      )
                    }
                    className="select"
                  >
                    <option value="">選択してください</option>
                    <option value="uncomfortable">不快</option>
                    <option value="normal">普通</option>
                    <option value="comfortable">快適</option>
                    <option value="very_comfortable">とても快適</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">効果の持続時間</label>
                  <select
                    value={formData.experienceDetails.afterUse?.duration || ''}
                    onChange={e =>
                      handleNestedChange(
                        'experienceDetails',
                        'afterUse',
                        e.target.value || undefined,
                        'duration'
                      )
                    }
                    className="select"
                  >
                    <option value="">選択してください</option>
                    <option value="short">短い（1-2時間）</option>
                    <option value="moderate">普通（3-6時間）</option>
                    <option value="long">長い（半日以上）</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 内容 */}
            <div className="form-group">
              <label htmlFor="content" className="form-label">
                内容
              </label>
              <textarea
                id="content"
                name="content"
                required
                value={formData.content}
                onChange={handleInputChange}
                rows={5}
                className="textarea"
                placeholder="使用感や効果について詳しく教えてください"
                aria-label="内容"
              />
            </div>

            {/* 総合的な感想 */}
            <div className="form-group">
              <label htmlFor="moodTag" className="form-label">
                総合的な感想
              </label>
              <select
                id="moodTag"
                name="moodTag"
                value={formData.moodTag}
                onChange={e => {
                  handleInputChange(e)
                }}
                onFocus={() => {}}
                className="select"
              >
                <option value="">選択してください</option>
                <option value="disappointed">ちょっと残念</option>
                <option value="okay">まあまあ</option>
                <option value="good">良かった</option>
                <option value="love">また使いたい</option>
                <option value="perfect">完璧</option>
              </select>
            </div>
            {formData.moodTag && (
              <div className="mt-2">
                <MoodTagComponent mood={formData.moodTag as MoodTag}>
                  {formData.moodTag === 'disappointed' && 'ちょっと残念'}
                  {formData.moodTag === 'okay' && 'まあまあ'}
                  {formData.moodTag === 'good' && '良かった'}
                  {formData.moodTag === 'love' && 'また使いたい'}
                  {formData.moodTag === 'perfect' && '完璧'}
                </MoodTagComponent>
              </div>
            )}
          </div>
        )}

        {/* 削除確認ダイアログ */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
                投稿を削除しますか？
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                この操作は取り消せません。本当に削除しますか？
              </p>
              <div className="flex justify-end space-x-2 sm:space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                >
                  キャンセル
                </Button>
                <Button type="button" variant="danger" onClick={handleDelete} loading={loading}>
                  削除する
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ナビゲーションボタン */}
        <div className="flex justify-between pt-4 sm:pt-6">
          {isEditMode && currentStep === 1 ? (
            <Button
              type="button"
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
            >
              削除
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1}>
              前へ
            </Button>
          )}

          {currentStep < 4 ? (
            <Button
              type="button"
              variant="primary"
              onClick={nextStep}
              disabled={!isStepValid(currentStep)}
            >
              次へ
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !isStepValid(1) || !canSubmit}
              loading={loading}
              data-testid="publish-button"
            >
              {isEditMode ? '更新する' : '投稿する'}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
