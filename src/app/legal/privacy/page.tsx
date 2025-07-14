export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">プライバシーポリシー</h1>

      <div className="prose prose-gray max-w-none">
        <p className="mb-4">
          当サービス（以下、「当サービス」といいます）は、ユーザーのプライバシーを尊重し、個人情報を適切に取り扱うことを重要な責務と考えています。本プライバシーポリシーでは、当サービスにおける個人情報の取り扱いについて定めます。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">1. 事業者情報</h2>
        <p className="mb-4">
          運営者名：本サービス運営事務局
          <br />
          連絡先：サービス内のお問い合わせフォームよりご連絡ください
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. 取得する情報</h2>
        <p className="mb-4">当サービスでは、以下の情報を取得する場合があります：</p>
        <ul className="list-disc ml-6 mb-4">
          <li>ニックネーム、メールアドレス、プロフィール画像などユーザーが入力した情報</li>
          <li>投稿されたレビュー・コメント等のコンテンツ</li>
          <li>パスワード（暗号化して保存）</li>
          <li>年齢・性別（任意）</li>
          <li>肌タイプ（任意）</li>
          <li>アレルギー情報（任意）</li>
          <li>Cookieおよびアクセスログ（IPアドレス、ブラウザ種別、参照元ページ等）</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. 利用目的</h2>
        <p className="mb-4">取得した情報は以下の目的で利用します：</p>
        <ul className="list-disc ml-6 mb-4">
          <li>サービス提供および機能改善のため</li>
          <li>ユーザーサポートおよびお問い合わせ対応</li>
          <li>不正利用防止およびセキュリティ確保</li>
          <li>利用状況分析およびマーケティング（Google Analytics等のツールを含む）</li>
          <li>重要なお知らせの通知</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">4. 取得方法</h2>
        <ul className="list-disc ml-6 mb-4">
          <li>ユーザーによる入力</li>
          <li>Cookie等による自動取得（アクセス解析）</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Google Analyticsの利用について</h2>
        <p className="mb-4">
          当サービスでは、アクセス解析のためにGoogleが提供するGoogle
          Analyticsを使用しています。Google
          Analyticsは、Cookieを利用してユーザーの訪問履歴を収集します。収集されたデータはGoogle社のプライバシーポリシーに基づいて管理されます。
        </p>
        <p className="mb-4">Google Analyticsにより収集される情報には以下が含まれます：</p>
        <ul className="list-disc ml-6 mb-4">
          <li>訪問したページのURL</li>
          <li>滞在時間</li>
          <li>参照元（どこから当サービスにアクセスしたか）</li>
          <li>使用しているブラウザやデバイスの種類</li>
          <li>おおよその地域（IPアドレスから推定）</li>
        </ul>
        <p className="mb-4">
          詳細はGoogle社のポリシーをご確認ください。Google Analyticsの利用規約は
          <a
            href="https://marketingplatform.google.com/about/analytics/terms/jp/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            こちら
          </a>
          をご確認ください。
        </p>
        <p className="mb-4">
          Google Analyticsによるデータ収集を拒否したい場合は、
          <a
            href="https://tools.google.com/dlpage/gaoptout?hl=ja"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Google Analytics オプトアウト アドオン
          </a>
          をご利用ください。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">6. 個人情報の第三者提供</h2>
        <p className="mb-4">
          取得した個人情報を、ユーザーの同意なく第三者に提供することはありません。ただし、法令に基づく場合を除きます。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">7. 個人情報の委託</h2>
        <p className="mb-4">
          業務の一部を外部に委託する場合、適切な管理・監督のもとで委託先に個人情報を取り扱わせることがあります。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Cookieの使用と広告について</h2>
        <p className="mb-4">
          当サービスでは、Cookieを使用しユーザーの利便性向上に役立てています。また、今後広告配信サービスを導入する際には、Cookieを使用したパーソナライズ広告が表示される可能性があります。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">9. 開示・訂正・削除等の請求</h2>
        <p className="mb-4">
          ユーザーは、自己に関する個人情報の開示・訂正・削除・利用停止等を希望する場合、サービス内のお問い合わせフォームよりご連絡ください。合理的な範囲で速やかに対応いたします。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">10. 未成年の利用について</h2>
        <p className="mb-4">
          本サービスは、13歳以上の方を対象としています。13歳未満の方は、保護者の同意があってもご利用いただけません。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">11. プライバシーポリシーの変更</h2>
        <p className="mb-4">
          本ポリシーは必要に応じて改定されることがあります。重要な変更がある場合は、当サービス上にて告知いたします。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">12. お問い合わせ</h2>
        <p className="mb-4">
          本ポリシーに関するお問い合わせは、サービス内のお問い合わせフォームよりご連絡ください。
        </p>

        <p className="mt-8 text-sm text-gray-600">
          制定日：2025年07月13日
          <br />
          最終更新日：2025年07月13日
        </p>
      </div>
    </div>
  )
}
