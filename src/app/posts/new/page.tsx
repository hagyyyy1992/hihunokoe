'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import PostForm from '@/components/forms/PostForm'

export default function NewPostPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            体験談を投稿する
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            あなたの化粧品体験が、同じ悩みを持つ誰かの参考になります。
            気軽にリアルな感想を共有してください。
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
          <PostForm />
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-sm font-medium text-blue-800 mb-2">投稿ガイドライン</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 個人の体験談として、正直な感想を書いてください</li>
            <li>• 「合わなかった」体験も大切な情報です</li>
            <li>• 他の人を批判したり、攻撃的な表現は避けてください</li>
            <li>• 商品の宣伝や営業目的の投稿はご遠慮ください</li>
          </ul>
        </div>
      </div>
    </div>
  )
}