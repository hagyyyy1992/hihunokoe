'use client'

import { useState, useCallback } from 'react'
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

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
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
          router.push('/home')
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
    },
    [email, password, refreshAuth, router]
  )

  const handleResendEmail = useCallback(async () => {
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
  }, [email])

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }, [])

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
  }, [])

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
          <Link
            href="/auth/register"
            className="font-medium text-pink-600 hover:text-pink-500"
            data-testid="register-link"
          >
            会員登録
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit} data-testid="login-form">
            {error && (
              <div
                className={`p-3 rounded-md text-sm ${
                  error.includes('再送信しました')
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
                data-testid="error-message"
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
              onChange={handleEmailChange}
              placeholder="example@example.com"
              data-testid="email-input"
            />

            <Input
              label="パスワード"
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={handlePasswordChange}
              placeholder="パスワードを入力してください"
              data-testid="password-input"
            />

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                data-testid="remember-me-checkbox"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                ログイン状態を保持する
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              loading={loading}
              className="w-full"
              data-testid="login-button"
            >
              ログイン
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-pink-600 hover:text-pink-500"
              data-testid="forgot-password-link"
            >
              パスワードをお忘れですか？
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
