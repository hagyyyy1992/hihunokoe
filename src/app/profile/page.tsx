'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SKIN_TYPE_OPTIONS, GENDER_OPTIONS, ALLERGY_OPTIONS } from '@/lib/constants/profile'

function ProfilePageContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showUpdateMessage, setShowUpdateMessage] = useState(false)

  useEffect(() => {
    // ページロード時にスクロール位置をトップに設定
    window.scrollTo(0, 0)

    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    // URLパラメータから更新フラグを確認
    if (searchParams.get('updated') === 'true') {
      setShowUpdateMessage(true)
      // メッセージを表示後、URLパラメータを削除
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)

      // 3秒後にメッセージを非表示
      const timer = setTimeout(() => {
        setShowUpdateMessage(false)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [searchParams])

  const getSkinTypeLabel = (value: string) => {
    const option = SKIN_TYPE_OPTIONS.find(opt => opt.value === value)
    return option ? option.label : ''
  }

  const getGenderLabel = (value: string) => {
    const option = GENDER_OPTIONS.find(opt => opt.value === value)
    return option ? option.label : ''
  }

  const getAllergyLabel = (value: string) => {
    return ALLERGY_OPTIONS[value as keyof typeof ALLERGY_OPTIONS] || value
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
        {/* 更新成功メッセージ */}
        {showUpdateMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm font-medium">プロフィールを更新しました</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">プロフィール</h1>
            <Button
              onClick={() => router.push('/profile/edit')}
              variant="outline"
              size="sm"
              data-testid="edit-profile-button"
            >
              編集
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-apple-50 to-apple-100 rounded-lg border border-apple-200">
              <div className="w-20 h-20 rounded-full bg-apple-100 flex items-center justify-center border-4 border-white shadow-lg">
                <span className="text-apple-600 text-2xl font-bold">
                  {(user.userName || '').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{user.userName}</h2>
                {user.skinType && (
                  <div className="mt-1">
                    <Badge variant="lavender" className="text-sm">
                      {getSkinTypeLabel(user.skinType)}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                基本情報
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-black rounded-full mr-2"></div>
                  <div>
                    <span className="text-xs text-gray-500">ユーザー名</span>
                    <p className="text-sm font-medium text-gray-900">{user.userName}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-black rounded-full mr-2"></div>
                  <div>
                    <span className="text-xs text-gray-500">メールアドレス</span>
                    <p className="text-sm font-medium text-gray-900">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-black rounded-full mr-2"></div>
                  <div>
                    <span className="text-xs text-gray-500">肌タイプ</span>
                    <p className="text-sm font-medium text-gray-900">
                      {getSkinTypeLabel(user.skinType || '') || '未設定'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-black rounded-full mr-2"></div>
                  <div>
                    <span className="text-xs text-gray-500">生年月日</span>
                    <p className="text-sm font-medium text-gray-900">
                      {user.birthDate
                        ? new Date(user.birthDate).toLocaleDateString('ja-JP')
                        : '未設定'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-black rounded-full mr-2"></div>
                  <div>
                    <span className="text-xs text-gray-500">性別</span>
                    <p className="text-sm font-medium text-gray-900">
                      {getGenderLabel(user.gender || '') || '未設定'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-black rounded-full mr-2"></div>
                  <div>
                    <span className="text-xs text-gray-500">アレルギー</span>
                    <p className="text-sm font-medium text-gray-900">
                      {(() => {
                        const allergyLabels: string[] = []
                        if (
                          user.allergies &&
                          Array.isArray(user.allergies) &&
                          user.allergies.length > 0
                        ) {
                          allergyLabels.push(...user.allergies.map(a => getAllergyLabel(String(a))))
                        }
                        if (user.allergiesOther) {
                          allergyLabels.push(user.allergiesOther)
                        }
                        return allergyLabels.join('、') || '未設定'
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* アカウント設定セクション */}
            <div className="border-t border-gray-200 pt-3 mt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">アカウント設定</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700 mb-3">
                  アカウントを削除すると、すべての投稿が永久に削除されます。この操作は取り消すことができません。
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
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-600">読み込み中...</div>
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  )
}
