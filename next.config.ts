import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 画像アップロード機能は未実装のため、リモート画像パターンの設定を削除
  experimental: {
    // APIルートを最小限のFunctionにバンドルする（Vercel無料プラン対応）
    serverMinification: true,
  },
  // 動的ルートの認識を強制
  generateBuildId: async () => {
    return 'build-id-' + new Date().getTime()
  },
  // 開発環境でのキャッシュ無効化（タイムラグ解消）
  ...(process.env.NODE_ENV === 'development' && {
    experimental: {
      serverMinification: true,
      // 開発時のキャッシュを短縮
      staleTimes: {
        dynamic: 0, // 動的ページキャッシュなし
        static: 30, // 静的リソース30秒
      },
    },
    // Router Cacheを無効化
    onDemandEntries: {
      // エントリーをすぐに無効化
      maxInactiveAge: 1000,
      pagesBufferLength: 2,
    },
  }),
}

export default nextConfig
