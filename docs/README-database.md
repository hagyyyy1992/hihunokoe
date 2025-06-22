# Database Configuration Guide

このプロジェクトは環境に応じて異なるデータベースを使用します：

- **Development (ローカル)**: PostgreSQL (Docker)
- **Production (本番)**: Supabase PostgreSQL

## セットアップ手順

### 1. ローカル開発環境

#### PostgreSQL の起動

```bash
# PostgreSQL コンテナを起動
npm run db:setup

# データベースの状態確認
npm run db:status
```

#### データベースの初期化

```bash
# Prisma マイグレーション実行
npm run db:migrate

# または、直接プッシュ
npm run db:push

# Prisma Studio でデータベース確認
npm run db:studio
```

#### 開発サーバー起動

```bash
npm run dev
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
# データベース関連
npm run db:setup     # PostgreSQL コンテナ起動
npm run db:stop      # コンテナ停止
npm run db:reset     # データベースリセット（軽度）
npm run db:nuke      # 完全データリセット（強制）
npm run db:clean     # Prismaマイグレーションリセット
npm run db:migrate   # マイグレーション実行
npm run db:studio    # Prisma Studio 起動
npm run db:push      # スキーマプッシュ
npm run db:status    # 現在の DB 設定確認
npm run db:seed      # サンプルデータ投入

# 開発・ビルド
npm run dev          # 開発サーバー起動
npm run build        # 本番ビルド（マイグレーション含む）
npm run build:local  # ローカルビルド（マイグレーションなし）
npm run start        # プロダクションサーバー起動
```

## データリセット方法

### 軽度なリセット（推奨）
```bash
npm run db:reset
```

### 完全リセット（データが残る場合）
```bash
npm run db:nuke
```

### Prismaマイグレーションリセット
```bash
npm run db:clean
```

### 手動でのトラブルシューティング
```bash
# 1. コンテナ停止・削除
docker-compose down

# 2. ボリューム確認
docker volume ls | grep usaka

# 3. ボリューム強制削除
docker volume rm usaka_postgres_data

# 4. 未使用ボリューム全削除
docker volume prune -f

# 5. 再起動
docker-compose up -d postgres

# 6. マイグレーション実行
npm run db:migrate
```

## 環境の確認

現在使用しているデータベースを確認：

```bash
npm run db:status
```

## トラブルシューティング

### ローカル PostgreSQL に接続できない場合

1. Docker が起動しているか確認
2. ポート 5432 が使用されていないか確認
3. コンテナを再起動: `npm run db:reset`

### Supabase 接続エラーの場合

1. 環境変数が正しく設定されているか確認
2. Supabase プロジェクトが有効か確認
3. データベーススキーマが作成されているか確認

### モックモードにする場合

環境変数を設定：

```env
USE_MOCK_DATA=true
```
