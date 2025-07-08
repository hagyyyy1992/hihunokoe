'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('パスワードリセットメールを送信しました。メールボックスをご確認ください。')
      } else {
        setMessage(data.error || 'エラーが発生しました')
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      setMessage('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-6 sm:py-12 px-3 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-sm sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-apple-100 rounded-full flex items-center justify-center">
            <span className="text-apple-600 font-bold text-base sm:text-lg">H</span>
          </div>
        </div>
        <h2 className="mt-4 sm:mt-6 text-center text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900">
          パスワードをお忘れですか？
        </h2>
        <p className="mt-2 text-center text-xs sm:text-sm text-gray-600 px-2">
          メールアドレスを入力してください。パスワードリセットリンクをお送りします。
        </p>
      </div>

      <div className="mt-6 sm:mt-8 mx-auto w-full max-w-sm sm:max-w-md">
        <div className="bg-white py-6 sm:py-8 px-4 sm:px-6 lg:px-10 shadow rounded-lg">
          <form
            className="space-y-4 sm:space-y-6"
            onSubmit={handleSubmit}
            data-testid="reset-password-form"
          >
            {message && (
              <div
                className={`p-3 rounded-md text-sm ${
                  message.includes('送信しました')
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
                data-testid="message"
              >
                {message}
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
              data-testid="email-input"
            />

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              loading={loading}
              className="w-full"
              data-testid="reset-password-button"
            >
              パスワードリセットメールを送信
            </Button>
          </form>

          <div className="mt-4 sm:mt-6 text-center">
            <Link
              href="/auth/login"
              className="text-xs sm:text-sm text-apple-600 hover:text-apple-500"
            >
              ログインページに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
