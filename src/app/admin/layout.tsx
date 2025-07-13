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
  ClipboardList,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { AdminAuthProvider, useAdminAuth } from '@/lib/auth/AdminAuthContext'
import { SERVICE_NAME } from '@/lib/constants'

interface AdminLayoutProps {
  children: React.ReactNode
}

const navigationItems = [
  { href: '/admin/dashboard', label: 'ダッシュボード', icon: BarChart3 },
  { href: '/admin/users', label: 'ユーザー管理', icon: Users },
  { href: '/admin/posts', label: '投稿管理', icon: FileText },
  { href: '/admin/inquiries', label: 'お問い合わせ', icon: MessageSquare },
  { href: '/admin/withdrawal-surveys', label: '退会アンケート', icon: ClipboardList },
  { href: '/admin/reports', label: '通報管理', icon: AlertTriangle },
  { href: '/admin/settings', label: '設定', icon: Settings },
]

function AdminLayoutContent({ children }: AdminLayoutProps) {
  const { admin, loading, logout } = useAdminAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [unreadInquiries, setUnreadInquiries] = useState(0)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // ログインページではチェックをスキップ
    if (pathname === '/admin/login') {
      return
    }

    // 認証状態をチェック
    if (!loading && !admin) {
      router.push('/admin/login')
    }
  }, [admin, loading, router, pathname])

  useEffect(() => {
    if (!admin) return

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/admin/inquiries/unread-count')
        if (response.ok) {
          const data = await response.json()
          setUnreadInquiries(data.unreadCount)
        }
      } catch (error) {
        console.error('Failed to fetch unread count:', error)
      }
    }

    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 60000) // 1分ごとに更新

    return () => clearInterval(interval)
  }, [admin])

  const handleLogout = async () => {
    await logout()
    router.push('/admin/login')
  }

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">認証中...</p>
        </div>
      </div>
    )
  }

  if (!admin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* サイドバー */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b bg-white">
          <div className="flex items-center">
            <Shield className="h-7 w-7 text-blue-600" />
            <span className="ml-2 text-lg font-semibold text-gray-900">{SERVICE_NAME}管理画面</span>
          </div>
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors relative z-10"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="サイドバーを閉じる"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto mt-2 px-4 pb-4 space-y-1">
          {navigationItems.map(item => {
            const isActive = pathname === item.href
            const showBadge = item.href === '/admin/inquiries' && unreadInquiries > 0
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
                <span className="flex-1">{item.label}</span>
                {showBadge && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                    {unreadInquiries}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto p-4 border-t bg-gray-50">
          <div className="flex items-center mb-3 p-3 bg-white rounded-lg">
            <Avatar name={admin.adminName} size="sm" />
            <div className="ml-2 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{admin.adminName}</p>
              <p className="text-xs text-gray-500 truncate">
                {admin.role === 'SUPER_ADMIN' ? 'スーパー管理者' : '管理者'}
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
      <div className="flex-1 flex flex-col min-h-screen">
        {/* モバイル用ハンバーガーメニュー */}
        <button
          type="button"
          className="lg:hidden fixed top-4 left-4 z-30 p-3 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition-all hover:scale-105"
          onClick={() => setIsSidebarOpen(true)}
          aria-label="メニューを開く"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* メインコンテンツエリア */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 pt-16 lg:pt-3">{children}</main>
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

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminAuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminAuthProvider>
  )
}
