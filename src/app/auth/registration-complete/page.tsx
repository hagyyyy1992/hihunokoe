'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function RegistrationCompleteContent() {
  const [isResending, setIsResending] = useState(false)
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  const handleResendEmail = async () => {
    if (!email) return

    setIsResending(true)
    setMessage('')

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
        setMessage('確認メールを再送信しました')
      } else {
        setMessage(data.error || '再送信に失敗しました')
      }
    } catch (error) {
      console.error('Resend verification error:', error)
      setMessage('再送信に失敗しました')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            登録ありがとうございます
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">メールアドレスの確認が必要です</p>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 space-y-6">
          <div className="text-center">
            <div className="text-green-600 text-6xl mb-4">📧</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2" data-testid="success-message">
              アカウントが作成されました
            </h3>
            <p className="text-sm text-gray-600 mb-4">確認メールを送信しました</p>
            {email && (
              <p className="text-sm text-gray-600 mb-4">
                <span className="font-medium">{email}</span> 宛に確認メールをお送りしました。
              </p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">📋 次の手順</h4>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>メールボックスを確認してください</li>
              <li>「メールアドレスを確認する」ボタンをクリック</li>
              <li>自動的にログインされ、サービスをご利用いただけます</li>
            </ol>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">⚠️ メールが届かない場合</h4>
            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>迷惑メールフォルダを確認してください</li>
              <li>メールアドレスに間違いがないか確認してください</li>
              <li>しばらく待ってから再度確認してください</li>
            </ul>
          </div>

          {message && (
            <div
              className={`p-3 rounded-md text-sm ${
                message.includes('成功') || message.includes('再送信しました')
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleResendEmail}
              disabled={isResending || !email}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-apple-600 hover:bg-apple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-apple-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isResending ? '送信中...' : '確認メールを再送信'}
            </button>

            <div className="text-center space-y-2">
              <Link
                href="/auth/login"
                className="block text-sm text-apple-600 hover:text-apple-500"
              >
                ログインページに戻る
              </Link>
              <Link href="/" className="block text-sm text-gray-600 hover:text-gray-500">
                ホームページに戻る
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            確認メールは24時間有効です。期限が切れた場合は再度登録を行ってください。
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegistrationCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-apple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      }
    >
      <RegistrationCompleteContent />
    </Suspense>
  )
}
