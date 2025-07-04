# Database Configuration Guide

このプロジェクトは環境に応じて異なるデータベースを使用します：

- **Development (ローカル)**: Supabase Local (Docker)
- **Production (本番)**: Supabase PostgreSQL

## セットアップ手順

### 1. ローカル開発環境

#### Supabase Local の起動

```bash
# Supabase CLI インストール (未インストールの場合)
brew install supabase/tap/supabase

# Supabase ローカル環境を起動
supabase start

# Supabase 状態確認
supabase status
```

#### データベースの初期化

```bash
# Prisma マイグレーション実行
npx prisma migrate dev

# Prisma Studio でデータベース確認
npx prisma studio
```

#### MailHog起動 (メール機能テスト用)

```bash
# MailHog コンテナを起動
npm run mailhog:start

# MailHog管理画面: http://localhost:8025
```

#### 開発サーバー起動

```bash
# 個別起動
npm run dev

# 一括起動 (Supabase + MailHog + Next.js)
npm run dev:full
```

### 2. 本番環境 (Supabase)

#### 環境変数の設定

Vercel / Netlify などで以下を設定：

```env
NODE_ENV=production
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.getpoicarcllsyvdzncp.supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://getpoicarcllsyvdzncp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
USE_MOCK_DATA=false
```

#### Supabase でのスキーマ作成

Supabase Dashboard の SQL Editor で実行：

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  name VARCHAR,
  avatar_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES users(id),
  cosmetic_name VARCHAR,
  cosmetic_category VARCHAR,
  skin_type VARCHAR,
  mood_tag VARCHAR,
  usage_situation JSONB,
  experience_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_mood_tag ON posts(mood_tag);
```

## 利用可能なコマンド

```bash
# Supabase関連
supabase start       # Supabaseローカル環境起動
supabase stop        # Supabaseローカル環境停止
supabase status      # 状態確認
supabase reset       # ローカル環境リセット

# データベース関連
npx prisma migrate dev    # マイグレーション実行
npx prisma studio         # Prisma Studio 起動
npx prisma generate       # Prismaクライアント生成

# メール関連
npm run mailhog:start     # MailHog起動
npm run mailhog:stop      # MailHog停止

# 開発・ビルド
npm run dev          # 開発サーバー起動
npm run dev:full     # Supabase + MailHog + Next.js 一括起動
npm run build        # 本番ビルド（マイグレーション含む）
npm run build:local  # ローカルビルド（マイグレーションなし）
npm run start        # プロダクションサーバー起動
```

## データリセット方法

### Supabase環境リセット（推奨）

```bash
# Supabaseローカル環境をリセット
supabase reset

# マイグレーション再実行
npx prisma migrate dev
```

### 完全リセット（データが残る場合）

```bash
# Supabase停止
supabase stop

# Docker環境クリーンアップ
docker system prune -f

# Supabase再起動
supabase start

# マイグレーション実行
npx prisma migrate dev
```

### MailHogリセット

```bash
# MailHog停止・再起動
npm run mailhog:stop
npm run mailhog:start
```

### 手動でのトラブルシューティング

```bash
# 1. 全サービス停止
supabase stop
npm run mailhog:stop

# 2. Docker環境確認
docker ps -a
docker volume ls

# 3. Supabase関連ボリューム削除
docker volume prune -f

# 4. 再起動
supabase start
npm run mailhog:start

# 5. マイグレーション実行
npx prisma migrate dev
```

## 環境の確認

現在使用しているデータベースを確認：

```bash
# Supabase状態確認
supabase status

# 環境変数確認
echo $DATABASE_URL

# 接続テスト
npx prisma studio
```

## 開発環境URL

- **アプリケーション**: http://localhost:3000
- **Supabase Studio**: http://localhost:54323
- **MailHog (メールテスト)**: http://localhost:8025
- **Prisma Studio**: http://localhost:5555

## トラブルシューティング

### Supabase Local に接続できない場合

1. Docker が起動しているか確認
2. ポート競合確認 (54322, 54323等)
3. Supabase再起動: `supabase stop && supabase start`

### メール送信テストができない場合

1. MailHogが起動しているか確認: `docker ps | grep mailhog`
2. ポート1025, 8025の競合確認
3. MailHog再起動: `npm run mailhog:stop && npm run mailhog:start`

### マイグレーションエラーの場合

1. 接続先データベース確認: `echo $DATABASE_URL`
2. Supabase状態確認: `supabase status`
3. 強制マイグレーション: `npx prisma migrate reset --force`

### 本番環境接続エラーの場合

1. 環境変数が正しく設定されているか確認
2. Supabase プロジェクトが有効か確認
3. データベーススキーマが作成されているか確認

### モックモードにする場合

環境変数を設定：

```env
USE_MOCK_DATA=true
```
