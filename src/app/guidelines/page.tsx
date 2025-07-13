import type { Metadata } from 'next'
import { SERVICE_NAME } from '@/lib/constants'

export const metadata: Metadata = {
  title: `ガイドライン - ${SERVICE_NAME}`,
  description: `${SERVICE_NAME}コミュニティのガイドライン`,
}

export default function Guidelines() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">コミュニティガイドライン</h1>

      <div className="prose prose-gray max-w-none">
        <p className="mb-6 text-lg">
          {SERVICE_NAME}
          は、化粧品の実体験を安心して共有できるコミュニティです。すべてのユーザーが快適に利用できるよう、以下のガイドラインを設けています。
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-3">基本理念</h2>
          <ul className="list-disc ml-6 space-y-2 text-blue-800">
            <li>リアルな体験を大切にします</li>
            <li>多様性を尊重し、すべての肌の声を歓迎します</li>
            <li>建設的で前向きなコミュニケーションを心がけます</li>
            <li>プライバシーと安全を最優先に考えます</li>
          </ul>
        </div>

        <h2 className="text-2xl font-semibold mt-8 mb-4">1. 投稿ガイドライン</h2>

        <h3 className="text-xl font-semibold mt-6 mb-3">推奨される投稿</h3>
        <ul className="list-disc ml-6 mb-6 space-y-2">
          <li>
            <strong>実体験に基づく投稿</strong>：実際に使用した化粧品の体験談
          </li>
          <li>
            <strong>具体的な情報</strong>：使用期間、使用方法、肌質などの詳細
          </li>
          <li>
            <strong>率直な感想</strong>：良い点も改善点も含めた正直なレビュー
          </li>
          <li>
            <strong>参考になる写真</strong>：使用前後の変化（個人が特定されない範囲で）
          </li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">禁止される投稿</h3>
        <ul className="list-disc ml-6 mb-6 space-y-2">
          <li>
            <strong>虚偽の情報</strong>：実際に使用していない商品のレビュー
          </li>
          <li>
            <strong>誹謗中傷</strong>：ブランド、商品、他のユーザーへの攻撃的な表現
          </li>
          <li>
            <strong>宣伝・ステマ</strong>：金銭的利益を目的とした投稿
          </li>
          <li>
            <strong>医療的主張</strong>：効能効果を保証するような表現
          </li>
          <li>
            <strong>個人情報</strong>：自分や他人の個人を特定できる情報
          </li>
          <li>
            <strong>著作権侵害</strong>：他サイトからの無断転載
          </li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. コメントガイドライン</h2>

        <h3 className="text-xl font-semibold mt-6 mb-3">良いコメントの例</h3>
        <ul className="list-disc ml-6 mb-6 space-y-2">
          <li>「私も同じ肌質ですが、〇〇を併用すると効果的でした」</li>
          <li>「詳しいレビューありがとうございます。使用感について質問があります」</li>
          <li>「この情報はとても参考になりました」</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">避けるべきコメント</h3>
        <ul className="list-disc ml-6 mb-6 space-y-2">
          <li>投稿者の体験を否定する表現</li>
          <li>医学的なアドバイス</li>
          <li>商品の購入を強要する内容</li>
          <li>他のユーザーとの比較や競争を煽る内容</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. プライバシーとセキュリティ</h2>
        <ul className="list-disc ml-6 mb-6 space-y-2">
          <li>
            <strong>個人情報の保護</strong>：本名、住所、電話番号などは絶対に投稿しない
          </li>
          <li>
            <strong>写真の配慮</strong>：顔が映る写真は十分に注意し、必要に応じてぼかし処理を
          </li>
          <li>
            <strong>子どもの保護</strong>：未成年者の写真や情報は投稿しない
          </li>
          <li>
            <strong>位置情報</strong>：撮影場所が特定される情報は含めない
          </li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">4. 知的財産権の尊重</h2>
        <ul className="list-disc ml-6 mb-6 space-y-2">
          <li>他のサイトやSNSからの画像・文章の無断転載は禁止</li>
          <li>引用する場合は、必ず出典を明記</li>
          <li>商品の公式画像を使用する場合は、著作権に注意</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">5. 共感（いいね）機能の使い方</h2>
        <p className="mb-4">
          共感機能は、投稿者への応援や感謝の気持ちを表現するためのものです。以下の点にご注意ください：
        </p>
        <ul className="list-disc ml-6 mb-6 space-y-2">
          <li>純粋に内容に共感した場合に使用する</li>
          <li>相互共感を強要しない</li>
          <li>共感数を競うような行為は控える</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">6. 違反報告について</h2>
        <p className="mb-4">ガイドラインに違反する投稿やコメントを発見した場合：</p>
        <ol className="list-decimal ml-6 mb-6 space-y-2">
          <li>投稿の「報告」ボタンから違反内容を選択</li>
          <li>具体的な違反理由を記載（任意）</li>
          <li>運営チームが24時間以内に確認し、適切に対応</li>
        </ol>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-amber-900 mb-3">違反時の措置</h2>
          <p className="text-amber-800 mb-3">
            ガイドラインに違反した場合、以下の措置を取ることがあります：
          </p>
          <ol className="list-decimal ml-6 space-y-2 text-amber-800">
            <li>
              <strong>注意・警告</strong>：軽微な違反の場合
            </li>
            <li>
              <strong>投稿の削除</strong>：ガイドラインに明確に違反する内容
            </li>
            <li>
              <strong>アカウント停止</strong>：重大または繰り返しの違反
            </li>
            <li>
              <strong>アカウント削除</strong>：極めて悪質な場合
            </li>
          </ol>
        </div>

        <h2 className="text-2xl font-semibold mt-8 mb-4">7. 運営からのお願い</h2>
        <ul className="list-disc ml-6 mb-6 space-y-2">
          <li>肌質や体質は人それぞれ。他の人の体験を否定しない</li>
          <li>「合わなかった」という体験も貴重な情報として尊重する</li>
          <li>初心者の質問には優しく丁寧に答える</li>
          <li>コミュニティを一緒に育てる気持ちで参加する</li>
        </ul>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-green-900 mb-3">最後に</h2>
          <p className="text-green-800">
            {SERVICE_NAME}は、みなさまの協力によって成り立つコミュニティです。
            一人ひとりがガイドラインを守ることで、すべての人にとって価値ある場所になります。
            リアルな体験の共有を通じて、より多くの人が自分に合った化粧品と出会えることを願っています。
          </p>
        </div>

        <p className="mt-8 text-sm text-gray-600">
          制定日：2025年7月13日
          <br />
          最終更新日：2025年7月13日
        </p>
      </div>
    </div>
  )
}
