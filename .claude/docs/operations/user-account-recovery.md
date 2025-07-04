# ユーザーアカウント復旧手順

## 概要

Usakaでは、ユーザーアカウントの削除に論理削除を採用しています。これにより、誤って削除されたアカウントやデータの復旧が可能です。

## 論理削除の仕組み

### 削除時の動作

1. `users.deleted_at`に削除日時を設定
2. `users.is_active`を`false`に変更
3. 退会完了メールを送信
4. 認証システムから除外（ログイン不可）

### データの保持

- ユーザープロフィール情報
- 投稿した体験談（Post）
- コメントと共感履歴（Comment, Empathy）
- その他の関連データ

すべてのデータが物理的に保持されるため、復旧時に完全な状態で戻すことができます。

## 復旧手順

### 1. 削除されたユーザーの確認

```sql
-- 削除されたユーザー一覧を表示
SELECT
    id,
    user_name,
    email,
    deleted_at,
    created_at
FROM users
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC;
```

### 2. ユーザーアカウントの復旧

#### メールアドレスで復旧

```sql
UPDATE users
SET
    deleted_at = NULL,
    is_active = true
WHERE
    email = 'user@example.com'
    AND deleted_at IS NOT NULL;
```

#### ユーザーIDで復旧

```sql
UPDATE users
SET
    deleted_at = NULL,
    is_active = true
WHERE
    id = '550e8400-e29b-41d4-a716-446655440000'
    AND deleted_at IS NOT NULL;
```

#### ユーザー名で復旧

```sql
UPDATE users
SET
    deleted_at = NULL,
    is_active = true
WHERE
    user_name = 'username'
    AND deleted_at IS NOT NULL;
```

### 3. 復旧の確認

```sql
-- 復旧したユーザーの確認
SELECT
    id,
    user_name,
    email,
    is_active,
    deleted_at,
    updated_at
FROM users
WHERE email = 'user@example.com';
```

## 復旧後の動作

### 即座に利用可能になる機能

- ログイン
- プロフィール表示
- 投稿の閲覧・編集
- コメント・共感機能
- その他すべての機能

### 復旧通知

現在、復旧時の自動通知機能はありません。必要に応じて手動でユーザーに連絡してください。

## 注意事項

### データベースアクセス

- 本番環境での作業は十分注意して実行
- 必ずバックアップを取得してから作業
- 変更前に対象ユーザーの確認を徹底

### セキュリティ

- 復旧作業のログを記録
- 作業者と承認者を明確化
- 不正な復旧要求に注意

### 制限事項

- メールアドレスが重複する場合は復旧不可
- 関連データの整合性は自動で保たれる

## トラブルシューティング

### メールアドレス重複エラー

```sql
-- 同じメールアドレスのアクティブユーザーが存在するかチェック
SELECT email, is_active, deleted_at
FROM users
WHERE email = 'user@example.com';
```

### 復旧に失敗する場合

1. ユーザーが実際に削除されているか確認
2. 外部キー制約違反がないかチェック
3. データベース権限を確認

## 運用上の推奨事項

### 定期メンテナンス

- 古い削除データの定期確認
- 必要に応じて物理削除の検討（6ヶ月〜1年後）

### ログ管理

復旧作業は必ず記録を残し、以下の情報を含める：

- 作業日時
- 対象ユーザー情報
- 作業者
- 復旧理由
- 承認者

## 関連ファイル

- `src/lib/auth/auth.ts` - 論理削除機能
- `src/app/api/auth/delete-account/route.ts` - 削除API
- `prisma/schema.prisma` - データベーススキーマ
- `migrations/20250628153601_add_deleted_at_to_user/` - 論理削除マイグレーション
