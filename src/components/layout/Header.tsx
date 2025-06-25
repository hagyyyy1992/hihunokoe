'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [currentPath, setCurrentPath] = useState('')
  const { user, logout, loading } = useAuth()
  const pathname = usePathname()

  useEffect(() => {
    setCurrentPath(pathname)
  }, [pathname])

  const getNavLinkClass = (href: string) => {
    if (!currentPath) {
      return 'text-gray-700 hover:text-pink-600 px-3 py-2 text-sm font-medium transition-colors'
    }
    const isActive =
      currentPath === href ||
      (href === '/posts' && currentPath.startsWith('/posts') && currentPath !== '/posts/new')
    if (isActive) {
      return 'bg-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors'
    }
    return 'text-gray-700 hover:text-pink-600 px-3 py-2 text-sm font-medium transition-colors'
  }

  const getPostNewLinkClass = () => {
    if (!currentPath) {
      return 'text-gray-700 hover:text-pink-600 px-3 py-2 text-sm font-medium transition-colors'
    }
    const isActive = currentPath === '/posts/new'
    if (isActive) {
      return 'bg-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors'
    }
    return 'text-gray-700 hover:text-pink-600 px-3 py-2 text-sm font-medium transition-colors'
  }

  const getAuthLinkClass = (href: string, isButton = false) => {
    if (!currentPath) {
      if (isButton) {
        return 'border border-pink-600 text-pink-600 hover:bg-pink-50 px-4 py-2 rounded-full text-sm font-medium transition-colors'
      }
      return 'text-gray-700 hover:text-pink-600 px-3 py-2 text-sm font-medium transition-colors'
    }
    const isActive = currentPath === href
    if (isActive) {
      if (isButton) {
        return 'bg-pink-600 text-white border border-pink-600 px-4 py-2 rounded-full text-sm font-medium transition-colors'
      }
      return 'bg-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors'
    }
    if (isButton) {
      return 'border border-pink-600 text-pink-600 hover:bg-pink-50 px-4 py-2 rounded-full text-sm font-medium transition-colors'
    }
    return 'text-gray-700 hover:text-pink-600 px-3 py-2 text-sm font-medium transition-colors'
  }

  const getMobileNavLinkClass = (href: string) => {
    if (!currentPath) {
      return 'block px-3 py-2 text-gray-700 hover:text-pink-600 text-sm font-medium transition-colors'
    }
    const isActive =
      currentPath === href ||
      (href === '/posts' && currentPath.startsWith('/posts') && currentPath !== '/posts/new')
    if (isActive) {
      return 'block px-3 py-2 bg-pink-600 text-white rounded-lg text-sm font-medium transition-colors mx-2'
    }
    return 'block px-3 py-2 text-gray-700 hover:text-pink-600 text-sm font-medium transition-colors'
  }

  const getMobilePostNewLinkClass = () => {
    if (!currentPath) {
      return 'block px-3 py-2 text-gray-700 hover:text-pink-600 text-sm font-medium transition-colors'
    }
    const isActive = currentPath === '/posts/new'
    if (isActive) {
      return 'block px-3 py-2 bg-pink-600 text-white rounded-lg text-sm font-medium transition-colors mx-2'
    }
    return 'block px-3 py-2 text-gray-700 hover:text-pink-600 text-sm font-medium transition-colors'
  }

  const getMobileAuthLinkClass = (href: string) => {
    if (!currentPath) {
      return 'block px-3 py-2 text-gray-700 hover:text-pink-600 text-sm font-medium transition-colors'
    }
    const isActive = currentPath === href
    if (isActive) {
      return 'block px-3 py-2 bg-pink-600 text-white rounded-lg text-sm font-medium transition-colors mx-2'
    }
    return 'block px-3 py-2 text-gray-700 hover:text-pink-600 text-sm font-medium transition-colors'
  }

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
            <Link href="/" className={getNavLinkClass('/')}>
              ホーム
            </Link>
            {user && (
              <Link href="/dashboard" className={getNavLinkClass('/dashboard')}>
                ダッシュボード
              </Link>
            )}
            <Link href="/posts" className={getNavLinkClass('/posts')}>
              体験を見る
            </Link>
            <Link href="/posts/new" className={getPostNewLinkClass()}>
              体験を投稿
            </Link>
            <Link href="/search" className={getNavLinkClass('/search')}>
              検索
            </Link>
          </nav>

          {/* ユーザーメニュー */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="text-gray-500">Loading...</div>
            ) : user ? (
              <>
                <span className="text-gray-700 text-sm" data-testid="user-menu-button">
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
                  className="text-gray-700 hover:text-pink-600 px-3 py-2 text-sm font-medium transition-colors cursor-pointer"
                  data-testid="logout-button"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className={getAuthLinkClass('/auth/login')}
                  data-testid="login-link"
                >
                  ログイン
                </Link>
                <Link href="/auth/register" className={getAuthLinkClass('/auth/register', true)}>
                  会員登録
                </Link>
              </>
            )}
          </div>

          {/* モバイルメニューボタン */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-pink-600 hover:bg-gray-100 transition-colors"
            data-testid="mobile-menu-button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* モバイルメニュー */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-100">
              <Link href="/" className={getMobileNavLinkClass('/')}>
                ホーム
              </Link>
              {user && (
                <Link href="/dashboard" className={getMobileNavLinkClass('/dashboard')}>
                  ダッシュボード
                </Link>
              )}
              <Link href="/posts" className={getMobileNavLinkClass('/posts')}>
                体験を見る
              </Link>
              <Link href="/posts/new" className={getMobilePostNewLinkClass()}>
                体験を投稿
              </Link>
              <Link href="/search" className={getMobileNavLinkClass('/search')}>
                検索
              </Link>
              <hr className="my-2 border-gray-100" />
              {user ? (
                <>
                  <div className="px-3 py-2 text-sm text-gray-600" data-testid="user-menu-button">
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
                    className="block w-full text-left px-3 py-2 text-gray-700 hover:text-pink-600 text-sm font-medium transition-colors cursor-pointer"
                    data-testid="logout-button"
                  >
                    ログアウト
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className={getMobileAuthLinkClass('/auth/login')}
                    data-testid="login-link"
                  >
                    ログイン
                  </Link>
                  <Link href="/auth/register" className={getMobileAuthLinkClass('/auth/register')}>
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
