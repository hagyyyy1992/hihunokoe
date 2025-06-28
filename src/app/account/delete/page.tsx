'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trash2, AlertTriangle } from 'lucide-react'

export default function DeleteAccountPage() {
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const router = useRouter()
  const { logout } = useAuth()

  const handleDeleteAccount = async () => {
    if (!password) {
      setError('パスワードを入力してください')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'アカウント削除に失敗しました')
      }

      // 削除成功時は認証状態をクリアしてトップページにリダイレクト
      await logout()
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アカウント削除に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            アカウント削除
          </CardTitle>
          <CardDescription>
            この操作は取り消すことができません。アカウントを削除すると、すべての投稿、コメント、共感データが永久に削除されます。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!showConfirmation ? (
            <>
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>警告:</strong> アカウントを削除すると以下のデータが永久に削除されます:
                  <ul className="mt-2 ml-4 list-disc space-y-1">
                    <li>プロフィール情報</li>
                    <li>投稿したコスメティック体験談</li>
                    <li>コメントと共感</li>
                    <li>その他すべてのアカウント関連データ</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  アカウント削除を続行する場合は、下のボタンをクリックしてください。
                </p>
                <Button
                  onClick={() => setShowConfirmation(true)}
                  variant="danger"
                  className="w-full"
                >
                  アカウント削除を続行
                </Button>
              </div>
            </>
          ) : (
            <>
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>最終確認:</strong> 本当にアカウントを削除してもよろしいですか？
                </AlertDescription>
              </Alert>

              {error && (
                <Alert className="border-red-200 bg-red-50" data-testid="error-message">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    パスワードを入力して削除を確認
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="現在のパスワード"
                    disabled={isLoading}
                    className="w-full"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setShowConfirmation(false)
                      setPassword('')
                      setError('')
                    }}
                    variant="outline"
                    disabled={isLoading}
                    className="flex-1"
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleDeleteAccount}
                    variant="danger"
                    disabled={isLoading || !password}
                    className="flex-1"
                  >
                    {isLoading ? '削除中...' : 'アカウントを削除'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
