/**
 * メール送信時のベースURL取得ユーティリティ
 * Vercel環境変数を利用して正しいURLを生成
 */
export function getEmailBaseUrl(baseUrl?: string): string {
  // 1. 明示的に渡されたbaseUrlを優先
  if (baseUrl) {
    console.log('Email URL Decision:', { finalUrl: baseUrl, reason: 'explicit baseUrl' })
    return baseUrl
  }

  // デバッグ用に環境変数をログ出力（常に出力）
  console.log('Email URL Environment Variables:', {
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF,
    VERCEL_URL: process.env.VERCEL_URL,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    API_URL: process.env.API_URL,
    NODE_ENV: process.env.NODE_ENV,
  })

  // 2. 環境別の固定URL（最優先）
  // staging環境の場合は固定URLを使用
  if (process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_GIT_COMMIT_REF === 'staging') {
    const finalUrl = 'https://staging.hihunokoe.com'
    console.log('Email URL Decision:', { finalUrl, reason: 'staging environment' })
    return finalUrl
  }

  // production環境の場合
  if (process.env.VERCEL_ENV === 'production') {
    const finalUrl = 'https://hihunokoe.com'
    console.log('Email URL Decision:', { finalUrl, reason: 'production environment' })
    return finalUrl
  }

  // 3. 明示的に設定された環境変数
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    console.log('Email URL Decision:', {
      finalUrl: process.env.NEXT_PUBLIC_BASE_URL,
      reason: 'NEXT_PUBLIC_BASE_URL',
    })
    return process.env.NEXT_PUBLIC_BASE_URL
  }
  if (process.env.API_URL) {
    console.log('Email URL Decision:', { finalUrl: process.env.API_URL, reason: 'API_URL' })
    return process.env.API_URL
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    console.log('Email URL Decision:', {
      finalUrl: process.env.NEXT_PUBLIC_API_URL,
      reason: 'NEXT_PUBLIC_API_URL',
    })
    return process.env.NEXT_PUBLIC_API_URL
  }

  // 4. Vercel環境変数から動的に生成（フォールバック）
  if (process.env.VERCEL_URL) {
    // VERCEL_URLはhttps://を含まないため追加
    const protocol = process.env.VERCEL_ENV === 'production' ? 'https' : 'https'
    const url = `${protocol}://${process.env.VERCEL_URL}`
    console.log('Email URL Decision:', { finalUrl: url, reason: 'VERCEL_URL fallback' })
    return url
  }

  // 5. デフォルト（ローカル開発環境）
  const finalUrl = 'http://localhost:3000'
  console.log('Email URL Decision:', { finalUrl, reason: 'default fallback' })
  return finalUrl
}
