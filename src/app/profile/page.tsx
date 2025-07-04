'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

export default function ProfilePage() {
  const { user, loading, updateProfile } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    userName: '',
    skinType: '',
  })
  const [formErrors, setFormErrors] = useState({
    userName: '',
    skinType: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [updateMessage, setUpdateMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }

    if (user) {
      setFormData({
        userName: user.userName || '',
        skinType: user.skinType || '',
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
      await updateProfile(formData)
      setUpdateMessage({ type: 'success', text: 'プロフィールを更新しました' })
      setIsEditing(false)
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

  const skinTypeOptions = [
    { value: '', label: '選択してください' },
    { value: 'normal', label: '普通肌' },
    { value: 'dry', label: '乾燥肌' },
    { value: 'oily', label: '脂性肌' },
    { value: 'combination', label: '混合肌' },
    { value: 'sensitive', label: '敏感肌' },
  ]

  const getSkinTypeLabel = (value: string) => {
    const option = skinTypeOptions.find(opt => opt.value === value)
    return option ? option.label : ''
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">プロフィール</h1>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
                data-testid="edit-profile-button"
              >
                編集
              </Button>
            )}
          </div>

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

          {isEditing ? (
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
                    {skinTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
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
                    onClick={() => {
                      setIsEditing(false)
                      setFormData({
                        userName: user.userName || '',
                        skinType: user.skinType || '',
                      })
                      setFormErrors({
                        userName: '',
                        skinType: '',
                      })
                    }}
                    data-testid="cancel-edit-button"
                  >
                    キャンセル
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center space-x-6 p-6 bg-gradient-to-r from-apple-50 to-apple-100 rounded-lg border border-apple-200">
                <div className="w-24 h-24 rounded-full bg-apple-100 flex items-center justify-center border-4 border-white shadow-lg">
                  <span className="text-apple-600 text-2xl font-bold">
                    {(formData.userName || '').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{formData.userName}</h2>
                  {formData.skinType && (
                    <div className="mt-2">
                      <Badge variant="lavender" className="text-sm">
                        {getSkinTypeLabel(formData.skinType)}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                    基本情報
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-apple-500 rounded-full mr-3"></div>
                      <div>
                        <span className="text-sm text-gray-600">ユーザー名</span>
                        <p className="font-medium text-gray-900">{formData.userName}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                    アカウント情報
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <div>
                        <span className="text-sm text-gray-600">メールアドレス</span>
                        <p className="font-medium text-gray-900">{user.email}</p>
                      </div>
                    </div>
                    {formData.skinType && (
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <div>
                          <span className="text-sm text-gray-600">肌タイプ</span>
                          <p className="font-medium text-gray-900">
                            {getSkinTypeLabel(formData.skinType)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* アカウント設定セクション */}
              <div className="border-t border-gray-200 pt-6 mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">アカウント設定</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700 mb-4">
                    アカウントを削除すると、すべての投稿、コメント、共感データが永久に削除されます。この操作は取り消すことができません。
                  </p>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => router.push('/account/delete')}
                    data-testid="delete-account-button"
                  >
                    アカウントを削除
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
