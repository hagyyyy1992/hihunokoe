'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  FileText,
  AlertTriangle,
  Settings,
  BarChart3,
  Shield,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/avatar'
import { AuthUser } from '@/lib/auth/auth'

interface AdminLayoutProps {
  children: React.ReactNode
}

const navigationItems = [
  { href: '/admin/dashboard', label: 'ダッシュボード', icon: BarChart3 },
  { href: '/admin/users', label: 'ユーザー管理', icon: Users },
  { href: '/admin/posts', label: '投稿管理', icon: FileText },
  { href: '/admin/reports', label: '通報管理', icon: AlertTriangle },
  { href: '/admin/settings', label: '設定', icon: Settings },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // ログインページではチェックをスキップ
    if (pathname === '/admin/login') {
      setIsLoading(false)
      return
    }

    const checkAuth = async () => {
      try {
        // サーバー側でユーザー情報を取得するAPIを呼び出す
        const response = await fetch('/api/admin/auth/me', {
          credentials: 'include', // HTTPOnlyクッキーを送信
        })

        if (!response.ok) {
          router.push('/admin/login')
          setIsLoading(false)
          return
        }

        const userData = await response.json()
        setUser(userData)
        setIsLoading(false)
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/admin/login')
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, pathname])

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', {
        method: 'POST',
      })
    } catch (error) {
      console.error('Logout error:', error)
    }

    setUser(null)
    router.push('/admin/login')
  }

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">認証中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* サイドバー */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b bg-white">
          <div className="flex items-center">
            <Shield className="h-7 w-7 text-blue-600" />
            <span className="ml-2 text-lg font-semibold text-gray-900">管理画面</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto mt-2 px-4 pb-4 space-y-1">
          {navigationItems.map(item => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto p-4 border-t bg-gray-50">
          <div className="flex items-center mb-3 p-3 bg-white rounded-lg">
            <Avatar name={user.userName} size="sm" />
            <div className="ml-2 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.userName}</p>
              <p className="text-xs text-gray-500 truncate">
                {user.role === 'SUPER_ADMIN' ? 'スーパー管理者' : '管理者'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start hover:bg-red-50 hover:text-red-600"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            ログアウト
          </Button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="lg:pl-64">
        {/* ヘッダー */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-6">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="flex items-center">
              <h1 className="text-lg font-semibold text-gray-900">
                {navigationItems.find(item => item.href === pathname)?.label || 'ダッシュボード'}
              </h1>
            </div>
          </div>
        </header>

        {/* メインコンテンツエリア */}
        <main className="p-6">{children}</main>
      </div>

      {/* サイドバーオーバーレイ */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  )
}
