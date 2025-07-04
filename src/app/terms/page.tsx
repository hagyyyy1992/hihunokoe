import type { Metadata } from 'next'
import { SERVICE_NAME } from '@/lib/constants'

export const metadata: Metadata = {
  title: `利用規約 - ${SERVICE_NAME}`,
  description: `${SERVICE_NAME}の利用規約`,
}

export default function Terms() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
        <p className="text-yellow-800 text-sm font-medium">
          ⚠️ このページは仮のテキストです。内容は後で正式に作成されます。
        </p>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">利用規約</h1>

      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <p className="text-gray-600 mb-4">
            この利用規約（以下「本規約」）は、{SERVICE_NAME}
            （以下「当サービス」）の利用条件を定めるものです。ユーザーは、当サービスを利用することで、本規約に同意したものとみなされます。
          </p>
          <p className="text-gray-600 mb-4 text-sm">最終更新日: 2024年1月1日（仮の日付）</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">第1条（サービスの概要）</h2>
          <p className="text-gray-600 mb-4">
            当サービスは、化粧品の使用体験を共有するコミュニティプラットフォームです。ユーザーは、化粧品に関する体験談の投稿、閲覧、評価等を行うことができます。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">第2条（利用登録）</h2>
          <p className="text-gray-600 mb-4">
            当サービスの利用には、利用登録が必要です。登録希望者は、所定の方法により利用登録を申請し、当サービスの承認を受けることで利用登録が完了します。
          </p>
          <p className="text-gray-600 mb-4">
            利用登録時には、正確な情報を提供し、変更があった場合は速やかに更新してください。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">第3条（禁止事項）</h2>
          <p className="text-gray-600 mb-4">ユーザーは、以下の行為を行ってはなりません：</p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>法令または公序良俗に違反する行為</li>
            <li>他のユーザーや第三者を誹謗中傷する行為</li>
            <li>虚偽の情報を投稿する行為</li>
            <li>商業的な宣伝や勧誘を目的とした投稿</li>
            <li>著作権などの知的財産権を侵害する行為</li>
            <li>個人情報を無断で収集・利用する行為</li>
            <li>当サービスの運営を妨害する行為</li>
            <li>その他、当サービスが不適切と判断する行為</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">第4条（投稿内容の取り扱い）</h2>
          <p className="text-gray-600 mb-4">
            ユーザーが投稿した内容は、当サービス内で公開されます。ユーザーは、投稿内容について責任を負うものとします。
          </p>
          <p className="text-gray-600 mb-4">
            当サービスは、投稿内容が本規約に違反すると判断した場合、事前の通知なく削除することがあります。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">第5条（知的財産権）</h2>
          <p className="text-gray-600 mb-4">
            当サービスに関する知的財産権は、当サービス運営者または正当な権利者に帰属します。ユーザーが投稿した内容の著作権は、投稿者に帰属します。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">第6条（免責事項）</h2>
          <p className="text-gray-600 mb-4">
            当サービスは、投稿内容の正確性、完全性、有用性について保証するものではありません。ユーザーは、投稿内容を参考にする際は、自己の責任において判断してください。
          </p>
          <p className="text-gray-600 mb-4">
            当サービスの利用により生じた損害について、当サービス運営者は一切の責任を負いません。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            第7条（利用停止・アカウント削除）
          </h2>
          <p className="text-gray-600 mb-4">
            当サービスは、ユーザーが本規約に違反した場合、事前の通知なく利用停止やアカウント削除を行うことがあります。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">第8条（プライバシー）</h2>
          <p className="text-gray-600 mb-4">
            個人情報の取り扱いについては、
            <a href="/privacy" className="text-pink-600 hover:text-pink-700 underline">
              プライバシーポリシー
            </a>
            をご確認ください。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">第9条（規約の変更）</h2>
          <p className="text-gray-600 mb-4">
            当サービスは、本規約を変更することがあります。重要な変更については、サービス内で事前に通知します。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            第10条（準拠法・管轄裁判所）
          </h2>
          <p className="text-gray-600 mb-4">
            本規約は、日本法に準拠します。当サービスに関する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">お問い合わせ</h2>
          <p className="text-gray-600 mb-4">
            本規約に関するお問い合わせは、
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
