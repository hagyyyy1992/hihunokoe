'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'

function TermsAgreementContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [isAgreeTerms, setIsAgreeTerms] = useState(false)
  const [isAgreePrivacy, setIsAgreePrivacy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasOpenedTerms, setHasOpenedTerms] = useState(false)
  const [hasOpenedPrivacy, setHasOpenedPrivacy] = useState(false)
  const [termsClickTime, setTermsClickTime] = useState<number | null>(null)
  const [privacyClickTime, setPrivacyClickTime] = useState<number | null>(null)

  // リダイレクト先を取得（デフォルトは/home）
  const redirectTo = searchParams.get('redirectTo') || '/home'

  // ログインしていない場合はログインページへリダイレクト
  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
    }
  }, [user, router])

  // E2Eテストモードの確認
  const isE2ETest = typeof window !== 'undefined' && window.location.search.includes('e2e=true')

  // リンククリックハンドラー
  const handleTermsClick = useCallback(
    (e: React.MouseEvent) => {
      if (isE2ETest) {
        // E2Eテストモードでは新しいタブを開かずに即座に読了状態にする
        e.preventDefault()
        e.stopPropagation()
        setHasOpenedTerms(true)
        return false
      }

      const now = Date.now()
      setTermsClickTime(now)
      setTimeout(() => {
        setHasOpenedTerms(true)
      }, 3000)
    },
    [isE2ETest]
  )

  const handlePrivacyClick = useCallback(
    (e: React.MouseEvent) => {
      if (isE2ETest) {
        // E2Eテストモードでは新しいタブを開かずに即座に読了状態にする
        e.preventDefault()
        e.stopPropagation()
        setHasOpenedPrivacy(true)
        return false
      }

      const now = Date.now()
      setPrivacyClickTime(now)
      setTimeout(() => {
        setHasOpenedPrivacy(true)
      }, 3000)
    },
    [isE2ETest]
  )

  const handleSubmit = useCallback(async () => {
    if (!isAgreeTerms || !isAgreePrivacy) {
      setError('利用規約とプライバシーポリシーの両方に同意してください')
      return
    }

    if (!hasOpenedTerms || !hasOpenedPrivacy) {
      setError('利用規約とプライバシーポリシーを必ずお読みください')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/accept-terms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          termsAccepted: isAgreeTerms,
          privacyAccepted: isAgreePrivacy,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '同意の処理に失敗しました')
      }

      // 同意処理成功後、ページ全体をリロードして新しい認証状態を確実に取得
      // これによりサーバーサイドで最新のユーザー情報が取得される
      window.location.href = redirectTo
    } catch (error) {
      console.error('Terms agreement error:', error)
      setError(error instanceof Error ? error.message : '同意の処理に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }, [isAgreeTerms, isAgreePrivacy, hasOpenedTerms, hasOpenedPrivacy, redirectTo])

  if (!user) {
    return null // ローディング中は何も表示しない
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">利用規約への同意</h1>
          <div className="mt-2 text-sm text-gray-600">
            <p className="mb-2">
              サービスをご利用いただくには、以下の内容にご同意いただく必要があります。
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-left">
              <p className="text-yellow-800 font-medium">
                ⚠️ 重要：必ずリンクをクリックして内容をお読みください
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                利用規約とプライバシーポリシーの両方を開いて確認後、同意ボタンが有効になります。
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="agree-terms"
                data-testid="agree-terms-checkbox"
                checked={isAgreeTerms}
                onChange={e => setIsAgreeTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
              />
              <label htmlFor="agree-terms" className="ml-3 text-sm">
                {isE2ETest ? (
                  <button
                    type="button"
                    onClick={handleTermsClick}
                    className={`${
                      hasOpenedTerms
                        ? 'text-green-600 hover:text-green-500'
                        : 'text-indigo-600 hover:text-indigo-500'
                    } underline bg-transparent border-none p-0 cursor-pointer`}
                  >
                    利用規約
                    {hasOpenedTerms && <span className="ml-1 text-green-600">✓</span>}
                  </button>
                ) : (
                  <Link
                    href="/legal/terms"
                    target="_blank"
                    onClick={handleTermsClick}
                    className={`${
                      hasOpenedTerms
                        ? 'text-green-600 hover:text-green-500'
                        : 'text-indigo-600 hover:text-indigo-500'
                    } underline`}
                  >
                    利用規約
                    {hasOpenedTerms && <span className="ml-1 text-green-600">✓</span>}
                  </Link>
                )}
                に同意します
                {!hasOpenedTerms && !termsClickTime && (
                  <span className="block text-xs text-red-600 mt-1">
                    ※利用規約をクリックしてお読みください
                  </span>
                )}
                {termsClickTime && !hasOpenedTerms && (
                  <span className="block text-xs text-orange-600 mt-1">
                    ✓ 利用規約を確認中... （数秒お待ちください）
                  </span>
                )}
              </label>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="agree-privacy"
                data-testid="agree-privacy-checkbox"
                checked={isAgreePrivacy}
                onChange={e => setIsAgreePrivacy(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
              />
              <label htmlFor="agree-privacy" className="ml-3 text-sm">
                {isE2ETest ? (
                  <button
                    type="button"
                    onClick={handlePrivacyClick}
                    className={`${
                      hasOpenedPrivacy
                        ? 'text-green-600 hover:text-green-500'
                        : 'text-indigo-600 hover:text-indigo-500'
                    } underline bg-transparent border-none p-0 cursor-pointer`}
                  >
                    プライバシーポリシー
                    {hasOpenedPrivacy && <span className="ml-1 text-green-600">✓</span>}
                  </button>
                ) : (
                  <Link
                    href="/legal/privacy"
                    target="_blank"
                    onClick={handlePrivacyClick}
                    className={`${
                      hasOpenedPrivacy
                        ? 'text-green-600 hover:text-green-500'
                        : 'text-indigo-600 hover:text-indigo-500'
                    } underline`}
                  >
                    プライバシーポリシー
                    {hasOpenedPrivacy && <span className="ml-1 text-green-600">✓</span>}
                  </Link>
                )}
                に同意します
                {!hasOpenedPrivacy && !privacyClickTime && (
                  <span className="block text-xs text-red-600 mt-1">
                    ※プライバシーポリシーをクリックしてお読みください
                  </span>
                )}
                {privacyClickTime && !hasOpenedPrivacy && (
                  <span className="block text-xs text-orange-600 mt-1">
                    ✓ プライバシーポリシーを確認中... （数秒お待ちください）
                  </span>
                )}
              </label>
            </div>
          </div>

          {error && (
            <div data-testid="error-message" className="rounded bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleSubmit}
              disabled={
                !isAgreeTerms ||
                !isAgreePrivacy ||
                !hasOpenedTerms ||
                !hasOpenedPrivacy ||
                isSubmitting
              }
              className="w-full"
              data-testid="submit-agreement-button"
            >
              {isSubmitting ? '処理中...' : '同意して続ける'}
            </Button>

            <Button
              variant="secondary"
              onClick={() => {
                // ログアウトしてログインページへ
                fetch('/api/auth/logout', { method: 'POST' }).then(() => router.push('/auth/login'))
              }}
              className="w-full"
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default function TermsAgreementPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">読み込み中...</p>
          </div>
        </div>
      }
    >
      <TermsAgreementContent />
    </Suspense>
  )
}
