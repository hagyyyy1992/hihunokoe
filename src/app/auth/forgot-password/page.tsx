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
      const response = await fetch('/apis/auth/forgot-password', {
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
            <span className="text-pink-600 font-bold text-lg">U</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          パスワードをお忘れですか？
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          メールアドレスを入力してください。パスワードリセットリンクをお送りします。
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit} data-testid="reset-password-form">
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

          <div className="mt-6 text-center">
            <Link href="/auth/login" className="text-sm text-pink-600 hover:text-pink-500">
              ログインページに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
