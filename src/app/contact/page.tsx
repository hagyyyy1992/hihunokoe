import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'お問い合わせ - Usaka',
  description: 'Usakaへのお問い合わせ',
}

export default function Contact() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
        <p className="text-yellow-800 text-sm font-medium">
          ⚠️ このページは仮のテキストです。内容は後で正式に作成されます。
        </p>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">お問い合わせ</h1>

      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <p className="text-gray-600 mb-6">
            Usakaに関するご質問、ご要望、不具合報告などがございましたら、以下のフォームからお気軽にお問い合わせください。
          </p>
        </section>

        <section className="mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <form className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  お名前 *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  お問い合わせ種類 *
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                >
                  <option value="">選択してください</option>
                  <option value="bug">不具合報告</option>
                  <option value="feature">機能要望</option>
                  <option value="account">アカウントについて</option>
                  <option value="content">投稿内容について</option>
                  <option value="other">その他</option>
                </select>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  件名 *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  お問い合わせ内容 *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="お問い合わせ内容を詳細にご記入ください"
                />
              </div>

              <div className="bg-gray-50 rounded-md p-4">
                <p className="text-sm text-gray-600">
                  ※ 現在フォームは実装中です。お急ぎの場合は直接メールでお問い合わせください。
                  <br />
                  📧 contact@usaka.example.com（仮のアドレス）
                </p>
              </div>

              <button
                type="submit"
                disabled
                className="w-full bg-gray-400 text-white py-3 px-4 rounded-md font-medium cursor-not-allowed"
              >
                送信（実装中）
              </button>
            </form>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">よくある質問</h2>
          <p className="text-gray-600 mb-4">
            お問い合わせの前に、
            <a href="/help" className="text-pink-600 hover:text-pink-700 underline">
              ヘルプページ
            </a>
            もご確認ください。多くの質問への回答が掲載されています。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">お返事について</h2>
          <p className="text-gray-600">
            お問い合わせいただいた内容については、通常2-3営業日以内にご返答いたします。お急ぎの場合は、その旨をお問い合わせ内容に記載してください。
          </p>
        </section>
      </div>
    </div>
  )
}
