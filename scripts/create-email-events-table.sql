-- Email events tracking table for Resend webhooks
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS email_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resend_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  email_to TEXT,
  email_from TEXT,
  email_subject TEXT,
  event_data JSONB NOT NULL DEFAULT '{}',
  environment TEXT DEFAULT 'unknown',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスを追加（検索性能向上のため）
CREATE INDEX IF NOT EXISTS idx_email_events_resend_id ON email_events(resend_id);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_created_at ON email_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_events_environment ON email_events(environment);
CREATE INDEX IF NOT EXISTS idx_email_events_email_to ON email_events(email_to);

-- RLS (Row Level Security) ポリシーを設定（必要に応じて）
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

-- 管理者のみがアクセス可能なポリシー（開発環境用）
CREATE POLICY "email_events_admin_policy" ON email_events
FOR ALL USING (
  auth.jwt() ->> 'email' IN (
    -- 管理者メールアドレスを追加（必要に応じて変更）
    'admin@example.com'
  )
);

-- 更新日時を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_email_events_updated_at
    BEFORE UPDATE ON email_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- メールイベントの統計を取得するビュー
CREATE OR REPLACE VIEW email_events_stats AS
SELECT 
  event_type,
  environment,
  COUNT(*) as count,
  DATE(created_at) as date
FROM email_events
GROUP BY event_type, environment, DATE(created_at)
ORDER BY date DESC, count DESC;

-- 最新のメールイベントを取得するビュー
CREATE OR REPLACE VIEW recent_email_events AS
SELECT 
  id,
  resend_id,
  event_type,
  email_to,
  email_subject,
  environment,
  created_at,
  -- event_dataから重要な情報を抽出
  event_data->>'opened_at' as opened_at,
  event_data->>'clicked_at' as clicked_at,
  event_data->>'link' as clicked_link,
  event_data->>'reason' as bounce_reason
FROM email_events
ORDER BY created_at DESC;

-- コメント
COMMENT ON TABLE email_events IS 'Resend webhook events tracking table';
COMMENT ON COLUMN email_events.resend_id IS 'Resend email ID from webhook';
COMMENT ON COLUMN email_events.event_type IS 'Event type (email.sent, email.delivered, etc.)';
COMMENT ON COLUMN email_events.event_data IS 'Full webhook payload data';
COMMENT ON COLUMN email_events.environment IS 'Environment (production, preview, development)';