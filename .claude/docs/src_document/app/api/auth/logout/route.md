# api/auth/logout/route.ts

## 概要

ユーザーログアウト用のAPIエンドポイント。認証Cookieをクリアしてセッションを終了します。

## エンドポイント

```
POST /api/auth/logout
```

## リクエスト

### Headers

特に必要なヘッダーはありません。

### Body

リクエストボディは不要です。

### Cookie

```
Cookie: auth-token=<jwt-token>
```

※ログアウト処理で削除されます

## レスポンス

### 成功 (200 OK)

```json
{
  "message": "ログアウトしました"
}
```

## 処理詳細

### Cookieの削除

```typescript
cookies().set('auth-token', '', {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 0, // 即座に期限切れ
  path: '/',
})
```

### セキュリティ設定

- `httpOnly: true` - JavaScriptからのアクセスを防止
- `secure: true` - 本番環境でHTTPS必須
- `sameSite: 'lax'` - CSRF攻撃への対策
- `maxAge: 0` - Cookieを即座に削除

## 実装の特徴

### ステートレス設計

- JWTトークンベースの認証のため、サーバー側でのセッション管理なし
- クライアント側のCookieを削除するだけでログアウト完了

### シンプルな実装

```typescript
export async function POST() {
  // Cookieをクリア
  cookies().set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })

  return NextResponse.json({
    message: 'ログアウトしました',
  })
}
```

## 使用例

### フロントエンド実装

```javascript
const handleLogout = async () => {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include', // Cookie送信を有効化
  })

  if (response.ok) {
    // ログアウト成功
    // 認証状態をクリア
    // ホームページへリダイレクト
    window.location.href = '/'
  }
}
```

### Reactコンポーネントでの使用

```typescript
const { logout } = useAuth()

const handleLogoutClick = async () => {
  await logout() // AuthContextのlogout関数を使用
}
```

## 注意事項

### トークンの無効化

- 現在の実装ではサーバー側でトークンを無効化していない
- トークンは有効期限（7日）まで技術的には有効
- より高度なセキュリティが必要な場合は、トークンのブラックリスト機能の実装を検討

### クライアント側の処理

- ログアウト後は必ずクライアント側の認証状態もクリア
- 認証が必要なページからリダイレクト
- キャッシュされた認証情報の削除

## 関連エンドポイント

- `/api/auth/login` - ログイン
- `/api/auth/me` - 認証状態確認
- `/api/auth/register` - 新規登録
