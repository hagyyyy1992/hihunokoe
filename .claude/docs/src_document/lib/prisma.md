# lib/prisma.ts

## 概要

Prisma ORMクライアントの初期化と管理を行うモジュール。データベース接続の可用性チェックとグレースフルフォールバックを提供します。

## 主要機能

### Prismaクライアントの初期化

```typescript
let prisma: PrismaClient | null = null

try {
  if (databaseUrl) {
    prisma =
      globalForPrisma.prisma ||
      new PrismaClient({
        datasources: {
          db: {
            url: databaseUrl,
          },
        },
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      })

    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prisma
    }
  }
} catch (error) {
  console.error('Prisma initialization error:', error)
  prisma = null
}
```

### シングルトンパターン

```typescript
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}
```

- 開発環境でのホットリロード時の複数接続を防止
- 本番環境では毎回新規インスタンス

### データベース可用性チェック

```typescript
export function isDatabaseAvailable(): boolean {
  return prisma !== null
}
```

- データベース接続の有無を簡単にチェック
- モックモードへの切り替え判定に使用

### データベース情報取得

```typescript
export function getDatabaseInfo() {
  const config = getDatabaseConfig()
  return {
    type: config.type,
    url: config.url ? '***' : null, // セキュリティのためマスク
    isAvailable: isDatabaseAvailable(),
    environment: process.env.NODE_ENV,
  }
}
```

## 設定オプション

### ログレベル

```typescript
log: process.env.NODE_ENV === 'development'
  ? ['query', 'error', 'warn'] // 開発時は詳細ログ
  : ['error'] // 本番はエラーのみ
```

### データソース

```typescript
datasources: {
  db: {
    url: databaseUrl // db-config.tsから取得
  }
}
```

## 使用方法

### 基本的な使用

```typescript
import { prisma, isDatabaseAvailable } from '@/lib/prisma'

// データベースが利用可能かチェック
if (isDatabaseAvailable() && prisma) {
  const users = await prisma.user.findMany()
} else {
  // モックデータを使用
}
```

### トランザクション

```typescript
if (prisma) {
  const result = await prisma.$transaction(async tx => {
    const user = await tx.user.create({ data: userData })
    const profile = await tx.profile.create({
      data: { userId: user.id, ...profileData },
    })
    return { user, profile }
  })
}
```

### エラーハンドリング

```typescript
try {
  if (!prisma) {
    throw new Error('Database not available')
  }

  const user = await prisma.user.findUnique({
    where: { email },
  })
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Prisma特有のエラー処理
  } else {
    // 一般的なエラー処理
  }
}
```

## エラーパターン

### 初期化エラー

- 無効なデータベースURL
- 接続タイムアウト
- 認証エラー

### 実行時エラー

- ユニーク制約違反（P2002）
- 外部キー制約違反（P2003）
- レコードが見つからない（P2025）

## パフォーマンス考慮事項

### 接続プーリング

- Prismaは自動的に接続プールを管理
- デフォルト設定で多くの場合十分

### クエリ最適化

```typescript
// N+1問題を避ける
const posts = await prisma.post.findMany({
  include: {
    user: true,
    comments: {
      include: {
        user: true,
      },
    },
  },
})
```

## 環境別の挙動

### 開発環境

- 詳細なクエリログ出力
- グローバル変数でインスタンス保持
- ホットリロード対応

### 本番環境

- エラーログのみ出力
- 毎回新規インスタンス作成
- パフォーマンス最適化

### モックモード

- prismaがnullの場合
- isDatabaseAvailable()がfalseを返す
- アプリケーションはモックデータを使用

## 関連ファイル

- `lib/db-config.ts`: データベース設定
- `prisma/schema.prisma`: データベーススキーマ
- `.env`: 環境変数設定

## トラブルシューティング

### データベースに接続できない

1. 環境変数を確認
2. データベースサーバーが起動しているか確認
3. ネットワーク接続を確認

### 開発時の複数接続エラー

- サーバーを再起動
- グローバル変数のキャッシュをクリア

### マイグレーションエラー

```bash
npx prisma migrate dev  # 開発環境
npx prisma migrate deploy  # 本番環境
```
