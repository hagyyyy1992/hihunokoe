'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import PostForm from '@/components/forms/PostForm'

export default function NewPostPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showGuideline, setShowGuideline] = useState(true)

  useEffect(() => {
    // ページロード時にスクロール位置をトップに設定
    window.scrollTo(0, 0)

    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

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

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="text-center mb-6 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
            体験談を投稿する
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
            あなたの化粧品体験が、同じ悩みを持つ誰かの参考になります。
            気軽にリアルな感想を共有してください。
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8">
          <PostForm />
        </div>

        {/* 投稿ガイドライン（固定表示） */}
        {showGuideline ? (
          <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-80 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 shadow-lg z-50">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xs sm:text-sm font-medium text-blue-800">投稿ガイドライン</h3>
              <button
                onClick={() => setShowGuideline(false)}
                className="text-blue-600 hover:text-blue-800 -mt-1 -mr-1 cursor-pointer"
                aria-label="閉じる"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• 個人の体験談として、正直な感想を書いてください</li>
              <li>• 「合わなかった」体験も大切な情報です</li>
              <li>• 他の人を批判したり、攻撃的な表現は避けてください</li>
              <li>• 商品の宣伝や営業目的の投稿はご遠慮ください</li>
            </ul>
          </div>
        ) : (
          <button
            onClick={() => setShowGuideline(true)}
            className="fixed bottom-4 right-4 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition-colors z-50 cursor-pointer"
            aria-label="投稿ガイドラインを表示"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
