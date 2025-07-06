# api/auth/me/route.ts

## 概要

現在の認証ユーザー情報を取得するAPIエンドポイント。JWTトークンを検証し、ユーザー情報を返します。

## エンドポイント

```
GET /api/auth/me
```

## リクエスト

### Headers

特に必要なヘッダーはありません。

### Cookie

```
Cookie: auth-token=<jwt-token>
```

認証トークンが必須です。

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
    "skinTypeOther": null,
    "gender": "FEMALE",
    "birthDate": "1990-01-01",
    "allergies": ["FRAGRANCE", "ALCOHOL"],
    "allergiesOther": null,
    "bodyType": "DRY_SKIN",
    "role": "USER",
    "bio": "プロフィール文",
    "profileImage": "https://example.com/image.jpg",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 認証エラー (401 Unauthorized)

```json
{
  "error": "認証が必要です"
}
```

トークンが存在しない場合

### トークン無効 (401 Unauthorized)

```json
{
  "error": "トークンが無効です"
}
```

トークンが改ざんされているか期限切れ

### メール未認証 (403 Forbidden)

```json
{
  "error": "メールアドレスの確認が必要です"
}
```

本番環境でメール認証が完了していない場合

## 処理フロー

### 1. トークン取得

```typescript
const token = cookies().get('auth-token')?.value
if (!token) {
  return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
}
```

### 2. トークン検証

```typescript
const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
```

### 3. ユーザー情報取得

```typescript
const user = await auth.getUserById(decoded.id)
if (!user) {
  return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
}
```

### 4. メール認証確認

```typescript
if (!isDevelopment && !user.emailVerified) {
  return NextResponse.json({ error: 'メールアドレスの確認が必要です' }, { status: 403 })
}
```

## セキュリティ機能

### JWT検証

- 署名の検証
- 有効期限のチェック
- ペイロードの整合性確認

### エラーハンドリング

```typescript
try {
  const decoded = jwt.verify(token, JWT_SECRET)
  // ... 処理
} catch (error) {
  if (error instanceof jwt.TokenExpiredError) {
    return NextResponse.json({ error: 'トークンが期限切れです' }, { status: 401 })
  }
  // その他のエラー
}
```

## 使用シーン

### 初期認証状態の確認

```javascript
// アプリケーション起動時
const checkAuth = async () => {
  const response = await fetch('/api/auth/me', {
    credentials: 'include',
  })

  if (response.ok) {
    const data = await response.json()
    setUser(data.user)
  } else {
    setUser(null)
  }
}
```

### 認証ガード

```typescript
// 保護されたページでの使用
useEffect(() => {
  const verifyAuth = async () => {
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
    })

    if (!response.ok) {
      router.push('/auth/login')
    }
  }

  verifyAuth()
}, [])
```

### AuthContextでの使用

```typescript
const refreshUser = async () => {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
    })

    if (response.ok) {
      const data = await response.json()
      setUser(data.user)
    } else {
      setUser(null)
    }
  } catch (error) {
    setUser(null)
  }
}
```

## 環境による挙動

### 本番環境

- メール認証が必須
- 未認証の場合は403エラー

### 開発環境

- メール認証チェックをスキップ
- デバッグしやすい詳細なエラー情報

## 依存関係

- `jsonwebtoken`: JWT検証
- `@/lib/auth/auth`: ユーザー情報取得
- Next.js cookies API: Cookie操作

## 関連エンドポイント

- `/api/auth/login` - ログイン（トークン発行）
- `/api/auth/logout` - ログアウト（トークン削除）
- `/api/auth/register` - 新規登録
