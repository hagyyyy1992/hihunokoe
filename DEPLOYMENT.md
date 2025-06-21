# 本番デプロイ設定ガイド

## Vercel 環境変数設定

Vercel Dashboard で以下の環境変数を設定してください：

### 必須環境変数

```bash
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.getpoicarcllsyvdzncp.supabase.co:5432/postgres

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://getpoicarcllsyvdzncp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Environment
NODE_ENV=production
USE_MOCK_DATA=false

# Auth (optional - will use default if not set)
NEXTAUTH_SECRET=your_production_secret_key
```

## デプロイフロー

1. **ローカルでテスト**
   ```bash
   npm run build
   npm run start
   ```

2. **mainブランチにプッシュ**
   ```bash
   git add .
   git commit -m "your commit message"
   git push origin main
   ```

3. **自動実行される処理**
   - Vercel ビルド開始
   - `npm run build:production` 実行
   - Prisma Client 生成
   - データベースマイグレーション実行
   - Next.js ビルド
   - デプロイ完了

## マイグレーション詳細

### 本番マイグレーション (`prisma migrate deploy`)
- 本番データベースに安全にマイグレーション適用
- データ損失なし
- ロールバック不可（慎重に実行）

### ローカル開発マイグレーション (`prisma migrate dev`)
- 開発用データベースでマイグレーション作成・適用
- データリセット可能

## トラブルシューティング

### マイグレーション失敗
```bash
# ローカルでマイグレーション確認
DATABASE_URL="your_production_url" npx prisma migrate status

# 手動マイグレーション実行
DATABASE_URL="your_production_url" npx prisma migrate deploy
```

### ビルド失敗
1. 環境変数が正しく設定されているか確認
2. Supabase データベースが起動しているか確認
3. DATABASE_URL の接続文字列が正しいか確認

## Supabase設定

### SQL エディタで実行が必要な場合
```sql
-- RLS (Row Level Security) 設定例
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 必要に応じてポリシー追加
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);
```

## 監視・ログ

- Vercel Functions: API応答時間監視
- Supabase Dashboard: データベース使用量監視
- エラーログ: Vercel Functions タブで確認