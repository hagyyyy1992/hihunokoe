'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showResendButton, setShowResendButton] = useState(false)

  const { refreshAuth } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setShowResendButton(false)
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        await refreshAuth()
        router.push('/')
      } else {
        setError(data.error || 'ログインに失敗しました')

        // メール認証が必要な場合
        if (data.emailVerificationRequired) {
          setShowResendButton(true)
        }
      }
    } catch (err: unknown) {
      console.error('Login error:', err)
      setError('ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleResendEmail = async () => {
    if (!email) return

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setError('確認メールを再送信しました。メールボックスをご確認ください。')
        setShowResendButton(false)
      } else {
        setError(data.error || '再送信に失敗しました')
      }
    } catch (error) {
      console.error('Resend verification error:', error)
      setError('再送信に失敗しました')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
            <span className="text-pink-600 font-bold text-lg">U</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">ログイン</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          アカウントをお持ちでない方は{' '}
          <Link href="/auth/register" className="font-medium text-pink-600 hover:text-pink-500">
            会員登録
          </Link>
        </p>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800 font-medium">デモ用ログイン情報 (メール認証済み):</p>
          <p className="text-xs text-blue-700 mt-1">
            メール: demo@example.com
            <br />
            パスワード: demo123
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div
                className={`p-3 rounded-md text-sm ${
                  error.includes('再送信しました')
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {error}
              </div>
            )}

            {showResendButton && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-sm text-yellow-800 mb-2">
                  メールアドレスの確認が完了していません。
                </p>
                <button
                  type="button"
                  onClick={handleResendEmail}
                  className="text-sm text-blue-600 hover:text-blue-500 underline"
                >
                  確認メールを再送信する
                </button>
              </div>
            )}

            <Input
              label="メールアドレス"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@example.com"
            />

            <Input
              label="パスワード"
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="パスワードを入力してください"
            />

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              loading={loading}
              className="w-full"
            >
              ログイン
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
