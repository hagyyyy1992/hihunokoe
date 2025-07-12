'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'
import { User, FileText, Plus } from 'lucide-react'
import { SERVICE_NAME } from '@/lib/constants'

interface Post {
  id: string
  title: string
  content: string
  cosmeticName: string
  publishedAt: string
  user: {
    id: string
    userName: string
  }
  _count?: {
    empathies: number
    comments: number
  }
}

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [otherPosts, setOtherPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setPostsLoading(true)
        const response = await fetch('/api/posts?limit=20')

        // レスポンスのステータスをチェック
        if (!response.ok) {
          const errorText = await response.text()
          console.error(`API request failed:`, {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            responseText: errorText.substring(0, 500), // 最初の500文字のみログ
          })
          return
        }

        // Content-Typeをチェック
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          const responseText = await response.text()
          console.error(`Expected JSON but received:`, {
            contentType,
            responseText: responseText.substring(0, 500),
          })
          return
        }

        const data = await response.json()
        const allPosts = data.posts || []

        // 自分の投稿と他ユーザーの投稿を分ける
        const myPosts = user ? allPosts.filter((post: Post) => post.user?.id === user.id) : []
        const others = user ? allPosts.filter((post: Post) => post.user?.id !== user.id) : allPosts

        setUserPosts(myPosts.slice(0, 5)) // 最新5件
        setOtherPosts(others.slice(0, 5)) // 最新5件
      } catch (error) {
        console.error('Failed to fetch posts:', error)
        // JSON.parseエラーの場合、より詳細な情報をログ
        if (error instanceof SyntaxError && error.message.includes('JSON')) {
          console.error(
            'This error typically means the server returned HTML instead of JSON. Check the /api/posts endpoint.'
          )
        }
      } finally {
        setPostsLoading(false)
      }
    }

    if (user) {
      fetchPosts()
    }
  }, [user])

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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-3 sm:space-y-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">ホーム</h1>
            <div className="flex gap-2 sm:gap-3">
              <Link
                href="/profile"
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm flex-1 sm:flex-initial justify-center"
              >
                <User className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">ユーザ情報</span>
                <span className="sm:hidden">ユーザ</span>
              </Link>
              <Link
                href="/posts/new"
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-apple-600 text-white rounded-md hover:bg-apple-700 transition-colors text-sm flex-1 sm:flex-initial justify-center"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">投稿作成</span>
                <span className="sm:hidden">投稿</span>
              </Link>
            </div>
          </div>

          <div className="mb-4 sm:mb-6">
            <h2
              className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 truncate"
              title={`${user.userName}さん、こんにちは！`}
            >
              {user.userName}さん、こんにちは！
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              {SERVICE_NAME}コスメティクス体験シェアサービスへようこそ。
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
            {/* 自分の投稿 */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-1.5 sm:gap-2">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  自分の投稿
                </h3>
                <Link
                  href="/posts?user=me"
                  className="text-xs sm:text-sm text-apple-600 hover:text-apple-700 whitespace-nowrap"
                >
                  すべて見る →
                </Link>
              </div>
              {postsLoading ? (
                <div className="text-gray-500 text-xs sm:text-sm">読み込み中...</div>
              ) : userPosts.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {userPosts.map(post => (
                    <Link
                      key={post.id}
                      href={`/posts/${post.id}`}
                      className="block p-2 sm:p-3 border border-gray-100 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900 truncate text-sm sm:text-base">
                        {post.title}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                        コスメ: {post.cosmeticName}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(post.publishedAt).toLocaleDateString('ja-JP')}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-xs sm:text-sm">
                  まだ投稿がありません。
                  <Link href="/posts/new" className="text-apple-600 hover:text-apple-700 ml-1">
                    最初の投稿を作成
                  </Link>
                </div>
              )}
            </div>

            {/* 他ユーザーの投稿 */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-1.5 sm:gap-2">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  他ユーザーの投稿
                </h3>
                <Link
                  href="/posts"
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 whitespace-nowrap"
                >
                  すべて見る →
                </Link>
              </div>
              {postsLoading ? (
                <div className="text-gray-500 text-xs sm:text-sm">読み込み中...</div>
              ) : otherPosts.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {otherPosts.map(post => (
                    <Link
                      key={post.id}
                      href={`/posts/${post.id}`}
                      className="block p-2 sm:p-3 border border-gray-100 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900 truncate text-sm sm:text-base">
                        {post.title}
                      </div>
                      <div
                        className="text-xs sm:text-sm text-gray-600 mt-1 truncate"
                        title={post.user?.userName || '投稿者'}
                      >
                        by {post.user?.userName || '投稿者'}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 truncate">
                        コスメ: {post.cosmeticName}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(post.publishedAt).toLocaleDateString('ja-JP')}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-xs sm:text-sm">まだ投稿がありません。</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
