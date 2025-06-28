# 管理画面 (Admin Panel)

## 概要

Usakaの管理画面は、システム管理者がアプリケーションを監視・運用するためのWebベース管理インターフェースです。

## 機能一覧

### 1. 認証・権限管理 ✅

- 管理者ログイン機能
- 役割ベースのアクセス制御（USER, ADMIN, SUPER_ADMIN）
- 操作ログの記録

### 2. ダッシュボード ✅

- システム統計（ユーザー数、投稿数、ビュー数、共感数）
- 最近のユーザー・投稿一覧
- リアルタイム監視データ

### 3. ユーザー管理 ✅

- ユーザー一覧・検索・フィルタリング
- ユーザーアカウントの有効化/無効化
- CSVエクスポート機能
- ユーザー詳細情報の表示

### 4. 投稿管理（コンテンツモデレーション） ✅

- 投稿一覧・検索・フィルタリング
- 投稿の公開/非公開/削除
- ステータス別表示

### 5. 通報管理 🚧

- 通報一覧表示（実装予定）
- 通報審査フロー（実装予定）
- 対応ステータス管理（実装予定）

### 6. システム設定 🚧

- マスターデータ管理（実装予定）
- NGワード管理（実装予定）
- お知らせ管理（実装予定）

## アクセス方法

### URL

```
http://localhost:3000/admin/login
```

### ログイン情報

- **スーパー管理者**

  - メール: `admin@example.com`
  - パスワード: `demo123`

- **一般ユーザー**（参考）
  - メール: `demo@example.com`
  - パスワード: `demo123`

## 技術構成

### フロントエンド

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS v4
- **UIコンポーネント**: カスタムコンポーネント（shadcn/ui ベース）
- **アイコン**: Lucide React

### バックエンド

- **API**: Next.js API Routes
- **認証**: JWT + bcrypt
- **ミドルウェア**: カスタム管理者認証ミドルウェア
- **ログ**: 管理者操作ログ

### データベース

- **ORM**: Prisma
- **データベース**: PostgreSQL
- **モック対応**: データベース未接続時のモックデータ対応

## ディレクトリ構成

```
src/
├── app/admin/                     # 管理画面ページ
│   ├── layout.tsx                 # 管理画面レイアウト
│   ├── login/page.tsx             # ログインページ
│   ├── dashboard/page.tsx         # ダッシュボード
│   ├── users/page.tsx             # ユーザー管理
│   ├── posts/page.tsx             # 投稿管理
│   ├── reports/page.tsx           # 通報管理
│   └── settings/page.tsx          # システム設定
├── app/api/admin/                 # 管理API
│   ├── auth/login/route.ts        # 管理者認証
│   ├── dashboard/stats/route.ts   # ダッシュボード統計
│   ├── users/                     # ユーザー管理API
│   └── posts/                     # 投稿管理API
├── lib/auth/
│   ├── auth.ts                    # 認証ロジック（管理者機能追加）
│   └── admin-middleware.ts        # 管理者認証ミドルウェア
└── components/ui/                 # UIコンポーネント
    ├── card.tsx
    ├── button.tsx
    ├── table.tsx
    ├── alert-dialog.tsx
    └── ...
```

## セキュリティ

### 認証

- JWT トークンベース認証
- 管理者権限チェック
- セッション管理

### 認可

- 役割ベースアクセス制御（RBAC）
- エンドポイント毎の権限チェック
- 操作ログの記録

### データ保護

- 入力値検証
- SQLインジェクション対策（Prisma）
- XSS対策

## 監査ログ

管理者の全操作は`AdminLog`テーブルに記録されます：

```typescript
{
  id: string
  userId: string        // 操作者ID
  action: string        // 操作種別
  target?: string       // 対象ID
  details?: Json        // 操作詳細
  ipAddress?: string    # IPアドレス
  userAgent?: string    # ユーザーエージェント
  createdAt: DateTime   # 実行日時
}
```

### 記録される操作

- `ADMIN_LOGIN` - 管理者ログイン
- `USER_SUSPEND` - ユーザー停止
- `USER_ACTIVATE` - ユーザー復活
- `POST_PUBLISH` - 投稿公開
- `POST_UNPUBLISH` - 投稿非公開
- `POST_DELETE` - 投稿削除
- `USERS_EXPORT` - ユーザーCSVエクスポート

## 開発・デプロイ

### 開発環境

```bash
# データベース起動
npm run db:setup

# 管理者ユーザー作成
npm run db:seed

# 開発サーバー起動
npm run dev
```

### 本番環境

```bash
# ビルド
npm run build

# データベースマイグレーション
npm run db:migrate

# サーバー起動
npm start
```

## 今後の拡張予定

### Phase 2

- 通報管理システムの完全実装
- リアルタイム通知機能
- 高度な分析・レポート機能

### Phase 3

- ダッシュボードの可視化強化
- 自動化されたコンテンツモデレーション
- API レート制限管理

## トラブルシューティング

### よくある問題

1. **ログインできない**

   - 管理者ユーザーが作成されているか確認: `npm run db:seed`
   - データベース接続を確認

2. **データが表示されない**

   - データベースが起動しているか確認
   - モックモードで動作しているか確認

3. **権限エラー**
   - ユーザーの`role`フィールドが正しく設定されているか確認
   - JWT トークンが有効か確認

### ログの確認

```bash
# アプリケーションログ
npm run dev

# データベースログ
npm run db:studio
```

## お問い合わせ

管理画面に関する質問やバグ報告は、開発チームまでお知らせください。
