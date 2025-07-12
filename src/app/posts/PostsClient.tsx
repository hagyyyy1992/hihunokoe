'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import Link from 'next/link'
import PostCard from '@/components/ui/PostCard'
import { useQuery, useApolloClient } from '@apollo/client'
import { GET_POSTS } from '@/graphql/queries/post'
import { categoryLabels, skinTypeLabels, moodTagLabels } from '@/lib/constants/categories'

// クライアントサイド絞り込み用のヘルパー関数
interface FilterState {
  skinType?: string
  cosmeticCategory?: string
  moodTag?: string
  search?: string
}

const filterPosts = (posts: PostNode[], filters: FilterState) => {
  return posts.filter(post => {
    // 肌タイプフィルター
    if (filters.skinType && post.skinType !== filters.skinType) {
      return false
    }

    // カテゴリフィルター
    if (filters.cosmeticCategory && post.cosmeticCategory !== filters.cosmeticCategory) {
      return false
    }

    // 感想フィルター
    if (filters.moodTag && post.moodTag !== filters.moodTag) {
      return false
    }

    // キーワード検索（部分一致）
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const titleMatch = post.title.toLowerCase().includes(searchLower)
      const contentMatch = post.content.toLowerCase().includes(searchLower)
      const cosmeticMatch = post.cosmeticName.toLowerCase().includes(searchLower)

      if (!titleMatch && !contentMatch && !cosmeticMatch) {
        return false
      }
    }

    return true
  })
}

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
  commentCount: number
  createdAt: string
  user: {
    id: string
    displayName: string
    profileImageUrl?: string
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

interface PostsClientProps {
  initialData?: PostData
}

export default function PostsClient({ initialData }: PostsClientProps) {
  const apolloClient = useApolloClient()
  const [filters, setFilters] = useState({
    skinType: '',
    cosmeticCategory: '',
    moodTag: '',
    search: '',
  })
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [allPosts, setAllPosts] = useState<PostNode[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // 初期データをApollo Clientキャッシュに設定 & 全投稿データを取得
  useEffect(() => {
    if (initialData) {
      apolloClient.writeQuery({
        query: GET_POSTS,
        variables: {
          first: 10,
          filter: {},
          orderBy: 'CREATED_AT_DESC',
        },
        data: initialData,
      })
      setAllPosts(initialData.posts.edges.map(edge => edge.node))
    }
  }, [initialData, apolloClient])

  // サーバーサイド検索：複雑な検索クエリの場合のみ
  const needsServerSearch = debouncedSearch.length >= 2

  const { data, loading, error, fetchMore } = useQuery<PostData>(GET_POSTS, {
    variables: {
      first: 50, // より多くのデータを取得してクライアントサイドフィルタリング
      filter: needsServerSearch ? { search: debouncedSearch } : {},
      orderBy: 'CREATED_AT_DESC' as const,
    },
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: false,
    skip: !needsServerSearch && !!initialData, // 検索なし＆初期データありならスキップ
    onCompleted: result => {
      if (result?.posts?.edges) {
        setAllPosts(result.posts.edges.map(edge => edge.node))
      }
    },
  })

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }))
  }, [])

  // 検索のみデバウンス処理（他のフィルターは即座に適用）
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(filters.search)
    }, 300) // より短いデバウンス時間

    return () => clearTimeout(timeoutId)
  }, [filters.search])

  // すべての投稿データを追加取得
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore) return

    setIsLoadingMore(true)
    try {
      const currentData = data || initialData
      if (currentData?.posts.pageInfo.hasNextPage) {
        const result = await fetchMore({
          variables: {
            after: currentData.posts.pageInfo.endCursor,
          },
        })

        if (result.data?.posts?.edges) {
          setAllPosts(prev => [...prev, ...result.data.posts.edges.map(edge => edge.node)])
        }
      }
    } finally {
      setIsLoadingMore(false)
    }
  }, [data, initialData, fetchMore, isLoadingMore])

  // クライアントサイドフィルタリング
  const filteredPosts = useMemo(() => {
    const postsToFilter =
      allPosts.length > 0
        ? allPosts
        : data?.posts.edges.map(edge => edge.node) ||
          initialData?.posts.edges.map(edge => edge.node) ||
          []

    return filterPosts(postsToFilter, {
      skinType: filters.skinType,
      cosmeticCategory: filters.cosmeticCategory,
      moodTag: filters.moodTag,
      search: needsServerSearch ? '' : filters.search, // サーバー検索中はクライアント検索を無効化
    })
  }, [allPosts, data, initialData, filters, needsServerSearch])

  // ローディング状態の判定
  const hasClientFilters =
    filters.skinType ||
    filters.cosmeticCategory ||
    filters.moodTag ||
    (filters.search && !needsServerSearch)
  const isLoading = loading && needsServerSearch

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* ヘッダー */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              体験談を見る
            </h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
              みんなの化粧品体験を参考にして、自分に合うアイテムを見つけよう
            </p>
          </div>
          <Link
            href="/posts/new"
            className="bg-apple-600 text-white hover:bg-apple-700 px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm font-medium transition-colors text-center sm:text-left"
          >
            体験を投稿する
          </Link>
        </div>

        {/* フィルターセクション */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
            絞り込み検索
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                肌タイプ
              </label>
              <select
                value={filters.skinType}
                onChange={e => handleFilterChange('skinType', e.target.value)}
                className="block w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-apple-500 focus:border-apple-500"
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
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                カテゴリ
              </label>
              <select
                value={filters.cosmeticCategory}
                onChange={e => handleFilterChange('cosmeticCategory', e.target.value)}
                className="block w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-apple-500 focus:border-apple-500"
                data-testid="category-filter"
              >
                <option value="">すべて</option>
                {Object.entries(categoryLabels)
                  .filter(([value]) => value !== 'skincare')
                  .map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                感想
              </label>
              <select
                value={filters.moodTag}
                onChange={e => handleFilterChange('moodTag', e.target.value)}
                className="block w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-apple-500 focus:border-apple-500"
              >
                <option value="">すべて</option>
                <option value="disappointed">ちょっと残念</option>
                <option value="okay">まあまあ</option>
                <option value="good">良かった</option>
                <option value="love">また使いたい</option>
                <option value="perfect">完璧</option>
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                キーワード検索
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={e => handleFilterChange('search', e.target.value)}
                placeholder="コスメ名や体験談で検索"
                className="block w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-apple-500 focus:border-apple-500"
              />
            </div>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">投稿の読み込みに失敗しました</h3>
                <div className="mt-1 text-sm text-red-700">
                  ネットワークエラーまたは一時的な問題が発生している可能性があります。しばらく待ってから再度お試しください。
                </div>
                <div className="mt-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-md hover:bg-red-200 transition-colors"
                  >
                    ページを再読み込み
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ローディング表示 */}
        {isLoading && (
          <div className="grid gap-6 mb-8">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 animate-pulse"
              >
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex-1">
                    <div className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="flex gap-2">
                      <div className="h-4 bg-gray-200 rounded-full w-16"></div>
                      <div className="h-4 bg-gray-200 rounded-full w-20"></div>
                    </div>
                  </div>
                </div>
                <div className="mb-3 sm:mb-4">
                  <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* フィルター結果の表示 */}
        {hasClientFilters && !isLoading && (
          <div className="mb-4 text-sm text-gray-600">
            {filteredPosts.length}件の投稿が見つかりました
            {filters.skinType && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                肌タイプ: {skinTypeLabels[filters.skinType] || filters.skinType}
              </span>
            )}
            {filters.cosmeticCategory && (
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                カテゴリ: {categoryLabels[filters.cosmeticCategory as keyof typeof categoryLabels]}
              </span>
            )}
            {filters.moodTag && (
              <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                感想: {moodTagLabels[filters.moodTag] || filters.moodTag}
              </span>
            )}
            {filters.search && !needsServerSearch && (
              <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                検索: {filters.search}
              </span>
            )}
          </div>
        )}

        {/* 投稿一覧 */}
        {(!isLoading || filteredPosts.length > 0) && (
          <>
            {filteredPosts.length > 0 ? (
              <>
                <div className="grid gap-6 mb-8">
                  {filteredPosts.map(post => (
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
                          comments: post.commentCount,
                        },
                      }}
                    />
                  ))}
                </div>

                {/* もっと見る・全件読み込みボタン */}
                {!hasClientFilters &&
                  (data?.posts.pageInfo.hasNextPage || initialData?.posts.pageInfo.hasNextPage) && (
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                      >
                        {isLoadingMore ? '読み込み中...' : 'もっと見る'}
                      </button>
                    </div>
                  )}

                {hasClientFilters &&
                  allPosts.length < 100 &&
                  (data?.posts.pageInfo.hasNextPage || initialData?.posts.pageInfo.hasNextPage) && (
                    <div className="flex justify-center">
                      <button
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200 disabled:opacity-50"
                      >
                        {isLoadingMore ? '読み込み中...' : 'さらに投稿を読み込んで検索精度を向上'}
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
