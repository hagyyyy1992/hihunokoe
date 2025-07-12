import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckCircle } from 'lucide-react'

export default function ContactCompletePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle>お問い合わせを受け付けました</CardTitle>
          <CardDescription>お問い合わせいただきありがとうございます。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-muted-foreground">
            <p>お問い合わせ内容を確認次第、担当者より対応させていただきます。</p>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/">
              <Button className="w-full">トップページへ戻る</Button>
            </Link>
            <Link href="/help">
              <Button variant="outline" className="w-full">
                ヘルプページを見る
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
