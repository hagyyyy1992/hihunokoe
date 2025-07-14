export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">利用規約</h1>

      <div className="prose prose-gray max-w-none">
        <p className="mb-4">
          この利用規約（以下、「本規約」といいます。）は、「ひふのこえ」（以下、「本サービス」といいます。）の提供条件および利用に関する規約を定めるものです。利用者は、本サービスを利用することで、本規約に同意したものとみなされます。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">第1条（定義）</h2>
        <ol className="list-decimal ml-6 mb-4">
          <li>
            「本サービス」とは、運営者が提供するコスメレビュー投稿・閲覧・検索等のWebサービスをいいます。
          </li>
          <li>「ユーザー」とは、本規約に同意の上、本サービスを利用する個人をいいます。</li>
        </ol>

        <h2 className="text-2xl font-semibold mt-8 mb-4">第2条（適用）</h2>
        <p className="mb-4">本規約は、ユーザーと運営者との間のすべての関係に適用されます。</p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">第3条（登録）</h2>
        <ol className="list-decimal ml-6 mb-4">
          <li>本サービスの利用には、メールアドレス等によるユーザー登録が必要な場合があります。</li>
          <li>登録情報は正確かつ最新の内容を保持するものとします。</li>
          <li>
            運営者は、登録された情報に基づき、重要なお知らせをメール等で通知することがあります。
          </li>
        </ol>

        <h2 className="text-2xl font-semibold mt-8 mb-4">第4条（禁止事項）</h2>
        <p className="mb-4">ユーザーは、以下の行為を行ってはなりません。</p>
        <ul className="list-disc ml-6 mb-4">
          <li>他者を誹謗中傷する行為</li>
          <li>法令または公序良俗に反する行為</li>
          <li>商業目的のスパム行為</li>
          <li>他人の著作権等の権利を侵害する行為</li>
          <li>本サービスの運営を妨害する行為</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">
          第5条（ユーザー投稿とコンテンツの取り扱い）
        </h2>
        <ol className="list-decimal ml-6 mb-4">
          <li>
            ユーザーが投稿したレビューやコメント（以下、「ユーザーコンテンツ」）の著作権は、当該ユーザーに帰属します。
          </li>
          <li>
            運営者は、ユーザーコンテンツを本サービスの運営・改善・広報等の目的で、無償で利用・編集・公開できるものとします。
          </li>
          <li>
            以下の内容が含まれる投稿は、運営者の判断により削除または非公開とすることがあります：
            <ul className="list-disc ml-6 mt-2">
              <li>根拠のない誹謗中傷や攻撃的表現</li>
              <li>医薬品や治療法の宣伝・助言とみなされる内容</li>
              <li>他者の著作権・肖像権を侵害するもの</li>
            </ul>
          </li>
        </ol>

        <h2 className="text-2xl font-semibold mt-8 mb-4">第6条（医療に関する免責事項）</h2>
        <ol className="list-decimal ml-6 mb-4">
          <li>
            本サービスは、医療行為または診断・治療を目的としたものではなく、医療上の判断や助言の代替となるものではありません。
          </li>
          <li>
            本サービス上の情報（ユーザーによる投稿を含む）は、医師その他の医療専門職による助言や指導に代わるものではありません。
          </li>
          <li>
            商品の効果・効能・使用感等については個人差があり、その正確性、有効性、安全性について一切保証いたしません。
          </li>
          <li>
            本サービスの利用に関連してユーザーに生じた健康上の問題、不利益、損害等について、当社は一切の責任を負いません。
          </li>
        </ol>

        <h2 className="text-2xl font-semibold mt-8 mb-4">第7条（アクセス解析・Cookieの使用）</h2>
        <ol className="list-decimal ml-6 mb-4">
          <li>
            本サービスでは、ユーザーの利便性向上および利用状況の分析のために、Google
            Analytics等のアクセス解析ツールを使用しています。
          </li>
          <li>
            これらのツールにより収集される情報は、匿名のトラフィックデータであり、個人を特定するものではありません。
          </li>
          <li>Cookieの使用については、別途定めるプライバシーポリシーに従います。</li>
        </ol>

        <h2 className="text-2xl font-semibold mt-8 mb-4">第8条（知的財産権）</h2>
        <p className="mb-4">
          本サービスに掲載される文章、画像、ロゴ等（ユーザーコンテンツを除く）に関する著作権等の知的財産権は、運営者または正当な権利者に帰属します。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">第9条（免責事項）</h2>
        <ol className="list-decimal ml-6 mb-4">
          <li>運営者は、ユーザーによる投稿内容の正確性・有用性・安全性について保証しません。</li>
          <li>
            ユーザー間、または第三者との間に生じたトラブルについて、運営者は一切責任を負いません。
          </li>
          <li>
            ユーザーが本サービスを利用して被ったいかなる損害についても、運営者は一切の責任を負いません。
          </li>
        </ol>

        <h2 className="text-2xl font-semibold mt-8 mb-4">
          第10条（サービス内容の変更・中断・終了）
        </h2>
        <p className="mb-4">
          運営者は、ユーザーへの事前通知なく、本サービスの内容を変更・中断・終了することがあります。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">第11条（将来的な有料サービス）</h2>
        <ol className="list-decimal ml-6 mb-4">
          <li>
            現在、本サービスは無料で提供されていますが、将来的に有料プランや有料機能を導入する場合があります。
          </li>
          <li>
            その際には、利用料金、支払方法、キャンセルポリシー等を別途定め、事前に通知いたします。
          </li>
        </ol>

        <h2 className="text-2xl font-semibold mt-8 mb-4">第12条（利用規約の変更）</h2>
        <p className="mb-4">
          運営者は、必要と判断した場合、本規約を変更することがあります。変更後の内容は、本サービス上に掲示された時点で効力を生じます。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">第13条（準拠法および管轄裁判所）</h2>
        <p className="mb-4">
          本規約の解釈および適用は日本法に準拠し、本サービスに関連して生じた紛争については、運営者の本店所在地を管轄する日本の裁判所を専属的合意管轄とします。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">附則</h2>
        <p className="mt-4 text-sm text-gray-600">
          制定日：2025年07月13日
          <br />
          最終更新日：2025年07月13日
        </p>
      </div>
    </div>
  )
}
