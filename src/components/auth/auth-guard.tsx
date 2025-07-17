'use client'

import React from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import Link from 'next/link'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
  loadingComponent?: React.ReactNode
}

export function AuthGuard({
  children,
  fallback,
  redirectTo = '/auth/login',
  loadingComponent,
}: AuthGuardProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      loadingComponent || (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
        </div>
      )
    )
  }

  if (!user) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="bg-gray-50 p-6 rounded-lg text-center">
        <p className="text-gray-600 mb-4">この機能を利用するにはログインが必要です</p>
        <Link
          href={redirectTo}
          className="inline-block bg-primary-500 text-white px-6 py-2 rounded-md hover:bg-primary-600 transition-colors"
        >
          ログインする
        </Link>
      </div>
    )
  }

  return <>{children}</>
}

// 特定用途向けの派生コンポーネント
export function LoginPrompt({
  message = 'この機能を利用するにはログインが必要です',
}: {
  message?: string
}) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg text-center">
      <p className="text-gray-600 mb-2 text-sm">{message}</p>
      <Link
        href="/auth/login"
        className="inline-block bg-primary-500 text-gray-600 px-4 py-1.5 rounded-md hover:bg-primary-600 transition-colors text-sm"
      >
        ログインする
      </Link>
    </div>
  )
}
