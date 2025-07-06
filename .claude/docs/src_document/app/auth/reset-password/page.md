# auth/reset-password/page.tsx

## 概要

パスワードリセットトークンを使用して新しいパスワードを設定するページ。メール経由で送られたリセットリンクからアクセスされます。

## コンポーネント構成

### メインコンポーネント

```typescript
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
```

- Suspenseバウンダリーでラップ
- `useSearchParams`使用のため分離が必要

### ResetPasswordFormコンポーネント

実際のフォームロジックを含む内部コンポーネント

## 処理フロー

### 1. トークン検証フェーズ

```typescript
const validateToken = async () => {
  const response = await fetch('/api/auth/verify-reset-token', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}
```

### 2. パスワード設定フェーズ

- 新しいパスワード入力
- パスワード確認入力
- 強度チェックと要件表示

### 3. 完了フェーズ

- 成功メッセージ表示
- 3秒後に自動的にログインページへリダイレクト

## 状態管理

### ページ状態

```typescript
type PageState = 'validating' | 'form' | 'success'
```

| 状態         | 説明                       |
| ------------ | -------------------------- |
| `validating` | トークン検証中             |
| `form`       | パスワード入力フォーム表示 |
| `success`    | リセット完了               |

### フォーム状態

- `password`: 新しいパスワード
- `confirmPassword`: パスワード確認
- `isSubmitting`: 送信処理中
- `error`: エラーメッセージ

## セキュリティ機能

### トークン検証

- URLパラメータからトークン取得
- サーバーサイドでトークンの有効性確認
- 無効/期限切れトークンの適切な処理

### パスワード要件

- 最低8文字
- クライアントサイドでの事前検証
- パスワード強度インジケーター表示

## API通信

### トークン検証API

```typescript
POST / api / auth / verify - reset - token
{
  token: string
}
```

### パスワードリセットAPI

```typescript
POST /api/auth/reset-password
{ token: string, password: string }
```

## UI/UX特徴

### プログレッシブエンハンスメント

1. ローディング表示（トークン検証中）
2. エラー状態の明確な表示
3. 成功時の自動リダイレクト

### ビジュアルフィードバック

- パスワード強度の視覚的表示
- 要件のチェックマーク表示
- エラー/成功メッセージの色分け

## エラーハンドリング

- 無効なトークン
- 期限切れトークン
- ネットワークエラー
- パスワード不一致
- サーバーエラー

## 関連ページ

- `/auth/forgot-password`: リセット開始ページ
- `/auth/login`: ログインページ（完了後のリダイレクト先）

## テスト考慮事項

- 様々なトークン状態のテスト
- パスワードバリデーション
- 自動リダイレクトのタイミング
- エラー状態の復旧
