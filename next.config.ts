import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 画像アップロード機能は未実装のため、リモート画像パターンの設定を削除
  experimental: {
    // APIルートを最小限のFunctionにバンドルする（Vercel無料プラン対応）
    serverMinification: true,
  },
}

export default nextConfig
