'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SKIN_TYPE_OPTIONS, GENDER_OPTIONS, ALLERGY_OPTIONS } from '@/lib/constants/profile'

export default function ProfileEditPage() {
  const { user, loading, updateProfile } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    userName: '',
    skinType: '',
    birthDate: '',
    gender: '',
    allergies: [] as string[],
    allergiesOther: '',
  })
  const [formErrors, setFormErrors] = useState({
    userName: '',
    skinType: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [updateMessage, setUpdateMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    // ページロード時にスクロール位置をトップに設定
    window.scrollTo(0, 0)

    if (!loading && !user) {
      router.push('/auth/login')
    }

    if (user) {
      setFormData({
        userName: user.userName || '',
        skinType: user.skinType || '',
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '',
        gender: user.gender || '',
        allergies: Array.isArray(user.allergies) ? user.allergies : [],
        allergiesOther: user.allergiesOther || '',
      })
    }
  }, [user, loading, router])

  const validateForm = () => {
    const errors = {
      userName: '',
      skinType: '',
    }
    let isValid = true

    if (formData.userName.trim().length < 3) {
      errors.userName = 'ユーザー名は3文字以上で入力してください'
      isValid = false
    }

    if (formData.userName.trim().length > 50) {
      errors.userName = 'ユーザー名は50文字以内で入力してください'
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdateMessage({ type: '', text: '' })

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // 空の文字列をnullに変換（userNameは必須なので除外）
      const submitData = {
        userName: formData.userName,
        skinType: formData.skinType || null,
        birthDate: formData.birthDate || null,
        gender: formData.gender || null,
        allergies: formData.allergies.length > 0 ? formData.allergies : [], // 空の配列を送信
        allergiesOther: formData.allergiesOther || null,
      }

      await updateProfile(submitData)

      // プロフィールページにメッセージ付きでリダイレクト
      router.push('/profile?updated=true')
    } catch (error) {
      console.error('Profile update error:', error)
      setUpdateMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'プロフィールの更新に失敗しました',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/profile')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">プロフィール編集</h1>

          {updateMessage.text && (
            <div
              className={`mb-4 p-3 rounded-md ${
                updateMessage.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {updateMessage.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Input
                label="ユーザー名"
                name="userName"
                value={formData.userName}
                onChange={handleInputChange}
                error={formErrors.userName}
                required
                data-testid="username-input"
              />

              <div className="form-group">
                <label htmlFor="skinType" className="form-label">
                  肌タイプ
                </label>
                <select
                  id="skinType"
                  name="skinType"
                  value={formData.skinType}
                  onChange={handleInputChange}
                  className="input"
                  data-testid="skin-type-select"
                >
                  {SKIN_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="birthDate" className="form-label">
                  生年月日
                </label>
                <input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  className="input"
                  data-testid="birth-date-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender" className="form-label">
                  性別
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="input"
                  data-testid="gender-select"
                >
                  {GENDER_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="allergies" className="form-label">
                  アレルギー（複数選択可）
                </label>
                <select
                  id="allergies"
                  name="allergies"
                  multiple
                  value={formData.allergies}
                  onChange={e => {
                    const selectedOptions = Array.from(
                      e.target.selectedOptions,
                      option => option.value
                    )
                    setFormData(prev => ({
                      ...prev,
                      allergies: selectedOptions,
                    }))
                  }}
                  className="input"
                  size={5}
                  data-testid="allergies-select"
                >
                  {Object.entries(ALLERGY_OPTIONS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Ctrl/Cmdキーを押しながらクリックで複数選択
                </p>
                {formData.allergies.includes('other') && (
                  <div className="mt-2">
                    <input
                      name="allergiesOther"
                      type="text"
                      value={formData.allergiesOther}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="その他のアレルギーを入力してください"
                      data-testid="allergies-other-input"
                    />
                  </div>
                )}
              </div>

              <div className="flex space-x-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  data-testid="save-profile-button"
                >
                  保存
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancel}
                  data-testid="cancel-edit-button"
                >
                  キャンセル
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
