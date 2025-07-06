# api/auth/register/route.ts

## 概要

新規ユーザー登録用のAPIエンドポイント。詳細なプロフィール情報を含むユーザーアカウントを作成し、確認メールを送信します。

## エンドポイント

```
POST /api/auth/register
```

## リクエスト

### Headers

```
Content-Type: application/json
```

### Body

```typescript
{
  "userName": string,           // ユーザー名（必須、3文字以上）
  "email": string,              // メールアドレス（必須）
  "password": string,           // パスワード（必須、8文字以上）
  "birthDate"?: string,         // 生年月日（YYYY-MM-DD形式）
  "gender"?: "MALE" | "FEMALE" | "OTHER" | "NO_ANSWER",
  "skinType"?: "DRY" | "OILY" | "COMBINATION" | "NORMAL" | "SENSITIVE",
  "skinTypeOther"?: string,     // 肌質その他の詳細
  "allergies"?: Array<         // アレルギー（複数選択可）
    "ALCOHOL" | "FRAGRANCE" | "PARABEN" | "SULFATE" |
    "MINERAL_OIL" | "SYNTHETIC_COLOR" | "UV_ABSORBER" |
    "RETINOL" | "VITAMIN_C"
  >,
  "allergiesOther"?: string     // アレルギーその他の詳細
}
```

### バリデーションスキーマ

```typescript
const registerSchema = z.object({
  userName: z
    .string()
    .min(3, 'ユーザー名は3文字以上必要です')
    .max(50, 'ユーザー名は50文字以内で入力してください'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上必要です'),
  // ... その他のフィールド
})
```

## レスポンス

### 成功 (201 Created)

```json
{
  "user": {
    "id": "uuid",
    "userName": "newuser",
    "email": "newuser@example.com",
    "emailVerified": false,
    "skinType": "DRY",
    "gender": "FEMALE",
    "birthDate": "1990-01-01",
    "allergies": ["FRAGRANCE", "ALCOHOL"],
    "role": "USER",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "message": "ユーザー登録が完了しました。確認メールをご確認ください。"
}
```

### 重複エラー (400 Bad Request)

```json
{
  "error": "ユーザー名またはメールアドレスが既に使用されています"
}
```

### バリデーションエラー (400 Bad Request)

```json
{
  "error": "パスワードは8文字以上で、大文字と小文字を含む必要があります",
  "fieldErrors": {
    "password": "パスワードは小文字を含む必要があります",
    "userName": "ユーザー名は3文字以上必要です"
  },
  "details": [
    {
      "field": "password",
      "message": "パスワードは小文字を含む必要があります"
    }
  ]
}
```

## パスワードバリデーション

### 要件

- 最低8文字
- 大文字を1文字以上含む
- 小文字を1文字以上含む
- 数字を1文字以上含む（推奨）

### バリデーション関数

```typescript
const result = validatePassword(password)
if (!result.isValid) {
  return NextResponse.json(
    {
      error: result.errors.join(', '),
      fieldErrors: { password: result.errors[0] },
    },
    { status: 400 }
  )
}
```

## セキュリティ機能

### パスワードハッシュ化

```typescript
const hashedPassword = await bcrypt.hash(password, 12)
```

- bcryptで12ラウンドのハッシュ化
- ソルトは自動生成

### メール認証

- 登録時に確認メールを自動送信
- トークンベースの認証システム
- メール送信失敗時もユーザー登録は完了

### データ保護

- デモユーザーのメールアドレスは使用不可
- ユニーク制約による重複防止

## エラーハンドリング

### データベースエラー

```typescript
if (error.code === 'P2002') {
  return NextResponse.json(
    {
      error: 'ユーザー名またはメールアドレスが既に使用されています',
    },
    { status: 400 }
  )
}
```

### メール送信エラー

- エラーをログに記録
- ユーザー登録は継続（後で再送信可能）

## 環境による挙動

### 本番環境

- Resend APIでメール送信
- 完全なメール認証フロー

### 開発環境

- MailHogでメールをキャプチャ
- モックモードでの動作サポート

## 依存関係

- `@/lib/auth/auth`: 認証ロジック
- `@/lib/auth/password-validation`: パスワード検証
- `@/lib/auth/email-verification`: メール認証
- `bcryptjs`: パスワードハッシュ化
- `zod`: 入力検証

## 使用例

```javascript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userName: 'newuser',
    email: 'newuser@example.com',
    password: 'SecurePass123',
    skinType: 'DRY',
    allergies: ['FRAGRANCE'],
  }),
})

if (response.status === 201) {
  const data = await response.json()
  console.log('登録成功:', data.message)
  // 登録完了ページへリダイレクト
} else {
  const error = await response.json()
  console.error('登録失敗:', error.error)
}
```
