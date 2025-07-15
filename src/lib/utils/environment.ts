/**
 * 環境判定ユーティリティ
 */

/**
 * ステージング環境かどうかを判定
 * @returns {boolean} ステージング環境の場合true
 */
export function isStaging(): boolean {
  // Vercel環境でステージングブランチの場合
  if (process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_GIT_COMMIT_REF === 'staging') {
    return true
  }

  // 明示的なステージング環境変数が設定されている場合
  if (process.env.NEXT_PUBLIC_ENV === 'staging') {
    return true
  }

  // ドメインベースの判定（クライアントサイドでも使用可能）
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    return hostname.includes('staging') || hostname.includes('stg')
  }

  return false
}

/**
 * プロダクション環境かどうかを判定
 * @returns {boolean} プロダクション環境の場合true
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' && !isStaging()
}

/**
 * 開発環境かどうかを判定
 * @returns {boolean} 開発環境の場合true
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * 環境名を取得
 * @returns {string} 環境名（development, staging, production）
 */
export function getEnvironment(): 'development' | 'staging' | 'production' {
  if (isDevelopment()) return 'development'
  if (isStaging()) return 'staging'
  return 'production'
}
