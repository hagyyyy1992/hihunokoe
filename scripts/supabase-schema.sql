-- Supabase用データベーススキーマ
-- SQL Editorで実行してください

-- UUID拡張を有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users テーブル
CREATE TABLE IF NOT EXISTS users (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    skin_type VARCHAR(50),
    profile_image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Posts テーブル
CREATE TABLE IF NOT EXISTS posts (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    cosmetic_name VARCHAR(200) NOT NULL,
    cosmetic_category VARCHAR(100),
    skin_type VARCHAR(50),
    usage_situation JSONB,
    experience_details JSONB,
    mood_tag VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'published',
    view_count INTEGER NOT NULL DEFAULT 0,
    empathy_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMPTZ(6),

    CONSTRAINT posts_pkey PRIMARY KEY (id)
);

-- Post permissions テーブル
CREATE TABLE IF NOT EXISTS post_permissions (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL,
    user_id UUID NOT NULL,
    permission_type VARCHAR(20) NOT NULL,
    granted_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT post_permissions_pkey PRIMARY KEY (id)
);

-- Empathies テーブル
CREATE TABLE IF NOT EXISTS empathies (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL,
    user_id UUID NOT NULL,
    empathy_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT empathies_pkey PRIMARY KEY (id)
);

-- Comments テーブル
CREATE TABLE IF NOT EXISTS comments (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    parent_comment_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT comments_pkey PRIMARY KEY (id)
);

-- インデックス作成
CREATE UNIQUE INDEX IF NOT EXISTS users_user_name_key ON users(user_name);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS post_permissions_post_id_user_id_permission_type_key ON post_permissions(post_id, user_id, permission_type);
CREATE UNIQUE INDEX IF NOT EXISTS empathies_post_id_user_id_key ON empathies(post_id, user_id);

-- 外部キー制約
ALTER TABLE posts ADD CONSTRAINT IF NOT EXISTS posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE post_permissions ADD CONSTRAINT IF NOT EXISTS post_permissions_post_id_fkey FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE post_permissions ADD CONSTRAINT IF NOT EXISTS post_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE empathies ADD CONSTRAINT IF NOT EXISTS empathies_post_id_fkey FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE empathies ADD CONSTRAINT IF NOT EXISTS empathies_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE comments ADD CONSTRAINT IF NOT EXISTS comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE comments ADD CONSTRAINT IF NOT EXISTS comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE comments ADD CONSTRAINT IF NOT EXISTS comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- updated_at自動更新用の関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_atトリガー作成
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 有効化（オプション）
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE comments ENABLE ROW LEVEL SECURITY;