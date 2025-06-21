import Link from 'next/link'

export default function Home() {
  return (
    <div className="bg-gradient-to-b from-pink-50 to-white">
      {/* ヒーローセクション */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            化粧品の
            <span className="text-pink-600">リアルな体験</span>
            を共有しよう
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            成分や評価ではなく、実際の使い心地から「自分に合うかも」を見つける新しいコミュニティ
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/posts"
              className="bg-pink-600 text-white hover:bg-pink-700 px-8 py-4 rounded-full text-lg font-medium transition-colors inline-flex items-center justify-center"
            >
              体験談を見る
            </Link>
            <Link
              href="/posts/new"
              className="border border-pink-600 text-pink-600 hover:bg-pink-50 px-8 py-4 rounded-full text-lg font-medium transition-colors inline-flex items-center justify-center"
            >
              体験を投稿する
            </Link>
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">Usakaの特徴</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-pink-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">体験重視の投稿</h3>
              <p className="text-gray-600 leading-relaxed">
                成分表や点数評価ではなく、実際の使用感や肌の変化に焦点を当てた体験談を共有
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-pink-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">安心して投稿</h3>
              <p className="text-gray-600 leading-relaxed">
                「合わなかった」体験も大切な情報として受け入れる、優しいコミュニティ環境
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-pink-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">肌質別検索</h3>
              <p className="text-gray-600 leading-relaxed">
                肌タイプや季節、体調に合わせて、自分に近い状況での体験談を効率的に発見
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA セクション */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-pink-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            あなたの体験が、誰かの参考になる
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            化粧品選びで迷っている人のために、あなたのリアルな体験談を共有してみませんか？
          </p>
          <Link
            href="/auth/register"
            className="bg-pink-600 text-white hover:bg-pink-700 px-8 py-4 rounded-full text-lg font-medium transition-colors inline-flex items-center justify-center"
          >
            今すぐ始める
          </Link>
        </div>
      </section>
    </div>
  )
}
