import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ガイドライン - Usaka',
  description: 'Usakaコミュニティのガイドライン',
}

export default function Guidelines() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
        <p className="text-yellow-800 text-sm font-medium">
          ⚠️ このページは仮のテキストです。内容は後で正式に作成されます。
        </p>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">コミュニティガイドライン</h1>

      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">基本理念</h2>
          <p className="text-gray-600 mb-4">
            Usakaは化粧品の体験を安心して共有できるコミュニティです。すべてのユーザーが快適に利用できるよう、以下のガイドラインを設けています。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">投稿について</h2>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>化粧品の実際の使用体験に基づいた投稿をお願いします</li>
            <li>誹謗中傷や不適切な表現は禁止です</li>
            <li>商品の宣伝目的の投稿はご遠慮ください</li>
            <li>他のユーザーの投稿を尊重し、建設的なコメントを心がけてください</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">プライバシーについて</h2>
          <p className="text-gray-600 mb-4">
            個人を特定できる情報の投稿は避けてください。また、他のユーザーのプライバシーも尊重してください。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">違反について</h2>
          <p className="text-gray-600 mb-4">
            ガイドラインに違反する投稿やコメントを発見した場合は、運営チームまでご報告ください。適切に対応いたします。
          </p>
        </section>
      </div>
    </div>
  )
}
