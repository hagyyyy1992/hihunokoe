/**
 * メール送信時のベースURL取得ユーティリティ
 * Vercel環境変数を利用して正しいURLを生成
 */
export function getEmailBaseUrl(baseUrl?: string): string {
  // デバッグログ
  if (process.env.NODE_ENV !== 'production') {
    console.log('[getEmailBaseUrl] Environment variables:', {
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      API_URL: process.env.API_URL,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    })
  }

  // 1. 明示的に渡されたbaseUrlを優先
  if (baseUrl) {
    console.log('[getEmailBaseUrl] Using provided baseUrl:', baseUrl)
    return baseUrl
  }

  // 2. Vercel環境変数から動的に生成
  if (process.env.VERCEL_URL) {
    // VERCEL_URLはhttps://を含まないため追加
    const protocol = process.env.VERCEL_ENV === 'production' ? 'https' : 'https'
    const url = `${protocol}://${process.env.VERCEL_URL}`
    console.log('[getEmailBaseUrl] Using VERCEL_URL:', url)
    return url
  }

  // 3. 明示的に設定された環境変数
  if (process.env.API_URL) {
    console.log('[getEmailBaseUrl] Using API_URL:', process.env.API_URL)
    return process.env.API_URL
  }

  if (process.env.NEXT_PUBLIC_BASE_URL) {
    console.log('[getEmailBaseUrl] Using NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL)
    return process.env.NEXT_PUBLIC_BASE_URL
  }

  if (process.env.NEXT_PUBLIC_API_URL) {
    console.log('[getEmailBaseUrl] Using NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)
    return process.env.NEXT_PUBLIC_API_URL
  }

  // 4. デフォルト（ローカル開発環境）
  console.log('[getEmailBaseUrl] Using default localhost')
  return 'http://localhost:3000'
}
