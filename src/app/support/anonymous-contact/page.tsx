'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SimpleSelect } from '@/components/ui/select'

// アカウント関連のカテゴリーのみ
const anonymousCategories = {
  account_login: 'ログインできない',
  account_signup: '新規登録できない',
  account_password: 'パスワードリセット問題',
  account_email: 'メール認証問題',
  account_other: 'その他のアカウント問題',
} as const

type AnonymousCategory = keyof typeof anonymousCategories

export default function AnonymousContactPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'account_login' as AnonymousCategory,
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/support/anonymous-contact', {
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

      router.push('/support/anonymous-contact/complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>匿名お問い合わせ（アカウント関連のみ）</CardTitle>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>こちらはアカウント作成・ログインに関する問題専用の匿名お問い合わせフォームです。</p>
            <p className="text-amber-600">
              ⚠️
              その他のお問い合わせについては、ログインしてから通常のお問い合わせフォームをご利用ください。
            </p>
          </div>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス *</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="連絡先メールアドレス"
                maxLength={255}
              />
              <p className="text-sm text-muted-foreground">
                回答をお送りするためのメールアドレスです
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">問題のカテゴリー *</Label>
              <SimpleSelect
                id="category"
                value={formData.category}
                onValueChange={value =>
                  setFormData({ ...formData, category: value as AnonymousCategory })
                }
              >
                {Object.entries(anonymousCategories).map(([value, label]) => (
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
                placeholder="問題の概要"
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">詳細な状況 *</Label>
              <Textarea
                id="message"
                required
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                placeholder="どのような問題が発生しているか、詳しくお聞かせください&#10;・どの操作を行ったときに問題が発生したか&#10;・エラーメッセージが表示された場合はその内容&#10;・お使いのブラウザやデバイス"
                rows={8}
                maxLength={5000}
              />
              <p className="text-sm text-muted-foreground">
                問題解決のため、具体的な状況をお聞かせください（5000文字以内）
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? '送信中...' : '匿名で送信する'}
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

          <div className="mt-8 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">その他のお問い合わせ</h3>
            <div className="space-y-2 text-sm">
              <div>
                <Link href="/contact" className="text-primary hover:underline">
                  通常のお問い合わせフォーム
                </Link>
                <p className="text-muted-foreground">アカウント以外のお問い合わせ（要ログイン）</p>
              </div>
              <div>
                <Link href="/help" className="text-primary hover:underline">
                  よくある質問（FAQ）
                </Link>
                <p className="text-muted-foreground">多くの疑問がすぐに解決できます</p>
              </div>
            </div>
          </div>
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
