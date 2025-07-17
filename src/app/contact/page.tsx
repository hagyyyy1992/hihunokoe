'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SimpleSelect } from '@/components/ui/select'
import { ContactCategory } from '@prisma/client'

const categoryLabels: Record<ContactCategory, string> = {
  general: '一般的なお問い合わせ',
  bug_report: 'バグ報告',
  feature_request: '機能リクエスト',
  account: 'アカウント関連',
  privacy: 'プライバシー関連',
  other: 'その他',
}

export default function ContactPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [, setUser] = useState<{ userName: string; email: string } | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'general' as ContactCategory,
    message: '',
  })

  useEffect(() => {
    checkLoginStatus()
  }, [])

  const checkLoginStatus = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setIsLoggedIn(true)
        // ログインユーザーの情報でフォームを初期化
        setFormData(prev => ({
          ...prev,
          name: data.user.userName || '',
          email: data.user.email || '',
        }))
      } else {
        setIsLoggedIn(false)
      }
    } catch {
      setIsLoggedIn(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'お問い合わせの送信に失敗しました')
      }

      router.push('/contact/complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ログイン状態チェック中
  if (isLoggedIn === null) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center py-8">読み込み中...</div>
      </div>
    )
  }

  // ログインしていない場合
  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>お問い合わせ</CardTitle>
            <CardDescription>
              お問い合わせ機能をご利用いただくには、ログインが必要です。
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-muted-foreground">ログインしてお問い合わせを送信してください。</p>
            <div className="flex gap-4 justify-center">
              <Link href="/auth/login">
                <Button>ログイン</Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="outline">新規登録</Button>
              </Link>
            </div>

            <div className="border-t pt-6 space-y-4">
              <h3 className="font-semibold">お困りですか？</h3>
              <div className="space-y-2">
                <div>
                  <Link href="/help" className="text-primary hover:underline">
                    よくある質問（FAQ）
                  </Link>
                  <p className="text-sm text-muted-foreground">多くの疑問が解決できます</p>
                </div>
                <div>
                  <Link href="/support/anonymous-contact" className="text-primary hover:underline">
                    アカウント作成・ログインに関する匿名お問い合わせ
                  </Link>
                  <p className="text-sm text-muted-foreground">ログインできない場合はこちら</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>お問い合わせ</CardTitle>
          <CardDescription>
            ご質問やご要望がございましたら、以下のフォームからお問い合わせください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">お名前 *</Label>
              <Input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="お名前を入力してください"
                maxLength={100}
              />
              <p className="text-sm text-muted-foreground">
                ログインユーザーの名前が初期値として入力されています（編集可能）
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス *</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="メールアドレスを入力してください"
                maxLength={255}
              />
              <p className="text-sm text-muted-foreground">
                ログインユーザーのメールアドレスが初期値として入力されています（編集可能）
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">カテゴリー *</Label>
              <SimpleSelect
                id="category"
                value={formData.category}
                onValueChange={value =>
                  setFormData({ ...formData, category: value as ContactCategory })
                }
              >
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </SimpleSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">件名 *</Label>
              <Input
                id="subject"
                type="text"
                required
                value={formData.subject}
                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                placeholder="お問い合わせの件名"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">お問い合わせ内容 *</Label>
              <Textarea
                id="message"
                required
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                placeholder="お問い合わせ内容を入力してください"
                rows={6}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? '送信中...' : '送信する'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/')}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/legal/privacy" className="hover:underline">
          プライバシーポリシー
        </Link>
        {' | '}
        <Link href="/legal/terms" className="hover:underline">
          利用規約
        </Link>
      </div>
    </div>
  )
}
