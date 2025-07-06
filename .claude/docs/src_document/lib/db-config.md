# lib/db-config.ts

## 概要

データベース接続設定を一元管理するモジュール。環境に応じて適切なデータベース（ローカル、Supabase、モック）を自動選択します。

## 設定タイプ

```typescript
interface DatabaseConfig {
  type: 'local' | 'supabase' | 'mock'
  url: string | null
}
```

## 環境別設定

### 1. モックモード

```typescript
if (process.env.USE_MOCK_DATA === 'true') {
  return {
    type: 'mock',
    url: null,
  }
}
```

- `USE_MOCK_DATA=true`の場合に有効
- データベース接続なしで動作
- 開発やデモ用途

### 2. 本番環境（Supabase）

```typescript
if (process.env.NODE_ENV === 'production' || process.env.DATABASE_URL) {
  return {
    type: 'supabase',
    url:
      process.env.DATABASE_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL_NON_POOLING,
  }
}
```

- 本番環境で自動的に使用
- 複数の環境変数をチェック（優先順位あり）
- Supabaseの接続文字列を使用

### 3. 開発環境（ローカルPostgreSQL）

```typescript
return {
  type: 'local',
  url:
    process.env.DATABASE_URL ||
    'postgresql://cosmetics_user:cosmetics_pass@localhost:5432/cosmetics_share_db',
}
```

- Docker PostgreSQLを使用
- デフォルトの接続情報を提供
- カスタマイズ可能

## 主要関数

### getDatabaseConfig()

```typescript
export function getDatabaseConfig(): DatabaseConfig {
  // 環境に基づいて適切な設定を返す
}
```

### getDatabaseUrl()

```typescript
export function getDatabaseUrl(): string | null {
  const config = getDatabaseConfig()

  if (config.url) {
    console.log(`Using ${config.type} database`)
  } else {
    console.log('Using mock data (no database)')
  }

  return config.url
}
```

## 環境変数

| 変数名                     | 説明                      | 例                                |
| -------------------------- | ------------------------- | --------------------------------- |
| `USE_MOCK_DATA`            | モックモードの有効化      | `true`                            |
| `DATABASE_URL`             | プライマリデータベースURL | `postgresql://...`                |
| `POSTGRES_PRISMA_URL`      | Prisma用URL（Vercel）     | `postgresql://...?pgbouncer=true` |
| `POSTGRES_URL_NON_POOLING` | 非プーリング接続URL       | `postgresql://...`                |

## 使用例

### 基本的な使用

```typescript
import { getDatabaseUrl, getDatabaseConfig } from '@/lib/db-config'

const dbUrl = getDatabaseUrl()
if (dbUrl) {
  // データベース接続あり
  console.log('Database connected')
} else {
  // モックモード
  console.log('Running in mock mode')
}
```

### 設定情報の確認

```typescript
const config = getDatabaseConfig()
console.log(`Database type: ${config.type}`)
console.log(`Has connection: ${config.url !== null}`)
```

### Prismaとの統合

```typescript
// prisma.tsで使用
const databaseUrl = getDatabaseUrl()

if (databaseUrl) {
  prisma = new PrismaClient({
    datasources: {
      db: { url: databaseUrl },
    },
  })
}
```

## 環境別の動作

### 開発環境

```bash
# .env.local
DATABASE_URL=postgresql://cosmetics_user:cosmetics_pass@localhost:5432/cosmetics_share_db
```

### 本番環境（Vercel + Supabase）

```bash
# Vercel環境変数
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]
POSTGRES_PRISMA_URL=postgresql://[user]:[password]@[host]/[database]?pgbouncer=true
```

### モックモード

```bash
# .env.local
USE_MOCK_DATA=true
```

## セキュリティ考慮事項

### パスワードマスキング

```typescript
// getDatabaseInfo()では接続文字列をマスク
url: config.url ? '***' : null
```

### 環境変数の優先順位

1. `DATABASE_URL`
2. `POSTGRES_PRISMA_URL`（Vercel推奨）
3. `POSTGRES_URL_NON_POOLING`
4. デフォルト値（開発環境のみ）

## トラブルシューティング

### データベースに接続できない

1. 環境変数が正しく設定されているか確認
2. Dockerコンテナが起動しているか確認（開発環境）
3. ネットワーク接続を確認

### モックモードが有効にならない

- `USE_MOCK_DATA`が文字列の`"true"`であることを確認
- 環境変数の読み込みタイミングを確認

### 本番環境で接続エラー

- Supabaseのダッシュボードで接続文字列を確認
- SSL設定が正しいか確認
- 接続プールの設定を確認

## ベストプラクティス

1. **環境変数の管理**

   - `.env.local`はGitにコミットしない
   - 本番環境の認証情報は安全に管理

2. **接続文字列の形式**

   ```
   postgresql://[user]:[password]@[host]:[port]/[database]?[options]
   ```

3. **開発時の切り替え**
   - モックモードで素早く開発開始
   - 必要に応じてローカルDBに切り替え

## 関連ファイル

- `lib/prisma.ts`: Prismaクライアント初期化
- `docker-compose.yml`: ローカルPostgreSQL設定
- `.env.example`: 環境変数のテンプレート
