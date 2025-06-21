'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import PostCard from '@/components/ui/PostCard'

interface Post {
  id: string
  title: string
  content: string
  cosmeticName: string
  cosmeticCategory?: string
  skinType?: string
  moodTag?: string
  publishedAt: string
  empathyCount: number
  viewCount: number
  user: {
    id: string
    userName: string
    displayName?: string
    skinType?: string
  }
  _count: {
    empathies: number
    comments: number
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // フィルター状態
  const [filters, setFilters] = useState({
    skinType: '',
    category: '',
    moodTag: '',
    search: '',
    page: 1,
  })

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.skinType) params.append('skinType', filters.skinType)
      if (filters.category) params.append('category', filters.category)
      if (filters.moodTag) params.append('moodTag', filters.moodTag)
      if (filters.search) params.append('search', filters.search)
      params.append('page', filters.page.toString())
      params.append('limit', '10')

      const response = await fetch(`/api/posts?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '投稿の取得に失敗しました')
      }

      setPosts(data.posts)
      setPagination(data.pagination)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '投稿の取得に失敗しました'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchPosts()
  }, [filters, fetchPosts])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // フィルター変更時はページを1に戻す
    }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">体験談を見る</h1>
            <p className="mt-2 text-gray-600">
              みんなの化粧品体験を参考にして、自分に合うアイテムを見つけよう
            </p>
          </div>
          <Link
            href="/posts/new"
            className="bg-pink-600 text-white hover:bg-pink-700 px-6 py-3 rounded-full text-sm font-medium transition-colors"
          >
            体験を投稿する
          </Link>
        </div>

        {/* フィルターセクション */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">絞り込み検索</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                肌タイプ
              </label>
              <select
                value={filters.skinType}
                onChange={(e) => handleFilterChange('skinType', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">すべて</option>
                <option value="normal">普通肌</option>
                <option value="dry">乾燥肌</option>
                <option value="oily">脂性肌</option>
                <option value="combination">混合肌</option>
                <option value="sensitive">敏感肌</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                カテゴリ
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">すべて</option>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                感想
              </label>
              <select
                value={filters.moodTag}
                onChange={(e) => handleFilterChange('moodTag', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">すべて</option>
                <option value="disappointed">ちょっと残念</option>
                <option value="okay">まあまあ</option>
                <option value="good">良かった</option>
                <option value="love">また使いたい</option>
                <option value="perfect">完璧</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                キーワード検索
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="コスメ名や体験談で検索"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* ローディング表示 */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
          </div>
        )}

        {/* 投稿一覧 */}
        {!loading && (
          <>
            {posts.length > 0 ? (
              <>
                <div className="grid gap-6 mb-8">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>

                {/* ページネーション */}
                {pagination && pagination.pages > 1 && (
                  <div className="flex justify-center items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      前へ
                    </button>
                    
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          page === pagination.page
                            ? 'bg-pink-600 text-white'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      次へ
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">投稿がありません</h3>
                <p className="mt-1 text-sm text-gray-500">
                  条件に一致する投稿が見つかりませんでした。
                </p>
                <div className="mt-6">
                  <Link
                    href="/posts/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700"
                  >
                    最初の投稿をする
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}