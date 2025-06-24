import React from 'react'
import Link from 'next/link'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ダッシュボード</h1>
          <p className="text-gray-600">Usakaコスメティクス体験シェアサービスへようこそ。</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">体験を投稿する</h2>
            <p className="text-gray-600 mb-4">あなたのコスメ体験をシェアしませんか？</p>
            <Link
              href="/posts/new"
              className="bg-pink-600 text-white hover:bg-pink-700 px-6 py-3 rounded-full text-sm font-medium transition-colors inline-flex items-center justify-center"
            >
              投稿する
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">体験談を見る</h2>
            <p className="text-gray-600 mb-4">みんなの体験談を参考にしよう</p>
            <Link
              href="/posts"
              className="border border-pink-600 text-pink-600 hover:bg-pink-50 px-6 py-3 rounded-full text-sm font-medium transition-colors inline-flex items-center justify-center"
            >
              体験談を見る
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">最近の活動</h2>
          <p className="text-gray-600">あなたの投稿や気になった体験談がここに表示されます。</p>
        </div>
      </div>
    </div>
  )
}
