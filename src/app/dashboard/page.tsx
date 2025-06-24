'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'

export default function DashboardPage() {
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
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">ダッシュボード</h1>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {user.displayName || user.userName}さん、こんにちは！
            </h2>
            <p className="text-gray-600">Usakaコスメティクス体験シェアサービスへようこそ。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-pink-800 mb-2">体験を投稿</h3>
              <p className="text-pink-600 text-sm mb-3">あなたのコスメ体験をシェアしませんか？</p>
              <Link
                href="/posts/new"
                className="inline-block bg-pink-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-pink-700 transition-colors"
              >
                新しい体験を投稿
              </Link>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-800 mb-2">体験を見る</h3>
              <p className="text-blue-600 text-sm mb-3">
                他のユーザーの体験をチェックしてみましょう。
              </p>
              <Link
                href="/posts"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                体験を見る
              </Link>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-green-800 mb-2">プロフィール</h3>
              <p className="text-green-600 text-sm mb-3">
                あなたのプロフィール情報を確認・編集できます。
              </p>
              <a
                href="/profile"
                className="inline-block bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
              >
                プロフィールを見る
              </a>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 mb-3">アカウント情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">ユーザー名:</span>
                <span className="ml-2 text-gray-900">{user.userName}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">メールアドレス:</span>
                <span className="ml-2 text-gray-900">{user.email}</span>
              </div>
              {user.displayName && (
                <div>
                  <span className="font-medium text-gray-600">表示名:</span>
                  <span className="ml-2 text-gray-900">{user.displayName}</span>
                </div>
              )}
              {user.skinType && (
                <div>
                  <span className="font-medium text-gray-600">肌タイプ:</span>
                  <span className="ml-2 text-gray-900">
                    {user.skinType === 'normal' && '普通肌'}
                    {user.skinType === 'dry' && '乾燥肌'}
                    {user.skinType === 'oily' && '脂性肌'}
                    {user.skinType === 'combination' && '混合肌'}
                    {user.skinType === 'sensitive' && '敏感肌'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
