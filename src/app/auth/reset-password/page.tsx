'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PasswordStrengthIndicator } from '@/components/ui/PasswordStrengthIndicator'
import { PasswordRequirements } from '@/components/ui/PasswordRequirements'
import Link from 'next/link'

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setError('無効なリセットリンクです')
      setTokenValid(false)
      return
    }

    const verifyToken = async () => {
      try {
        const response = await fetch('/apis/auth/verify-reset-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (data.success) {
          setTokenValid(true)
        } else {
          setError(data.message || '無効なトークンまたは期限切れです')
          setTokenValid(false)
        }
      } catch (error) {
        console.error('Token verification error:', error)
        setError('トークンの確認中にエラーが発生しました')
        setTokenValid(false)
      }
    }

    verifyToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!password || !confirmPassword) {
      setError('すべてのフィールドを入力してください')
      return
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    // パスワードの強度チェックはAPI側で行うため、ここでは基本的なチェックのみ
    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/apis/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setMessage('パスワードが正常にリセットされました。ログインページに移動します...')
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
      } else {
        setError(data.error || 'パスワードリセットに失敗しました')
      }
    } catch (error) {
      console.error('Password reset error:', error)
      setError('パスワードリセット中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <p>トークンを確認中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">パスワードリセット</h2>
            <div className="mt-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>
            <div className="mt-4">
              <Link href="/auth/forgot-password" className="text-indigo-600 hover:text-indigo-500">
                パスワードリセットを再試行
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">パスワードリセット完了</h2>
            <div className="mt-4 p-3 rounded-md bg-green-50 text-green-700 text-sm">{message}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            新しいパスワードを設定
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            新しいパスワードを入力してください
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {message && (
                <div className="p-3 rounded-md bg-green-50 text-green-700 text-sm">{message}</div>
              )}

              {error && (
                <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  新しいパスワード
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="新しいパスワードを入力してください"
                  disabled={loading}
                  className="mt-1"
                />
                <PasswordStrengthIndicator password={password} />
                <PasswordRequirements password={password} />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  パスワード確認
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="パスワードを再入力してください"
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div>
                <Button type="submit" disabled={loading} loading={loading} className="w-full">
                  パスワードをリセット
                </Button>
              </div>

              <div className="text-center">
                <Link href="/auth/login" className="text-sm text-indigo-600 hover:text-indigo-500">
                  ログインページに戻る
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
