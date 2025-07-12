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
}

export default nextConfig
