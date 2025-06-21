# データベース設計書

## 技術スタック

### データベース

- **DBMS**: PostgreSQL 15 (Supabase)
- **ORM**: Prisma 6
- **接続プール**: Supabase Connection Pooler
- **バックアップ**: Supabase自動バックアップ

### 設計原則

- **正規化**: 第3正規形まで正規化
- **パフォーマンス**: 適切なインデックス設計
- **拡張性**: 将来の機能追加を考慮
- **セキュリティ**: Row Level Security (RLS) 適用

## テーブル設計

### Users テーブル

**目的**: ユーザー情報管理

```sql
CREATE TABLE users (
  id UUID DEFAULT uuid() PRIMARY KEY,
  user_name VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  skin_type VARCHAR(50), -- 'normal', 'dry', 'oily', 'combination', 'sensitive'
  profile_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(user_name);
CREATE INDEX idx_users_active ON users(is_active);
```

**制約**:

- `user_name`: 3-50文字、英数字とアンダースコア
- `email`: 有効なメールアドレス形式
- `skin_type`: 事前定義された値のみ
- `password_hash`: bcrypt形式

### Posts テーブル

**目的**: 投稿情報管理

```sql
CREATE TABLE posts (
  id UUID DEFAULT uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  cosmetic_name VARCHAR(200) NOT NULL,
  cosmetic_category VARCHAR(100), -- 'toner', 'serum', 'emulsion', etc.
  skin_type VARCHAR(50), -- 投稿時点での肌タイプ
  usage_situation JSONB, -- 使用状況の詳細情報
  experience_details JSONB, -- 体験詳細情報
  mood_tag VARCHAR(50), -- 'disappointed', 'okay', 'good', 'love', 'perfect'
  status VARCHAR(20) DEFAULT 'published', -- 'draft', 'published', 'archived'
  view_count INTEGER DEFAULT 0,
  empathy_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- インデックス
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_published_at ON posts(published_at);
CREATE INDEX idx_posts_cosmetic_category ON posts(cosmetic_category);
CREATE INDEX idx_posts_skin_type ON posts(skin_type);
CREATE INDEX idx_posts_mood_tag ON posts(mood_tag);
CREATE INDEX idx_posts_cosmetic_name ON posts USING gin(to_tsvector('japanese', cosmetic_name));
CREATE INDEX idx_posts_content ON posts USING gin(to_tsvector('japanese', content));
```

**JSON フィールド構造**:

`usage_situation`:

```json
{
  "season": "winter",
  "timeOfDay": "morning",
  "menstrualCycle": "before",
  "skinCondition": "unstable",
  "weatherCondition": "dry"
}
```

`experience_details`:

```json
{
  "fragrance": {
    "type": "floral",
    "intensity": "weak",
    "description": "ほんのりローズの香り"
  },
  "texture": {
    "type": "cream",
    "spreadability": "easy",
    "absorption": "moderate",
    "description": "なめらかで伸びが良い"
  },
  "afterUse": {
    "moisture": "moist",
    "texture": "smooth",
    "comfort": "comfortable",
    "duration": "long",
    "description": "一日中しっとり感が続いた"
  }
}
```

### Empathies テーブル

**目的**: 共感機能管理

```sql
CREATE TABLE empathies (
  id UUID DEFAULT uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  empathy_type VARCHAR(50) NOT NULL, -- 'understand', 'interested', 'helpful', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- インデックス
CREATE INDEX idx_empathies_post_id ON empathies(post_id);
CREATE INDEX idx_empathies_user_id ON empathies(user_id);
CREATE INDEX idx_empathies_type ON empathies(empathy_type);
```

### Comments テーブル

**目的**: コメント機能管理

```sql
CREATE TABLE comments (
  id UUID DEFAULT uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES comments(id), -- 返信機能用
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX idx_comments_active ON comments(is_active);
```

### Post_Permissions テーブル

**目的**: 投稿権限管理（将来拡張用）

```sql
CREATE TABLE post_permissions (
  id UUID DEFAULT uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permission_type VARCHAR(20) NOT NULL, -- 'view', 'edit', 'delete'
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id, permission_type)
);

-- インデックス
CREATE INDEX idx_post_permissions_post_id ON post_permissions(post_id);
CREATE INDEX idx_post_permissions_user_id ON post_permissions(user_id);
```

## Prisma スキーマ

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id               String   @id @default(uuid()) @db.Uuid
  userName         String   @unique @map("user_name") @db.VarChar(50)
  email            String   @unique @db.VarChar(255)
  passwordHash     String   @map("password_hash") @db.VarChar(255)
  displayName      String?  @map("display_name") @db.VarChar(100)
  skinType         String?  @map("skin_type") @db.VarChar(50)
  profileImageUrl  String?  @map("profile_image_url")
  isActive         Boolean  @default(true) @map("is_active")
  createdAt        DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt        DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  // Relations
  posts          Post[]
  empathies      Empathy[]
  comments       Comment[]
  postPermissions PostPermission[]

  @@map("users")
}

