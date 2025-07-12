export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">利用規約</h1>

      <div className="prose prose-gray max-w-none">
        <p className="mb-4">
          本利用規約（以下「本規約」といいます。）は、Hihunokoe（以下「当サービス」といいます。）の利用条件を定めるものです。
          登録ユーザーの皆さま（以下「ユーザー」といいます。）には、本規約に従って当サービスをご利用いただきます。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">第1条（適用）</h2>
        <p className="mb-4">
          本規約は、ユーザーと当サービス運営者との間の当サービスの利用に関わる一切の関係に適用されるものとします。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">第2条（利用登録）</h2>
        <ol className="list-decimal ml-6 mb-4">
          <li>
            登録希望者が当サービスの定める方法によって利用登録を申請し、当サービスがこれを承認することによって、利用登録が完了するものとします。
          </li>
          <li>
            当サービスは、利用登録の申請者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあります。
            <ul className="list-disc ml-6 mt-2">
              <li>利用登録の申請に際して虚偽の事項を届け出た場合</li>
              <li>本規約に違反したことがある者からの申請である場合</li>
              <li>その他、当サービスが利用登録を相当でないと判断した場合</li>
            </ul>
          </li>
        </ol>

        <h2 className="text-2xl font-semibold mt-8 mb-4">
          第3条（ユーザーIDおよびパスワードの管理）
        </h2>
        <ol className="list-decimal ml-6 mb-4">
          <li>
            ユーザーは、自己の責任において、当サービスのユーザーIDおよびパスワードを適切に管理するものとします。
          </li>
          <li>
            ユーザーは、いかなる場合にも、ユーザーIDおよびパスワードを第三者に譲渡または貸与することはできません。
          </li>
        </ol>

        <h2 className="text-2xl font-semibold mt-8 mb-4">第4条（投稿内容）</h2>
        <p className="mb-4">
          ユーザーは、当サービスに投稿する内容について、以下の事項を遵守するものとします：
        </p>
        <ul className="list-disc ml-6 mb-4">
          <li>法令に違反しない内容であること</li>
          <li>他人の権利を侵害しない内容であること</li>
          <li>公序良俗に反しない内容であること</li>
          <li>虚偽の情報でないこと</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">第5条（個人情報の取扱い）</h2>
        <p className="mb-4">
          当サービスの利用によって取得する個人情報については、当サービスのプライバシーポリシーに従って適切に取り扱うものとします。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">第6条（免責事項）</h2>
        <ol className="list-decimal ml-6 mb-4">
          <li>
            当サービスは、化粧品に関する体験談の共有を目的としており、医学的なアドバイスを提供するものではありません。
          </li>
          <li>
            当サービスに掲載される情報の正確性、有用性、安全性等について、当サービスは一切の責任を負いません。
          </li>
          <li>ユーザー間のトラブルについて、当サービスは一切の責任を負いません。</li>
        </ol>

        <h2 className="text-2xl font-semibold mt-8 mb-4">第7条（サービス内容の変更等）</h2>
        <p className="mb-4">
          当サービスは、ユーザーに通知することなく、サービスの内容を変更または提供を中止することができるものとします。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">第8条（利用規約の変更）</h2>
        <p className="mb-4">
          当サービスは、必要と判断した場合には、ユーザーに通知することなく、いつでも本規約を変更することができるものとします。
          変更後の本規約は、当サービス上に掲示された時点から効力を生じるものとします。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">第9条（準拠法・裁判管轄）</h2>
        <ol className="list-decimal ml-6 mb-4">
          <li>本規約の解釈にあたっては、日本法を準拠法とします。</li>
          <li>
            当サービスに関して紛争が生じた場合には、当サービス運営者の本店所在地を管轄する裁判所を専属的合意管轄とします。
          </li>
        </ol>

        <p className="mt-8 text-sm text-gray-600">
          制定日：2025年1月1日
          <br />
          最終更新日：2025年1月1日
        </p>
      </div>
    </div>
  )
}
