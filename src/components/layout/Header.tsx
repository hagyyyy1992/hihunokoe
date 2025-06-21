'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, logout, loading } = useAuth()

  return (
    <header className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ロゴ */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
              <span className="text-pink-600 font-bold text-sm">U</span>
            </div>
            <span className="text-xl font-semibold text-gray-900">Usaka</span>
          </Link>

          {/* デスクトップナビゲーション */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-gray-700 hover:text-pink-600 px-3 py-2 text-sm font-medium transition-colors"
            >
              ホーム
            </Link>
            <Link
              href="/posts"
              className="text-gray-700 hover:text-pink-600 px-3 py-2 text-sm font-medium transition-colors"
            >
              体験を見る
            </Link>
            <Link
              href="/posts/new"
              className="bg-pink-600 text-white hover:bg-pink-700 px-4 py-2 rounded-full text-sm font-medium transition-colors"
            >
              体験を投稿
            </Link>
            <Link
              href="/search"
              className="text-gray-700 hover:text-pink-600 px-3 py-2 text-sm font-medium transition-colors"
            >
              検索
            </Link>
          </nav>

          {/* ユーザーメニュー */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="text-gray-500">Loading...</div>
            ) : user ? (
              <>
                <span className="text-gray-700 text-sm">
                  {user.displayName || user.userName}さん
                </span>
                <Link
                  href="/profile"
                  className="text-gray-700 hover:text-pink-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  プロフィール
                </Link>
                <button
                  onClick={logout}
                  className="text-gray-700 hover:text-pink-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-pink-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  ログイン
                </Link>
                <Link
                  href="/auth/register"
                  className="border border-pink-600 text-pink-600 hover:bg-pink-50 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                >
                  会員登録
                </Link>
              </>
            )}
          </div>

          {/* モバイルメニューボタン */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-pink-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* モバイルメニュー */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-100">
              <Link
                href="/"
                className="block px-3 py-2 text-gray-700 hover:text-pink-600 text-sm font-medium transition-colors"
              >
                ホーム
              </Link>
              <Link
                href="/posts"
                className="block px-3 py-2 text-gray-700 hover:text-pink-600 text-sm font-medium transition-colors"
              >
                体験を見る
              </Link>
              <Link
                href="/posts/new"
                className="block px-3 py-2 text-gray-700 hover:text-pink-600 text-sm font-medium transition-colors"
              >
                体験を投稿
              </Link>
              <Link
                href="/search"
                className="block px-3 py-2 text-gray-700 hover:text-pink-600 text-sm font-medium transition-colors"
              >
                検索
              </Link>
              <hr className="my-2 border-gray-100" />
              {user ? (
                <>
                  <div className="px-3 py-2 text-sm text-gray-600">
                    {user.displayName || user.userName}さん
                  </div>
                  <Link
                    href="/profile"
                    className="block px-3 py-2 text-gray-700 hover:text-pink-600 text-sm font-medium transition-colors"
                  >
                    プロフィール
                  </Link>
                  <button
                    onClick={logout}
                    className="block w-full text-left px-3 py-2 text-gray-700 hover:text-pink-600 text-sm font-medium transition-colors"
                  >
                    ログアウト
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="block px-3 py-2 text-gray-700 hover:text-pink-600 text-sm font-medium transition-colors"
                  >
                    ログイン
                  </Link>
                  <Link
                    href="/auth/register"
                    className="block px-3 py-2 text-gray-700 hover:text-pink-600 text-sm font-medium transition-colors"
                  >
                    会員登録
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}