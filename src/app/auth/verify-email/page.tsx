'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'

function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [hasProcessed, setHasProcessed] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshAuth } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setStatus('error')
      setMessage('トークンが提供されていません')
      return
    }

    // 既に処理済みの場合は実行しない
    if (hasProcessed) {
      return
    }

    const verifyEmail = async () => {
      setHasProcessed(true)

      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`)
        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage(data.message)

          // 認証状態をリフレッシュ
          await refreshAuth()

          // 3秒後にホームページにリダイレクト
          setTimeout(() => {
            router.push('/')
          }, 3000)
        } else {
          setStatus('error')
          setMessage(data.error || 'メールアドレスの確認に失敗しました')
        }
      } catch (error) {
        console.error('Email verification error:', error)
        setStatus('error')
        setMessage('メールアドレスの確認に失敗しました')
      }
    }

    verifyEmail()
  }, [searchParams, router, refreshAuth, hasProcessed])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            メールアドレスの確認
          </h2>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          {status === 'loading' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">確認中...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="text-green-600 text-5xl mb-4">✓</div>
              <p className="text-green-600 font-medium mb-4">{message}</p>
              <p className="text-gray-600 text-sm mb-4">3秒後に自動的にホームページに移動します</p>
              <Link href="/" className="text-blue-600 hover:text-blue-500 font-medium">
                今すぐホームページに移動
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="text-red-600 text-5xl mb-4">✗</div>
              <p className="text-red-600 font-medium mb-4">{message}</p>
              <div className="space-y-2">
                <Link
                  href="/auth/register"
                  className="block text-blue-600 hover:text-blue-500 font-medium"
                >
                  新規登録に戻る
                </Link>
                <Link
                  href="/auth/login"
                  className="block text-blue-600 hover:text-blue-500 font-medium"
                >
                  ログインページ
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
