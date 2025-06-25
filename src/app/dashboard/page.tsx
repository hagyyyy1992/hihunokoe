'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'
import { User, FileText, Plus } from 'lucide-react'

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

export default function DashboardPage() {
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
        if (response.ok) {
          const data = await response.json()
          const allPosts = data.posts || []

          // 自分の投稿と他ユーザーの投稿を分ける
          const myPosts = allPosts.filter((post: Post) => post.user.id === user?.id)
          const others = allPosts.filter((post: Post) => post.user.id !== user?.id)

          setUserPosts(myPosts.slice(0, 5)) // 最新5件
          setOtherPosts(others.slice(0, 5)) // 最新5件
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error)
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
            <div className="flex gap-3">
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                <User className="w-4 h-4" />
                ユーザ情報
              </Link>
              <Link
                href="/posts/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                投稿作成
              </Link>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {user.userName}さん、こんにちは！
            </h2>
            <p className="text-gray-600">Usakaコスメティクス体験シェアサービスへようこそ。</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* 自分の投稿 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  自分の投稿
                </h3>
                <Link href="/posts?user=me" className="text-sm text-pink-600 hover:text-pink-700">
                  すべて見る →
                </Link>
              </div>
              {postsLoading ? (
                <div className="text-gray-500 text-sm">読み込み中...</div>
              ) : userPosts.length > 0 ? (
                <div className="space-y-3">
                  {userPosts.map(post => (
                    <Link
                      key={post.id}
                      href={`/posts/${post.id}`}
                      className="block p-3 border border-gray-100 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900 truncate">{post.title}</div>
                      <div className="text-sm text-gray-600 mt-1">コスメ: {post.cosmeticName}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(post.publishedAt).toLocaleDateString('ja-JP')}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">
                  まだ投稿がありません。
                  <Link href="/posts/new" className="text-pink-600 hover:text-pink-700 ml-1">
                    最初の投稿を作成
                  </Link>
                </div>
              )}
            </div>

            {/* 他ユーザーの投稿 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  他ユーザーの投稿
                </h3>
                <Link href="/posts" className="text-sm text-blue-600 hover:text-blue-700">
                  すべて見る →
                </Link>
              </div>
              {postsLoading ? (
                <div className="text-gray-500 text-sm">読み込み中...</div>
              ) : otherPosts.length > 0 ? (
                <div className="space-y-3">
                  {otherPosts.map(post => (
                    <Link
                      key={post.id}
                      href={`/posts/${post.id}`}
                      className="block p-3 border border-gray-100 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900 truncate">{post.title}</div>
                      <div className="text-sm text-gray-600 mt-1">by {post.user.userName}</div>
                      <div className="text-sm text-gray-600">コスメ: {post.cosmeticName}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(post.publishedAt).toLocaleDateString('ja-JP')}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">まだ投稿がありません。</div>
              )}
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
