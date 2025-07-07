'use client'

import { useState } from 'react'
import Link from 'next/link'
import PostCard from '@/components/ui/PostCard'
import { useQuery } from '@apollo/client'
import { GET_POSTS } from '@/graphql/queries/post'

interface PostNode {
  id: string
  title: string
  content: string
  cosmeticName: string
  cosmeticCategory?: string
  skinType?: string
  moodTag?: string
  viewCount: number
  empathyCount: number
  createdAt: string
  user: {
    id: string
    displayName: string
    profileImageUrl?: string
  }
  empathies: Array<{
    id: string
    empathyType: string
    user: {
      id: string
    }
  }>
  _count: {
    comments: number
  }
}

interface PostData {
  posts: {
    edges: Array<{
      cursor: string
      node: PostNode
    }>
    pageInfo: {
      hasNextPage: boolean
      endCursor?: string
    }
    totalCount: number
  }
}

export default function PostsPage() {
  const [filters, setFilters] = useState({
    skinType: '',
    cosmeticCategory: '',
    moodTag: '',
    search: '',
  })

  const { data, loading, error, fetchMore } = useQuery<PostData>(GET_POSTS, {
    variables: {
      first: 10,
      filter: {
        ...(filters.skinType && { skinType: filters.skinType }),
        ...(filters.cosmeticCategory && { cosmeticCategory: filters.cosmeticCategory }),
        ...(filters.moodTag && { moodTag: filters.moodTag }),
        ...(filters.search && { search: filters.search }),
      },
      orderBy: 'CREATED_AT_DESC' as const,
    },
  })

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleLoadMore = () => {
    if (data?.posts.pageInfo.hasNextPage) {
      fetchMore({
        variables: {
          after: data.posts.pageInfo.endCursor,
        },
      })
    }
  }

  const posts = data?.posts.edges.map(edge => edge.node) || []

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
            className="bg-apple-600 text-white hover:bg-apple-700 px-6 py-3 rounded-full text-sm font-medium transition-colors"
          >
            体験を投稿する
          </Link>
        </div>

        {/* フィルターセクション */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">絞り込み検索</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">肌タイプ</label>
              <select
                value={filters.skinType}
                onChange={e => handleFilterChange('skinType', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-apple-500 focus:border-apple-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリ</label>
              <select
                value={filters.cosmeticCategory}
                onChange={e => handleFilterChange('cosmeticCategory', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-apple-500 focus:border-apple-500"
                data-testid="category-filter"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">感想</label>
              <select
                value={filters.moodTag}
                onChange={e => handleFilterChange('moodTag', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-apple-500 focus:border-apple-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">キーワード検索</label>
              <input
                type="text"
                value={filters.search}
                onChange={e => handleFilterChange('search', e.target.value)}
                placeholder="コスメ名や体験談で検索"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-apple-500 focus:border-apple-500"
              />
            </div>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            投稿の取得に失敗しました: {error.message}
          </div>
        )}

        {/* ローディング表示 */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-apple-600"></div>
          </div>
        )}

        {/* 投稿一覧 */}
        {!loading && (
          <>
            {posts.length > 0 ? (
              <>
                <div className="grid gap-6 mb-8">
                  {posts.map(post => (
                    <PostCard
                      key={post.id}
                      post={{
                        id: post.id,
                        title: post.title,
                        content: post.content,
                        cosmeticName: post.cosmeticName,
                        cosmeticCategory: post.cosmeticCategory || undefined,
                        skinType: post.skinType || undefined,
                        moodTag: post.moodTag || undefined,
                        viewCount: post.viewCount,
                        empathyCount: post.empathyCount,
                        publishedAt: new Date(post.createdAt).toISOString(),
                        user: {
                          ...post.user,
                          userName: post.user.displayName,
                        },
                        _count: {
                          empathies: post.empathyCount,
                          comments: 0,
                        },
                      }}
                    />
                  ))}
                </div>

                {/* もっと見るボタン */}
                {data?.posts.pageInfo.hasNextPage && (
                  <div className="flex justify-center">
                    <button
                      onClick={handleLoadMore}
                      className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      もっと見る
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">投稿がありません</h3>
                <p className="mt-1 text-sm text-gray-500">
                  条件に一致する投稿が見つかりませんでした。
                </p>
                <div className="mt-6">
                  <Link
                    href="/posts/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-apple-600 hover:bg-apple-700"
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
