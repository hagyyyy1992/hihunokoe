# Email Tracking Setup Guide

このガイドでは、Vercel環境でResend WebhookとSupabaseを使用したメール追跡機能のセットアップ方法を説明します。

## 1. 必要な環境変数の設定

### Vercel環境変数

Vercel Dashboard → Settings → Environment Variables で以下を設定：

```bash
# Resend API キー（既存）
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Resend Webhook シークレット（新規追加）
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Supabase Service Key（新規追加）
SUPABASE_SERVICE_KEY=xxxxxxxxxxxxx

# FROM_EMAIL（既存だが再確認）
FROM_EMAIL=noreply@yourdomain.com
```

### 環境変数の詳細

| 変数名                  | 説明                 | 取得方法                                     |
| ----------------------- | -------------------- | -------------------------------------------- |
| `RESEND_API_KEY`        | Resend API キー      | Resend Dashboard → API Keys                  |
| `RESEND_WEBHOOK_SECRET` | Webhook署名検証用    | Resend Dashboard → Webhooks → Create後に表示 |
| `SUPABASE_SERVICE_KEY`  | サーバーサイド用キー | Supabase Dashboard → Settings → API          |
| `FROM_EMAIL`            | 送信元メールアドレス | 独自ドメインまたは`onboarding@resend.dev`    |

## 2. Supabaseテーブルの作成

1. Supabase Dashboard → SQL Editor を開く
2. 以下のSQLファイルを実行:

```bash
# プロジェクトルートから
cat scripts/create-email-events-table.sql
```

または、SQLエディタに以下をコピー＆ペースト:

```sql
-- scripts/create-email-events-table.sql の内容を実行
```

## 3. Resend Webhookの設定

### 3.1 Webhook エンドポイントの設定

1. [Resend Dashboard](https://resend.com/webhooks) → Webhooks を開く
2. "Create webhook" をクリック
3. 以下を設定:

| 項目             | 値                                                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Endpoint URL** | `https://your-app.vercel.app/api/resend-webhook`                                                                      |
| **Events**       | ✅ email.sent<br>✅ email.delivered<br>✅ email.opened<br>✅ email.clicked<br>✅ email.bounced<br>✅ email.complained |

### 3.2 Webhook Secretの取得

1. Webhook作成後、**Secret**タブを開く
2. `whsec_` で始まるシークレットをコピー
3. Vercelの環境変数 `RESEND_WEBHOOK_SECRET` に設定

## 4. 動作確認

### 4.1 Webhook エンドポイントの確認

```bash
# ヘルスチェック
curl https://your-app.vercel.app/api/resend-webhook

# 期待されるレスポンス:
{
  "status": "ok",
  "environment": "production",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 4.2 メール送信テスト

1. アプリでユーザー登録やパスワードリセットを実行
2. Vercel Functions → Logs でメール送信ログを確認:

```
📧 Email sent via Resend: {
  "to": "user@example.com",
  "messageId": "xxxxx",
  "environment": "production",
  "tracking": { "open": true, "click": true }
}
```

### 4.3 Webhook受信確認

1. メール送信後、Vercel Functions → Logs で以下のログを確認:

```
[production] 📧 Email sent: {
  "id": "xxxxx",
  "to": ["user@example.com"],
  "subject": "メールアドレスの確認"
}
```

2. メール開封やクリック時のログも確認:

```
[production] 📧 Email opened: {
  "id": "xxxxx",
  "opened_at": "2024-01-01T00:00:00.000Z"
}
```

### 4.4 メール追跡ダッシュボード

1. `https://your-app.vercel.app/admin/email-tracking` にアクセス
2. 送信されたメールイベントがリアルタイムで表示されることを確認

## 5. トラブルシューティング

### Webhook が動作しない場合

1. **Endpoint URLの確認**

   ```bash
   # 正しいURL形式
   https://your-app.vercel.app/api/resend-webhook

   # 間違った例
   https://your-app.vercel.app/  # パスが不完全
   ```

2. **環境変数の確認**

   ```bash
   # Vercel CLI で確認
   vercel env ls
   ```

3. **Webhook署名エラー**
   - `RESEND_WEBHOOK_SECRET` が正しく設定されているか確認
   - Resend Dashboardの Secret タブで最新のシークレットを確認

### Supabaseエラーの場合

1. **RLSポリシーの確認**

   ```sql
   -- 必要に応じてポリシーを無効化（開発環境）
   ALTER TABLE email_events DISABLE ROW LEVEL SECURITY;
   ```

2. **Service Keyの確認**
   - `SUPABASE_SERVICE_KEY` がサーバーサイド用（`service_role`）であることを確認
   - Anon keyではなくService keyを使用する

### メール追跡が表示されない場合

1. **ブラウザコンソールでエラー確認**
2. **Supabaseのテーブル権限確認**
3. **ネットワークタブでAPI呼び出し確認**

## 6. セキュリティ考慮事項

### 本番環境での設定

1. **Webhook署名検証を有効化**

   - `RESEND_WEBHOOK_SECRET` を必ず設定
   - 本番環境では署名検証を無効化しない

2. **RLSポリシーの設定**

   ```sql
   -- 管理者のみアクセス可能
   CREATE POLICY "email_events_admin_policy" ON email_events
   FOR ALL USING (
     auth.jwt() ->> 'email' IN ('admin@yourdomain.com')
   );
   ```

3. **API Rate Limiting**
   - Vercel Pro以上でRate Limitingを設定
   - 異常な量のWebhookリクエストを検知

### 開発環境での注意点

1. **ローカル開発時**

   - MailHogを使用（Webhookは動作しない）
   - 本番のWebhookエンドポイントを開発データで汚染しない

2. **Preview環境**
   - Preview環境用の別Webhookエンドポイントを作成推奨
   - または環境変数でWebhook処理を制御

## 7. 監視とメンテナンス

### ログ監視

1. **Vercel Functions Logs**

   - メール送信とWebhook受信のログを定期確認
   - エラーログの監視とアラート設定

2. **Supabaseログ**
   - データベース挿入エラーの監視
   - 異常なトラフィック検知

### データベースメンテナンス

```sql
-- 古いイベントデータの削除（月次実行推奨）
DELETE FROM email_events
WHERE created_at < NOW() - INTERVAL '6 months';

-- インデックスの最適化
REINDEX TABLE email_events;
```

## 8. FAQ

### Q: 独自ドメインなしでメール送信できますか？

A: はい。`onboarding@resend.dev`を使用すれば送信可能です（月100通まで無料）。

### Q: Preview環境でもWebhookは動作しますか？

A: はい。ただし、本番とは別のWebhookエンドポイントの作成を推奨します。

### Q: メール開封率やクリック率を確認できますか？

A: はい。メール追跡ダッシュボードで統計情報を確認できます。

### Q: 過去のメールデータは取得できますか？

A: Webhookは新しいイベントのみ受信します。過去データはResend APIで部分的に取得可能です。

---

この設定完了後、Vercel環境でリアルタイムなメール追跡が可能になります。
