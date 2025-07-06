# middleware.ts

## 概要

Next.jsミドルウェアファイル。すべてのリクエストに対してIPアドレス制限とセキュリティヘッダーの追加を行います。

## 主要機能

### 1. IPアドレス制限

環境変数で制御される柔軟なアクセス制限機能：

```typescript
const ipRestrictionEnabled = process.env.IP_RESTRICTION_ENABLED === 'true'
const allowedIps = process.env.ALLOWED_IPS?.split(',') || []
```

#### IP取得ロジック

以下の順番でクライアントIPを取得：

1. `x-forwarded-for` ヘッダー（プロキシ経由）
2. `x-real-ip` ヘッダー
3. `x-vercel-forwarded-for` ヘッダー（Vercel環境）
4. `request.ip`（直接接続）

### 2. セキュリティヘッダー

すべてのレスポンスに以下のヘッダーを追加：

- **X-Frame-Options: DENY** - クリックジャッキング対策
- **X-Content-Type-Options: nosniff** - MIMEタイプスニッフィング防止
- **Referrer-Policy: origin-when-cross-origin** - リファラー情報の制御

### 3. パス除外設定

以下のパスはミドルウェア処理から除外：

- `/_next/static/*` - Next.js静的アセット
- `/_next/image/*` - Next.js画像最適化
- `/favicon.ico` - ファビコン
- `/api/health` - ヘルスチェックエンドポイント

## 環境変数

| 変数名                   | 説明                               | デフォルト |
| ------------------------ | ---------------------------------- | ---------- |
| `IP_RESTRICTION_ENABLED` | IP制限を有効化                     | `false`    |
| `ALLOWED_IPS`            | 許可するIPアドレス（カンマ区切り） | なし       |

## カスタム403ページ

アクセスが拒否された場合、カスタムHTMLページを返します：

- シンプルなデザイン
- 「アクセスが制限されています」メッセージ
- サポート連絡先へのリンク

## 実装の特徴

- 型安全性（TypeScript）
- パフォーマンスを考慮した早期リターン
- Vercel環境対応
- 開発環境での柔軟な設定

## 使用例

```bash
# 環境変数の設定例
IP_RESTRICTION_ENABLED=true
ALLOWED_IPS=192.168.1.1,10.0.0.1
```
