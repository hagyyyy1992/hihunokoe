'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ChevronDown, ChevronUp, Search, MessageCircle, UserPlus, HelpCircle } from 'lucide-react'

// FAQ データ
const faqData = [
  {
    category: 'アカウント',
    icon: UserPlus,
    items: [
      {
        id: 'account-1',
        question: 'アカウントを作成できません',
        answer: `以下の点をご確認ください：

• メールアドレスが正しく入力されているか
• すでに同じメールアドレスで登録されていないか
• パスワードが8文字以上で、英数字と記号を含んでいるか
• ブラウザのJavaScriptが有効になっているか

問題が解決しない場合は、匿名お問い合わせフォームからご連絡ください。`,
      },
      {
        id: 'account-2',
        question: 'ログインできません',
        answer: `以下の方法をお試しください：

• メールアドレスとパスワードが正しく入力されているか確認
• パスワードリセット機能を使用
• ブラウザのキャッシュとCookieをクリア
• 別のブラウザで試す

それでもログインできない場合は、匿名お問い合わせフォームからご連絡ください。`,
      },
      {
        id: 'account-3',
        question: 'メール認証が届きません',
        answer: `以下をご確認ください：

• 迷惑メールフォルダも確認してください
• メールアドレスが正しく入力されているか
• ドメイン「@hihunokoe.com」からのメールを受信できるよう設定

24時間経っても届かない場合は、匿名お問い合わせフォームからご連絡ください。`,
      },
      {
        id: 'account-4',
        question: 'パスワードを忘れました',
        answer: `パスワードリセット機能をご利用ください：

1. ログインページの「パスワードを忘れた方」をクリック
2. 登録メールアドレスを入力
3. 送信されたメールのリンクから新しいパスワードを設定

メールが届かない場合は、迷惑メールフォルダもご確認ください。`,
      },
    ],
  },
  {
    category: '投稿・体験談',
    icon: MessageCircle,
    items: [
      {
        id: 'post-1',
        question: '投稿が表示されません',
        answer: `投稿が表示されない理由として以下が考えられます：

• 投稿が審査中の場合（通常24時間以内）
• 利用規約に違反する内容が含まれている
• システムエラーが発生している

しばらく待っても表示されない場合は、お問い合わせフォームからご連絡ください。`,
      },
      {
        id: 'post-2',
        question: '投稿を編集・削除したい',
        answer: `投稿の編集・削除は以下の手順で行えます：

• マイページから該当の投稿を選択
• 「編集」または「削除」ボタンをクリック
• 編集の場合は内容を修正して保存

削除した投稿は復元できませんのでご注意ください。`,
      },
      {
        id: 'post-3',
        question: 'どのような投稿をすればよいですか？',
        answer: `以下のような内容の投稿をお待ちしています：

• 実際に使用した化粧品の体験談
• 肌質や年齢などの背景情報
• 使用感や効果の詳細
• 他のユーザーの参考になる情報

誠実で具体的な体験談ほど、多くのユーザーに喜ばれます。`,
      },
    ],
  },
  {
    category: 'サイト利用',
    icon: HelpCircle,
    items: [
      {
        id: 'usage-1',
        question: 'サイトが正常に動作しません',
        answer: `以下の方法をお試しください：

• ブラウザを最新版に更新
• ページを再読み込み（F5キー）
• ブラウザのキャッシュとCookieをクリア
• 別のブラウザで試す
• インターネット接続を確認

問題が続く場合は、ご利用の環境とエラー内容をお問い合わせフォームからお知らせください。`,
      },
      {
        id: 'usage-2',
        question: 'プライバシーは守られますか？',
        answer: `当サイトではプライバシー保護を最優先に考えています：

• 個人情報は暗号化して保存
• 第三者への情報提供は行わない
• プライバシーポリシーに従って適切に管理

詳細はプライバシーポリシーをご確認ください。`,
      },
      {
        id: 'usage-3',
        question: 'アカウントを削除したい',
        answer: `アカウント削除は以下の手順で行えます：

1. ログイン後、プロフィール設定を開く
2. 「アカウント削除」を選択
3. 削除理由を選択（任意）
4. 確認画面で削除を実行

削除されたデータは復元できませんのでご注意ください。`,
      },
    ],
  },
]

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id)
    } else {
      newOpenItems.add(id)
    }
    setOpenItems(newOpenItems)
  }

  // 検索フィルタリング
  const filteredFaqData = faqData
    .map(category => ({
      ...category,
      items: category.items.filter(
        item =>
          item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.answer.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter(category => category.items.length > 0)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">よくある質問（FAQ）</h1>
        <p className="text-muted-foreground">
          多くの疑問がこちらで解決できます。お問い合わせ前にご確認ください。
        </p>
      </div>

      {/* 検索バー */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="FAQを検索..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* FAQ リスト */}
      <div className="space-y-8">
        {filteredFaqData.map(category => (
          <Card key={category.category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <category.icon className="h-5 w-5" />
                {category.category}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {category.items.map(item => (
                <div key={item.id} className="border rounded-lg">
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-medium">{item.question}</span>
                    {openItems.has(item.id) ? (
                      <ChevronUp className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 flex-shrink-0" />
                    )}
                  </button>
                  {openItems.has(item.id) && (
                    <div className="px-4 pb-4 text-muted-foreground">
                      <div className="whitespace-pre-line">{item.answer}</div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 解決しない場合の案内 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>問題が解決しませんでしたか？</CardTitle>
          <CardDescription>
            FAQで解決できない問題については、以下のお問い合わせ方法をご利用ください。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">通常のお問い合わせ</h3>
              <p className="text-sm text-muted-foreground mb-3">
                サービス利用、投稿、その他全般的なお問い合わせ
              </p>
              <Link href="/contact">
                <Button className="w-full">お問い合わせフォーム（要ログイン）</Button>
              </Link>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">アカウント関連の問題</h3>
              <p className="text-sm text-muted-foreground mb-3">
                ログイン・新規登録・パスワードリセット等
              </p>
              <Link href="/support/anonymous-contact">
                <Button variant="outline" className="w-full">
                  匿名お問い合わせ
                </Button>
              </Link>
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
