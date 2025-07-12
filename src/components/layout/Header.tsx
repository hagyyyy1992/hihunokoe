'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { SERVICE_NAME } from '@/lib/constants'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [currentPath, setCurrentPath] = useState('')
  const { user, logout, loading } = useAuth()
  const pathname = usePathname()

  useEffect(() => {
    setCurrentPath(pathname)
  }, [pathname])

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

  const getNavLinkClass = (href: string) => {
    if (!currentPath) {
      return 'text-gray-700 hover:text-apple-600 px-3 py-2 text-sm font-medium transition-colors'
    }
    const isActive =
      currentPath === href ||
      (href === '/posts' && currentPath.startsWith('/posts') && currentPath !== '/posts/new')
    if (isActive) {
      return 'bg-apple-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors'
    }
    return 'text-gray-700 hover:text-apple-600 px-3 py-2 text-sm font-medium transition-colors'
  }

  const getPostNewLinkClass = () => {
    if (!currentPath) {
      return 'text-gray-700 hover:text-apple-600 px-3 py-2 text-sm font-medium transition-colors'
    }
    const isActive = currentPath === '/posts/new'
    if (isActive) {
      return 'bg-apple-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors'
    }
    return 'text-gray-700 hover:text-apple-600 px-3 py-2 text-sm font-medium transition-colors'
  }

  const getAuthLinkClass = (href: string, isButton = false) => {
    if (!currentPath) {
      if (isButton) {
        return 'border border-apple-600 text-apple-600 hover:bg-apple-50 px-4 py-2 rounded-full text-sm font-medium transition-colors'
      }
      return 'text-gray-700 hover:text-apple-600 px-3 py-2 text-sm font-medium transition-colors'
    }
    const isActive = currentPath === href
    if (isActive) {
      if (isButton) {
        return 'bg-apple-600 text-white border border-apple-600 px-4 py-2 rounded-full text-sm font-medium transition-colors'
      }
      return 'bg-apple-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors'
    }
    if (isButton) {
      return 'border border-apple-600 text-apple-600 hover:bg-apple-50 px-4 py-2 rounded-full text-sm font-medium transition-colors'
    }
    return 'text-gray-700 hover:text-apple-600 px-3 py-2 text-sm font-medium transition-colors'
  }

  const getMobileNavLinkClass = (href: string) => {
    if (!currentPath) {
      return 'block px-3 py-1.5 text-gray-700 hover:text-apple-600 text-sm font-medium transition-colors'
    }
    const isActive =
      currentPath === href ||
      (href === '/posts' && currentPath.startsWith('/posts') && currentPath !== '/posts/new')
    if (isActive) {
      return 'block px-3 py-1.5 bg-apple-600 text-white rounded-lg text-sm font-medium transition-colors mx-2'
    }
    return 'block px-3 py-1.5 text-gray-700 hover:text-apple-600 text-sm font-medium transition-colors'
  }

  const getMobilePostNewLinkClass = () => {
    if (!currentPath) {
      return 'block px-3 py-1.5 text-gray-700 hover:text-apple-600 text-sm font-medium transition-colors'
    }
    const isActive = currentPath === '/posts/new'
    if (isActive) {
      return 'block px-3 py-1.5 bg-apple-600 text-white rounded-lg text-sm font-medium transition-colors mx-2'
    }
    return 'block px-3 py-1.5 text-gray-700 hover:text-apple-600 text-sm font-medium transition-colors'
  }

  const getMobileAuthLinkClass = (href: string) => {
    if (!currentPath) {
      return 'block px-3 py-1.5 text-gray-700 hover:text-apple-600 text-sm font-medium transition-colors'
    }
    const isActive = currentPath === href
    if (isActive) {
      return 'block px-3 py-1.5 bg-apple-600 text-white rounded-lg text-sm font-medium transition-colors mx-2'
    }
    return 'block px-3 py-1.5 text-gray-700 hover:text-apple-600 text-sm font-medium transition-colors'
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-100 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-12 sm:h-14">
          {/* ロゴ */}
          <Link href="/" className="flex items-center space-x-1.5 sm:space-x-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-apple-100 rounded-full flex items-center justify-center">
              <span className="text-apple-600 font-bold text-xs sm:text-sm">H</span>
            </div>
            <span className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              {SERVICE_NAME}
            </span>
          </Link>

          {/* デスクトップナビゲーション */}
          <nav className="hidden md:flex items-center space-x-8">
            {user && (
              <>
                <Link href="/home" className={getNavLinkClass('/home')}>
                  ホーム
                </Link>
                <Link href="/posts" prefetch={true} className={getNavLinkClass('/posts')}>
                  体験を見る
                </Link>
                <Link href="/posts/new" className={getPostNewLinkClass()}>
                  体験を投稿
                </Link>
              </>
            )}
          </nav>

          {/* ユーザーメニュー */}
          <div className="hidden md:flex items-center space-x-3">
            {loading ? (
              <div className="text-gray-500 text-sm">Loading...</div>
            ) : user ? (
              <>
                <Link
                  href="/profile"
                  className="text-gray-700 hover:text-apple-600 px-2 py-1 text-sm font-medium transition-colors"
                >
                  プロフィール
                </Link>
                <button
                  onClick={logout}
                  className="text-gray-700 hover:text-apple-600 px-2 py-1 text-sm font-medium transition-colors cursor-pointer"
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
            className="md:hidden p-1.5 rounded-md text-gray-700 hover:text-apple-600 hover:bg-gray-100 transition-colors relative z-[60]"
            data-testid="mobile-menu-button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div
            className="md:hidden fixed top-12 sm:top-14 left-0 right-0 bottom-0 z-50"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
            onClick={() => setIsMenuOpen(false)}
          >
            <div
              className="fixed top-12 sm:top-14 left-0 right-0 bg-white shadow-lg border-t border-gray-100"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-2 pt-1 pb-2 space-y-0.5 max-h-screen overflow-y-auto">
                {user ? (
                  <Link
                    href="/home"
                    className={getMobileNavLinkClass('/home')}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    ホーム
                  </Link>
                ) : (
                  <Link
                    href="/"
                    className={getMobileNavLinkClass('/')}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    ホーム
                  </Link>
                )}
                <Link
                  href="/posts"
                  prefetch={true}
                  className={getMobileNavLinkClass('/posts')}
                  onClick={() => setIsMenuOpen(false)}
                >
                  体験を見る
                </Link>
                {user && (
                  <Link
                    href="/posts/new"
                    className={getMobilePostNewLinkClass()}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    体験を投稿
                  </Link>
                )}
                <hr className="my-1 border-gray-100" />
                {user ? (
                  <>
                    <div
                      className="px-3 py-1.5 text-sm text-gray-600 truncate"
                      data-testid="user-menu-button"
                    >
                      {user.userName || 'ユーザー'}さん
                    </div>
                    <Link
                      href="/profile"
                      className="block px-3 py-1.5 text-gray-700 hover:text-apple-600 text-sm font-medium transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      プロフィール
                    </Link>
                    <button
                      onClick={() => {
                        logout()
                        setIsMenuOpen(false)
                      }}
                      className="block w-full text-left px-3 py-1.5 text-gray-700 hover:text-apple-600 text-sm font-medium transition-colors cursor-pointer"
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
                      onClick={() => setIsMenuOpen(false)}
                    >
                      ログイン
                    </Link>
                    <Link
                      href="/auth/register"
                      className={getMobileAuthLinkClass('/auth/register')}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      会員登録
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
