import type { Metadata } from 'next'
import { SERVICE_NAME } from '@/lib/constants'

export const metadata: Metadata = {
  title: `プライバシーポリシー - ${SERVICE_NAME}`,
  description: `${SERVICE_NAME}のプライバシーポリシー`,
}

export default function Privacy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
        <p className="text-yellow-800 text-sm font-medium">
          ⚠️ このページは仮のテキストです。内容は後で正式に作成されます。
        </p>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">プライバシーポリシー</h1>

      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <p className="text-gray-600 mb-4">
            {SERVICE_NAME}
            （以下「当サービス」）は、ユーザーの個人情報の保護を重要視し、個人情報の保護に関する法律、その他関係法令等を遵守し、適切に取り扱います。
          </p>
          <p className="text-gray-600 mb-4 text-sm">最終更新日: 2024年1月1日（仮の日付）</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. 個人情報の定義</h2>
          <p className="text-gray-600 mb-4">
            個人情報とは、ユーザー個人に関する情報であって、氏名、メールアドレス、その他の記述により特定の個人を識別することができるものをいいます。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. 個人情報の収集</h2>
          <p className="text-gray-600 mb-4">
            当サービスでは、以下の個人情報を収集する場合があります：
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>ニックネーム</li>
            <li>メールアドレス</li>
            <li>肌タイプ、年齢層などのプロフィール情報</li>
            <li>投稿内容および関連する情報</li>
            <li>サービス利用に関するログ情報</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. 個人情報の利用目的</h2>
          <p className="text-gray-600 mb-4">収集した個人情報は、以下の目的で利用します：</p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>サービスの提供および運営</li>
            <li>ユーザー認証およびアカウント管理</li>
            <li>お問い合わせへの対応</li>
            <li>サービスの改善および新機能の開発</li>
            <li>利用規約違反の調査および対応</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. 個人情報の共有</h2>
          <p className="text-gray-600 mb-4">
            当サービスは、法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。
          </p>
          <p className="text-gray-600 mb-4">ただし、以下の情報は他のユーザーに公開されます：</p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>ニックネーム</li>
            <li>プロフィール情報（肌タイプ、年齢層など）</li>
            <li>投稿内容</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. 個人情報の保護</h2>
          <p className="text-gray-600 mb-4">
            当サービスは、個人情報の不正アクセス、紛失、破壊、改ざんおよび漏洩を防止するため、適切なセキュリティ対策を実施します。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Cookieの使用</h2>
          <p className="text-gray-600 mb-4">
            当サービスでは、サービスの利便性向上のためCookieを使用する場合があります。Cookieの設定は、ブラウザの設定により変更できます。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            7. 個人情報の開示・訂正・削除
          </h2>
          <p className="text-gray-600 mb-4">
            ユーザーは、自己の個人情報について、開示・訂正・削除を求めることができます。アカウント設定から変更するか、お問い合わせフォームからご連絡ください。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            8. プライバシーポリシーの変更
          </h2>
          <p className="text-gray-600 mb-4">
            本プライバシーポリシーは、法令の変更やサービスの改善に伴い変更する場合があります。重要な変更については、サービス内で通知します。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. お問い合わせ</h2>
          <p className="text-gray-600 mb-4">
            本プライバシーポリシーに関するお問い合わせは、
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
