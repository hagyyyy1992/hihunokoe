export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">プライバシーポリシー</h1>

      <div className="prose prose-gray max-w-none">
        <p className="mb-4">
          Hihunokoe（以下「当サービス」といいます。）は、ユーザーの個人情報の保護に努めます。
          本プライバシーポリシーは、当サービスがどのような個人情報を収集し、どのように利用するかを説明するものです。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">1. 収集する情報</h2>
        <p className="mb-4">当サービスは、以下の情報を収集します：</p>
        <ul className="list-disc ml-6 mb-4">
          <li>メールアドレス</li>
          <li>ユーザー名</li>
          <li>パスワード（暗号化して保存）</li>
          <li>年齢・性別（任意）</li>
          <li>肌タイプ（任意）</li>
          <li>アレルギー情報（任意）</li>
          <li>投稿内容</li>
          <li>IPアドレス</li>
          <li>アクセスログ</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. 情報の利用目的</h2>
        <p className="mb-4">収集した情報は以下の目的で利用します：</p>
        <ul className="list-disc ml-6 mb-4">
          <li>サービスの提供・運営</li>
          <li>ユーザーからのお問い合わせへの対応</li>
          <li>サービスの改善・新機能の開発</li>
          <li>利用規約違反の調査・対応</li>
          <li>重要なお知らせの通知</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. 情報の第三者提供</h2>
        <p className="mb-4">
          当サービスは、以下の場合を除き、個人情報を第三者に提供することはありません：
        </p>
        <ul className="list-disc ml-6 mb-4">
          <li>ユーザーの同意がある場合</li>
          <li>法令に基づく場合</li>
          <li>人の生命、身体または財産の保護のために必要がある場合</li>
          <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">4. データの安全管理</h2>
        <p className="mb-4">
          当サービスは、個人情報の紛失、破壊、改ざん、漏洩などのリスクに対して、適切な安全管理措置を講じます。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Cookie（クッキー）</h2>
        <p className="mb-4">
          当サービスは、ユーザー体験の向上のためにCookieを使用することがあります。
          Cookieは、ユーザーのブラウザに保存される小さなデータファイルです。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">6. アクセス解析ツール</h2>
        <p className="mb-4">
          当サービスは、サービス改善のためにアクセス解析ツールを使用することがあります。
          これにより収集される情報は統計的なものであり、個人を特定するものではありません。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">7. 個人情報の開示・訂正・削除</h2>
        <p className="mb-4">
          ユーザーは、自己の個人情報の開示、訂正、削除を請求することができます。
          請求方法については、お問い合わせフォームよりご連絡ください。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">8. プライバシーポリシーの変更</h2>
        <p className="mb-4">
          当サービスは、必要に応じて本プライバシーポリシーを変更することがあります。
          重要な変更がある場合は、サービス上で通知します。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">9. お問い合わせ</h2>
        <p className="mb-4">
          本プライバシーポリシーに関するお問い合わせは、サービス内のお問い合わせフォームよりお願いいたします。
        </p>

        <p className="mt-8 text-sm text-gray-600">
          制定日：2025年1月1日
          <br />
          最終更新日：2025年1月1日
        </p>
      </div>
    </div>
  )
}
