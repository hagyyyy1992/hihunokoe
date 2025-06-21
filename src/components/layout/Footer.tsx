import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* ロゴとサービス説明 */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                <span className="text-pink-600 font-bold text-sm">U</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">Usaka</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed max-w-md">
              化粧品の本当の使い心地を、体験談で共有するコミュニティ。
              成分や評価ではなく、リアルな体験で「自分に合うかも」を見つけよう。
            </p>
          </div>

          {/* サービス */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">サービス</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/posts"
                  className="text-sm text-gray-600 hover:text-pink-600 transition-colors"
                >
                  体験を見る
                </Link>
              </li>
              <li>
                <Link
                  href="/posts/new"
                  className="text-sm text-gray-600 hover:text-pink-600 transition-colors"
                >
                  体験を投稿
                </Link>
              </li>
              <li>
                <Link
                  href="/search"
                  className="text-sm text-gray-600 hover:text-pink-600 transition-colors"
                >
                  検索
                </Link>
              </li>
            </ul>
          </div>

          {/* サポート */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">サポート</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/guidelines"
                  className="text-sm text-gray-600 hover:text-pink-600 transition-colors"
                >
                  投稿ガイドライン
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="text-sm text-gray-600 hover:text-pink-600 transition-colors"
                >
                  ヘルプ
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-gray-600 hover:text-pink-600 transition-colors"
                >
                  お問い合わせ
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-gray-600 hover:text-pink-600 transition-colors"
                >
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-gray-600 hover:text-pink-600 transition-colors"
                >
                  利用規約
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-sm text-gray-500">© 2024 Usaka. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
