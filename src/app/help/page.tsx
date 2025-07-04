import type { Metadata } from 'next'
import { SERVICE_NAME } from '@/lib/constants'

export const metadata: Metadata = {
  title: `ヘルプ - ${SERVICE_NAME}`,
  description: `${SERVICE_NAME}の使い方とよくある質問`,
}

export default function Help() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
        <p className="text-yellow-800 text-sm font-medium">
          ⚠️ このページは仮のテキストです。内容は後で正式に作成されます。
        </p>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">ヘルプ</h1>

      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">よくある質問</h2>

          <div className="space-y-6">
            <div className="border-l-4 border-pink-500 pl-4">
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Q. 投稿はどのように作成しますか？
              </h3>
              <p className="text-gray-600">
                A.
                ログイン後、「投稿する」ボタンから新しい体験を投稿できます。化粧品名、使用感、肌タイプなどの情報を入力してください。
              </p>
            </div>

            <div className="border-l-4 border-pink-500 pl-4">
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Q. プロフィール情報は公開されますか？
              </h3>
              <p className="text-gray-600">
                A.
                プロフィール情報のうち、ニックネームと肌タイプなどの基本情報のみ公開されます。個人を特定できる情報は公開されません。
              </p>
            </div>

            <div className="border-l-4 border-pink-500 pl-4">
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Q. 不適切な投稿を見つけた場合はどうすればいいですか？
              </h3>
              <p className="text-gray-600">
                A. 投稿の「報告」ボタンからご報告ください。運営チームが適切に対応いたします。
              </p>
            </div>

            <div className="border-l-4 border-pink-500 pl-4">
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Q. アカウントを削除したい場合は？
              </h3>
              <p className="text-gray-600">
                A.
                プロフィール設定から「アカウント削除」を選択してください。削除されたデータは復元できませんのでご注意ください。
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">使い方ガイド</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-3">新規登録</h3>
              <p className="text-gray-600 text-sm">
                メールアドレスとパスワードで簡単に登録できます。肌タイプなどの基本情報を設定して、より正確な情報を共有しましょう。
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-3">投稿を探す</h3>
              <p className="text-gray-600 text-sm">
                化粧品名や肌タイプで検索できます。自分と似た肌質の人の体験談を参考にして、新しい化粧品を発見しましょう。
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">お困りの場合</h2>
          <p className="text-gray-600 mb-4">
            上記で解決しない問題がございましたら、
            <a href="/contact" className="text-pink-600 hover:text-pink-700 underline">
              お問い合わせページ
            </a>
            からご連絡ください。
          </p>
        </section>
      </div>
    </div>
  )
}
