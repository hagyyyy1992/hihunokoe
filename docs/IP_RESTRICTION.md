# IP制限設定ガイド

このドキュメントでは、サイトへのアクセスをIPアドレスで制限する方法を説明します。

## 概要

IP制限機能により、特定のIPアドレスからのアクセスのみを許可することができます。これは開発環境やステージング環境、または限定公開時に有用です。

## 設定方法

### 1. 環境変数の設定

以下の環境変数を設定します：

```env
# IP制限を有効化
IP_RESTRICTION_ENABLED=true

# 許可するIPアドレス（カンマ区切り）
ALLOWED_IPS=123.456.789.0,111.222.333.444
```

### 2. Vercelでの設定

1. Vercelダッシュボードにログイン
2. プロジェクト設定 > Environment Variables に移動
3. 以下の変数を追加：
   - `IP_RESTRICTION_ENABLED`: `true`
   - `ALLOWED_IPS`: 許可するIPアドレスをカンマ区切りで入力

### 3. 自分のIPアドレスの確認方法

現在のIPアドレスを確認するには：

1. https://www.whatismyipaddress.com/ にアクセス
2. または、ターミナルで以下を実行：
   ```bash
   curl ifconfig.me
   ```

## 動作の仕組み

1. すべてのリクエストは `middleware.ts` で処理されます
2. クライアントのIPアドレスを以下のヘッダーから取得：
   - `x-forwarded-for`（Vercel推奨）
   - `x-real-ip`
   - `x-vercel-forwarded-for`
3. IPが許可リストにない場合、403エラーページを表示

## 除外されるパス

以下のパスはIP制限から除外されます：

- `/_next/*` - Next.jsの静的アセット
- `/favicon.ico` - ファビコン
- `/robots.txt` - 検索エンジン向けファイル
- `/sitemap.xml` - サイトマップ
- `/api/health` - ヘルスチェックエンドポイント

## トラブルシューティング

### アクセスできない場合

1. **IPアドレスが正しいか確認**

   - プロキシやVPNを使用している場合、異なるIPで接続される可能性があります
   - `curl https://your-site.vercel.app/api/health` でIPを確認

2. **環境変数が正しく設定されているか確認**

   - Vercelダッシュボードで環境変数を確認
   - デプロイ後に反映されているか確認

3. **複数のIPアドレスの場合**
   - 自宅とオフィスなど、複数の場所からアクセスする場合は全てのIPを登録

### ログの確認

Vercelのログで以下の情報を確認できます：

```
[IP Restriction] Client IP: xxx.xxx.xxx.xxx
[IP Restriction] Allowed IPs: ["yyy.yyy.yyy.yyy"]
```

## セキュリティ上の注意事項

1. **IP制限は完全なセキュリティソリューションではありません**

   - 追加の認証機能と組み合わせて使用することを推奨

2. **動的IPアドレスの場合**

   - ISPによってIPが変更される場合があります
   - 定期的にIPアドレスを確認し、必要に応じて更新してください

3. **本番環境での使用**
   - 本番環境では他のセキュリティ対策と併用してください
   - CloudflareやAWS WAFなどのより高度なソリューションも検討してください

## 無効化方法

IP制限を無効にするには：

```env
IP_RESTRICTION_ENABLED=false
```

または、環境変数を削除します。
