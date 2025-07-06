# layout.tsx

## 概要

Next.js アプリケーションのルートレイアウトコンポーネント。すべてのページで共通して使用されるHTML構造、メタデータ、プロバイダーを定義します。

## 機能

### フォント設定

- **Geist Sans**: UIテキスト用フォント
- **Geist Mono**: 等幅フォント
- Next.jsのGoogle Fonts最適化を使用

### メタデータ

```typescript
export const metadata: Metadata = {
  title: `${SERVICE_NAME} - コスメ体験をシェアしよう`,
  description: 'ユーザーの素直な感想を共有できるコスメ体験投稿サービス',
}
```

### レイアウト構造

1. **AuthProvider**: 認証状態をアプリケーション全体で管理
2. **Header**: 全ページ共通のヘッダーナビゲーション
3. **main**: メインコンテンツエリア（最小高さ100vh）
4. **Footer**: 全ページ共通のフッター

## 依存関係

- `@/components/layout/Header`: ヘッダーコンポーネント
- `@/components/layout/Footer`: フッターコンポーネント
- `@/lib/auth/AuthContext`: 認証コンテキストプロバイダー
- `@/lib/constants`: アプリケーション定数（SERVICE_NAME）

## スタイリング

- Tailwind CSSを使用
- レスポンシブデザイン対応
- グラデーション背景（グレーから白へ）

## 使用方法

このファイルは自動的にNext.jsによって使用され、すべてのページコンポーネントをラップします。直接インポートする必要はありません。
