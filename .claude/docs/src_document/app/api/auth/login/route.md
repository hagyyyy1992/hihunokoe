# api/auth/login/route.ts

## 概要

ユーザーログイン用のAPIエンドポイント。メールアドレスとパスワードによる認証を行い、JWTトークンを発行します。

## エンドポイント

```
POST /api/auth/login
```

## リクエスト

### Headers

```
Content-Type: application/json
```

### Body

```typescript
{
  "email": string,    // メールアドレス（必須）
  "password": string  // パスワード（必須）
}
```

### バリデーション

```typescript
const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string(),
})
```

## レスポンス

### 成功 (200 OK)

```json
{
  "user": {
    "id": "uuid",
    "userName": "username",
    "email": "user@example.com",
    "emailVerified": true,
    "skinType": "NORMAL",
    "gender": "FEMALE",
    "birthDate": "1990-01-01",
    "allergies": ["FRAGRANCE"],
    "role": "USER",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "message": "ログインしました"
}
```

### メール未認証 (403 Forbidden)

```json
{
  "error": "メールアドレスの確認が完了していません。確認メールをご確認ください。",
  "emailVerificationRequired": true,
  "email": "user@example.com"
}
```

### 認証失敗 (401 Unauthorized)

```json
{
  "error": "メールアドレスまたはパスワードが間違っています"
}
```

### バリデーションエラー (400 Bad Request)

```json
{
  "error": "リクエストの形式が正しくありません"
}
```

## セキュリティ機能

### パスワード検証

- bcryptによるハッシュ値との照合
- タイミング攻撃への対策

### JWTトークン

```typescript
const token = jwt.sign(
  {
    id: user.id,
    email: user.email,
    username: user.userName,
  },
  JWT_SECRET,
  { expiresIn: '7d' }
)
```

### Cookieの設定

```typescript
cookies().set('auth-token', token, {
  httpOnly: true, // XSS対策
  secure: process.env.NODE_ENV === 'production', // HTTPS必須
  sameSite: 'lax', // CSRF対策
  maxAge: 60 * 60 * 24 * 7, // 7日間
  path: '/',
})
```

## 環境による挙動の違い

### 本番環境

- メール認証が必須
- Cookieのsecureフラグが有効

### 開発環境

- メール認証はスキップ可能
- モックデータへのフォールバック機能

## エラーハンドリング

- データベースエラーは認証失敗として扱う（情報漏洩防止）
- 詳細なエラーログはサーバー側のみ
- クライアントには一般的なエラーメッセージ

## 依存関係

- `@/lib/auth/auth`: 認証ロジック
- `bcryptjs`: パスワードハッシュ
- `jsonwebtoken`: JWT生成
- `zod`: 入力検証

## 使用例

```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
  }),
})

if (response.ok) {
  const data = await response.json()
  console.log('ログイン成功:', data.user)
} else {
  const error = await response.json()
  console.error('ログイン失敗:', error.error)
}
```
