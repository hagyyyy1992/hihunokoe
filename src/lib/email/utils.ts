/**
 * メール送信時のベースURL取得ユーティリティ
 * Vercel環境変数を利用して正しいURLを生成
 */
export function getEmailBaseUrl(baseUrl?: string): string {
  // 1. 明示的に渡されたbaseUrlを優先
  if (baseUrl) return baseUrl

  // デバッグ用に環境変数をログ出力（開発環境のみ、テスト環境では無効）
  if (process.env.NODE_ENV === 'development') {
    console.log('Email URL Environment Variables:', {
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF,
      VERCEL_URL: process.env.VERCEL_URL,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      API_URL: process.env.API_URL,
      NODE_ENV: process.env.NODE_ENV,
    })
  }

  // 2. 環境別の固定URL（最優先）
  // staging環境の場合は固定URLを使用
  if (process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_GIT_COMMIT_REF === 'staging') {
    return 'https://staging.hihunokoe.com'
  }

  // production環境の場合
  if (process.env.VERCEL_ENV === 'production') {
    return 'https://hihunokoe.com'
  }

  // 3. 明示的に設定された環境変数
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }
  if (process.env.API_URL) return process.env.API_URL
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }

  // 4. Vercel環境変数から動的に生成（フォールバック）
  if (process.env.VERCEL_URL) {
    // VERCEL_URLはhttps://を含まないため追加
    const protocol = process.env.VERCEL_ENV === 'production' ? 'https' : 'https'
    const url = `${protocol}://${process.env.VERCEL_URL}`
    return url
  }

  // 5. デフォルト（ローカル開発環境）
  return 'http://localhost:3000'
}
