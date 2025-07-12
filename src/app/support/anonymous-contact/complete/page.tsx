import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckCircle, Clock, Mail, HelpCircle } from 'lucide-react'

export default function AnonymousContactCompletePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">匿名お問い合わせを受け付けました</CardTitle>
          <CardDescription>アカウント関連のお問い合わせありがとうございます</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <p className="text-lg">お問い合わせ内容を確認いたします</p>
            <p className="text-muted-foreground">
              ご入力いただいたメールアドレス宛に、サポートチームから回答をお送りいたします。
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-900">回答予定時間</p>
                <p className="text-sm text-blue-700">通常1〜3営業日以内にご回答いたします</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg">
              <Mail className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-900">メール配信について</p>
                <p className="text-sm text-amber-700">迷惑メールフォルダも確認してください</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <HelpCircle className="h-5 w-5 text-purple-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-purple-900">急ぎの場合</p>
                <p className="text-sm text-purple-700">よくある質問で解決できる場合があります</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Link href="/support/faq">
              <Button variant="outline" className="w-full">
                よくある質問を確認する
              </Button>
            </Link>

            <Link href="/">
              <Button className="w-full">ホームに戻る</Button>
            </Link>
          </div>

          <div className="text-center text-sm text-muted-foreground pt-4 border-t">
            <p>
              アカウント以外のお問い合わせは
              <Link href="/contact" className="text-primary hover:underline ml-1">
                通常のお問い合わせフォーム
              </Link>
              をご利用ください（要ログイン）
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
