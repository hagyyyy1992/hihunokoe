'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import PostForm from '@/components/forms/PostForm'
import DraggableGuidelineModal from '@/components/ui/draggable-guideline-modal'

export default function NewPostPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

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

        <DraggableGuidelineModal />
      </div>
    </div>
  )
}
