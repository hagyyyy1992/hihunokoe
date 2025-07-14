/**
 * メール送信時のベースURL取得ユーティリティ
 * Vercel環境変数を利用して正しいURLを生成
 */
export function getEmailBaseUrl(baseUrl?: string): string {
  // 1. 明示的に渡されたbaseUrlを優先
  if (baseUrl) return baseUrl

  // 2. Vercel環境変数から動的に生成
  if (process.env.VERCEL_URL) {
    // VERCEL_URLはhttps://を含まないため追加
    const protocol = process.env.VERCEL_ENV === 'production' ? 'https' : 'https'
    const url = `${protocol}://${process.env.VERCEL_URL}`
    return url
  }

  // 3. 明示的に設定された環境変数
  if (process.env.API_URL) return process.env.API_URL
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }

  // 4. デフォルト（ローカル開発環境）
  return 'http://localhost:3000'
}
