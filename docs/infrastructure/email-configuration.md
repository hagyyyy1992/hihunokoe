# メール送信設定ガイド

このドキュメントでは、Resendを使用したメール送信の設定方法を説明します。

## 概要

本アプリケーションは以下のメール送信に対応しています：

- メールアドレス確認
- パスワードリセット
- アカウント削除通知

## Resendの設定

### 1. Resendアカウントの作成

1. [Resend](https://resend.com)でアカウントを作成
2. APIキーを取得

### 2. ドメインの設定

Resendでドメインを追加する手順：

1. Resendダッシュボード > Domains > Add Domain
2. ドメイン名を入力（例: `yourdomain.com`）
3. DNSレコードの設定：
   - SPFレコード: `TXT` レコードを追加
   - DKIMレコード: 表示される3つの`CNAME`レコードを追加
   - Return-Path: `CNAME`レコードを追加

### 3. DNSレコードの例

```
# SPF
Type: TXT
Name: @
Value: v=spf1 include:amazonses.com ~all

# DKIM (3つのレコード)
Type: CNAME
Name: resend._domainkey
Value: resend._domainkey.yourdomain.com.dkim.amazonses.com

Type: CNAME
Name: resend2._domainkey
Value: resend2._domainkey.yourdomain.com.dkim.amazonses.com

Type: CNAME
Name: resend3._domainkey
Value: resend3._domainkey.yourdomain.com.dkim.amazonses.com

# Return-Path
Type: CNAME
Name: mail
Value: feedback-smtp.us-east-1.amazonses.com
```

### 4. 環境変数の設定

`.env`ファイルまたはVercelの環境変数に以下を設定：

```env
# ResendのAPIキー
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxx"

# 送信元メールアドレス（ドメインと一致させる）
FROM_EMAIL="noreply@yourdomain.com"
```

**重要**: `FROM_EMAIL`は、Resendで認証したドメインと一致している必要があります。

## トラブルシューティング

### メールが送信されない場合

1. **APIキーの確認**

   - Resendダッシュボードで正しいAPIキーを使用しているか確認
   - 本番用のAPIキーを使用しているか確認（テスト用キーでは送信されません）

2. **ドメイン認証の確認**

   - Resendダッシュボード > Domains でドメインのステータスが「Verified」になっているか確認
   - DNSレコードが正しく設定されているか確認（伝播に最大48時間かかる場合があります）

3. **FROM_EMAILの確認**

   - 環境変数`FROM_EMAIL`が認証済みドメインのメールアドレスになっているか確認
   - デフォルトの`noreply@yourdomain.com`のままになっていないか確認

4. **Vercelログの確認**
   - Vercelダッシュボード > Functions > Logsでエラーメッセージを確認
   - 特に`forgot-password`や`register`のAPIログを確認

### デバッグ方法

1. **ローカルでのテスト**

   ```bash
   # MailHogを起動
   npm run mailhog:start

   # 開発サーバーを起動
   npm run dev

   # http://localhost:8025 でメールを確認
   ```

2. **本番環境でのログ確認**

   - `/src/lib/email/email.ts`にデバッグログを追加済み
   - Vercelのログで以下の情報を確認：
     - `Email configuration`: 送信設定の詳細
     - `Resend email error`: エラーの詳細

3. **Resendダッシュボードの確認**
   - Emails > Logs でメール送信履歴を確認
   - 失敗したメールのエラー詳細を確認

## セキュリティに関する注意事項

1. **APIキーの管理**

   - APIキーは絶対にコードにハードコーディングしない
   - 環境変数として管理し、`.env`ファイルはGitにコミットしない

2. **送信元アドレス**

   - なりすまし防止のため、認証済みドメインのみ使用可能
   - 複数のドメインを使用する場合は、それぞれ認証が必要

3. **レート制限**
   - Resendには送信レート制限があります（無料プラン: 100通/日）
   - 大量送信が必要な場合は有料プランへのアップグレードを検討

## テスト方法

### メール送信テストエンドポイント

開発環境やプレビュー環境では、`/api/test/email`エンドポイントを使用してメール送信をテストできます：

```bash
# ローカル環境でのテスト
curl -X POST http://localhost:3000/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@example.com"}'

# Vercelプレビュー環境でのテスト
curl -X POST https://your-app.vercel.app/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@example.com"}'
```

成功時のレスポンス：

```json
{
  "success": true,
  "message": "テストメールを送信しました",
  "details": {
    "to": "your-email@example.com",
    "from": "noreply@yourdomain.com",
    "environment": "production / preview"
  }
}
```

## 関連ファイル

- `/src/lib/email/email.ts` - メール送信の実装
- `/src/lib/auth/password-reset.ts` - パスワードリセットメール
- `/src/app/api/auth/register/route.ts` - 登録時のメール確認
- `/src/app/api/auth/forgot-password/route.ts` - パスワードリセット要求
- `/src/app/api/test/email/route.ts` - メール送信テスト用エンドポイント