model Post {
  id                String    @id @default(uuid()) @db.Uuid
  userId            String    @map("user_id") @db.Uuid
  title             String    @db.VarChar(200)
  content           String
  cosmeticName      String    @map("cosmetic_name") @db.VarChar(200)
  cosmeticCategory  String?   @map("cosmetic_category") @db.VarChar(100)
  skinType          String?   @map("skin_type") @db.VarChar(50)
  usageSituation    Json?     @map("usage_situation")
  experienceDetails Json?     @map("experience_details")
  moodTag           String?   @map("mood_tag") @db.VarChar(50)
  status            String    @default("published") @db.VarChar(20)
  viewCount         Int       @default(0) @map("view_count")
  empathyCount      Int       @default(0) @map("empathy_count")
  createdAt         DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)
  publishedAt       DateTime? @map("published_at") @db.Timestamptz(6)

  // Relations
  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  empathies       Empathy[]
  comments        Comment[]
  postPermissions PostPermission[]

  @@map("posts")
}

// ... 他のモデル定義
```

## データアクセスパターン

### よく使用されるクエリ

#### 投稿一覧取得（フィルタ付き）

```sql
SELECT p.*, u.user_name, u.display_name, u.skin_type,
       COUNT(e.id) as empathy_count,
       COUNT(c.id) as comment_count
FROM posts p
JOIN users u ON p.user_id = u.id
LEFT JOIN empathies e ON p.id = e.post_id
LEFT JOIN comments c ON p.id = c.post_id AND c.is_active = true
WHERE p.status = 'published'
  AND ($1::text IS NULL OR p.skin_type = $1)
  AND ($2::text IS NULL OR p.cosmetic_category = $2)
  AND ($3::text IS NULL OR p.mood_tag = $3)
  AND ($4::text IS NULL OR p.cosmetic_name ILIKE '%' || $4 || '%')
GROUP BY p.id, u.user_name, u.display_name, u.skin_type
ORDER BY p.published_at DESC
LIMIT $5 OFFSET $6;
```

#### 投稿詳細取得

```sql
SELECT p.*, u.user_name, u.display_name, u.skin_type, u.profile_image_url
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE p.id = $1 AND p.status = 'published';
```

### パフォーマンス最適化

#### インデックス戦略

- **単一カラムインデックス**: よく検索される列
- **複合インデックス**: 複数条件での検索
- **部分インデックス**: 条件付きインデックス
- **全文検索インデックス**: テキスト検索用

#### クエリ最適化

- **JOIN最適化**: 必要なデータのみ結合
- **N+1問題対策**: include/selectでの一括取得
- **ページネーション**: LIMIT/OFFSET または cursor-based
- **キャッシュ戦略**: Redis活用（将来実装）

## セキュリティ設計

### Row Level Security (RLS)

```sql
-- ユーザーは自分の情報のみ更新可能
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 公開投稿は全員閲覧可能
CREATE POLICY "Published posts are viewable by everyone" ON posts
  FOR SELECT USING (status = 'published');

-- 投稿者は自分の投稿を管理可能
CREATE POLICY "Users can manage own posts" ON posts
  FOR ALL USING (auth.uid() = user_id);
```

### データ保護

- **パスワード**: bcrypt による暗号化
- **個人情報**: 最小限の収集
- **ログ**: 個人情報を含まない
- **削除**: 物理削除ではなく論理削除

## バックアップ・復旧

### バックアップ戦略

- **頻度**: 日次自動バックアップ
- **保存期間**: 30日間
- **テスト**: 月次復旧テスト

### 災害復旧

- **RTO**: 4時間以内
- **RPO**: 24時間以内
- **手順書**: 詳細な復旧手順を文書化

## マイグレーション管理

### 基本方針

- **後方互換性**: 既存データを破壊しない
- **段階的変更**: 大きな変更は複数回に分割
- **ロールバック**: 問題時の即座な復旧

### マイグレーション例

```typescript
// prisma/migrations/001_add_mood_tag/migration.sql
ALTER TABLE posts ADD COLUMN mood_tag VARCHAR(50);
CREATE INDEX idx_posts_mood_tag ON posts(mood_tag);
```

## 監視・メトリクス

### 監視項目

- **接続数**: アクティブ接続数
- **クエリ性能**: 実行時間、プラン
- **容量**: テーブルサイズ、インデックスサイズ
- **エラー**: 接続エラー、クエリエラー

### アラート設定

- **接続数上限**: 80%到達時
- **スロークエリ**: 5秒以上
- **容量**: 80%到達時
- **エラー率**: 5%以上
