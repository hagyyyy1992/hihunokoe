# Google Analytics 実装ガイド

## セットアップ

1. Google Analytics 4プロパティで測定ID（G-XXXXXXXXXX）を取得
2. `.env.local`に環境変数を設定:
   ```
   NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
   ```

## 使用方法

### イベントトラッキング

```typescript
import { trackEvent } from '@/lib/analytics/events'

// ログイン時
trackEvent.auth.login()

// 投稿作成時
trackEvent.post.create()

// 投稿閲覧時
trackEvent.post.view(postId)

// 検索実行時
trackEvent.search.perform(searchQuery)

// APIエラー時
trackEvent.error.apiError('/api/posts', 500)
```

### カスタムイベント

```typescript
import { event } from '@/lib/analytics/config'

// カスタムイベントの送信
event({
  action: 'custom_action',
  category: 'custom_category',
  label: 'optional_label',
  value: 123,
})
```

## 環境別の動作

- **開発環境**: Google Analyticsは無効化されます
- **本番環境**: 測定IDが設定されている場合のみ有効化されます

## プライバシー配慮

- プライバシーポリシーページにGoogle Analytics利用について記載済み
- ユーザーはGoogle Analytics オプトアウト アドオンで無効化可能

## トラブルシューティング

1. **イベントが送信されない**

   - 本番環境で動作しているか確認
   - 測定IDが正しく設定されているか確認
   - ブラウザの開発者ツールでネットワークタブを確認

2. **ページビューが記録されない**
   - GoogleAnalyticsコンポーネントがlayout.tsxに追加されているか確認
   - useSearchParamsがSuspenseで囲まれているか確認
