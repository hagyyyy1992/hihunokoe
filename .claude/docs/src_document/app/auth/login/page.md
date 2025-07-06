# auth/login/page.tsx

## 概要

既存ユーザーのログイン機能を提供するページコンポーネント。メールアドレスとパスワードによる認証を実装しています。

## 主要機能

### 認証フォーム

- **メールアドレス入力**: 必須フィールド、email型
- **パスワード入力**: 必須フィールド、パスワード型
- **ログイン状態を保持**: チェックボックスオプション

### 認証フロー

1. ユーザーが認証情報を入力
2. `/api/auth/login` エンドポイントにPOSTリクエスト
3. 成功時：
   - 認証状態をリフレッシュ
   - `/home` ページへリダイレクト
4. メール未認証の場合：
   - 認証メール再送信オプションを表示
   - 再送信機能の実装

### エラーハンドリング

```typescript
if (error.message === 'メールアドレスが認証されていません') {
  setShowResendVerification(true)
}
```

- 認証エラー
- ネットワークエラー
- メール未認証エラー（特別処理）

## 状態管理

| State                    | 型             | 説明                       |
| ------------------------ | -------------- | -------------------------- |
| `email`                  | string         | メールアドレス入力値       |
| `password`               | string         | パスワード入力値           |
| `rememberMe`             | boolean        | ログイン状態保持フラグ     |
| `isLoading`              | boolean        | 送信中フラグ               |
| `error`                  | string \| null | エラーメッセージ           |
| `successMessage`         | string \| null | 成功メッセージ             |
| `showResendVerification` | boolean        | 認証メール再送信表示フラグ |

## 依存関係

- `@/lib/auth/AuthContext`: 認証状態管理
- `@/components/ui/PasswordInput`: パスワード入力コンポーネント
- Next.js: `Link`, `useRouter`
- React: `useState`, `useCallback`

## UI/UX設計

- レスポンシブデザイン（モバイル対応）
- ローディング中はボタンを無効化
- エラー/成功メッセージの色分け表示
- パスワード表示/非表示トグル

## セキュリティ考慮事項

- パスワードは常にマスク表示（トグル可能）
- HTTPS通信前提
- クライアントサイドでの最小限のバリデーション

## テスト用属性

```tsx
data-testid="login-form"
data-testid="resend-verification-button"
```

## 関連ページ

- `/auth/register`: 新規登録ページ
- `/auth/forgot-password`: パスワードリセットページ
- `/home`: ログイン後のリダイレクト先
