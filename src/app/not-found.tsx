import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">ページが見つかりません</h2>
        <p className="text-gray-600 mb-8">
          お探しのページは存在しないか、移動された可能性があります。
        </p>

        <div className="space-y-4 mb-8">
          <Link
            href="/"
            className="inline-block bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors mr-4"
          >
            ホームに戻る
          </Link>
          <Link
            href="/posts"
            className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            投稿を見る
          </Link>
        </div>

        <div className="border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-500 mb-4">
            お探しのページが見つからない場合は、以下のページもご確認ください：
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/help" className="text-pink-600 hover:text-pink-700 underline">
              ヘルプ
            </Link>
            <Link href="/contact" className="text-pink-600 hover:text-pink-700 underline">
              お問い合わせ
            </Link>
            <Link href="/guidelines" className="text-pink-600 hover:text-pink-700 underline">
              ガイドライン
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
