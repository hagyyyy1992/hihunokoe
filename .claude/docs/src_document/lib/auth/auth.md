# lib/auth/auth.ts

## 概要

アプリケーションの認証システムのコア実装。JWT認証、ユーザー管理、ロールベースアクセス制御を提供し、データベース接続時とモックモードの両方で動作します。

## 主要機能

### デュアルモード認証

```typescript
export async function loginUser(email: string, password: string): Promise<User | null> {
  // 1. データベースが利用可能な場合
  if (isDatabaseAvailable() && prisma) {
    // データベースから認証
  }

  // 2. モックモードへのフォールバック
  const mockUser = mockUsers.find(u => u.email === email)
  // モックユーザーで認証
}
```

### ユーザー登録

```typescript
export async function registerUser(userData: {
  userName: string
  email: string
  password: string
  birthDate?: string
  gender?: Gender
  skinType?: SkinType
  skinTypeOther?: string
  allergies?: AllergyType[]
  allergiesOther?: string
}): Promise<User>
```

#### 特徴

- メールアドレスとユーザー名の重複チェック
- ソフト削除されたアカウントの復元機能
- 豊富なプロフィール情報の保存
- 開発環境では自動的にメール認証済み

### パスワード管理

```typescript
// ハッシュ化（登録時）
const hashedPassword = await bcrypt.hash(password, 12)

// 検証（ログイン時）
const isValidPassword = await bcrypt.compare(password, user.password)
```

### JWT認証

```typescript
// トークン生成
export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.userName,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// トークン検証
export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload
}
```

### リクエスト認証

```typescript
export async function authenticateRequest(request: Request | NextRequest): Promise<User | null> {
  // 1. Authorizationヘッダーから取得
  // 2. Cookieから取得
  // 3. トークン検証
  // 4. ユーザー情報返却
}
```

## ユーザー管理機能

### ユーザー取得

```typescript
// IDで取得
getUserById(id: string): Promise<User | null>

// メールで取得
getUserByEmail(email: string): Promise<User | null>

// 全ユーザー取得（管理者用）
getAllUsers(): Promise<User[]>
```

### ユーザー更新

```typescript
updateUser(id: string, data: Partial<User>): Promise<User | null>
```

### アカウント削除（ソフト削除）

```typescript
deleteUserAccount(userId: string): Promise<void>
```

- `deletedAt`タイムスタンプを設定
- 関連データは保持（データ整合性維持）

## ロールベースアクセス制御

### ロール定義

```typescript
type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN'
```

### ロールチェック関数

```typescript
// 管理者チェック
isAdmin(user: User | null): boolean

// スーパー管理者チェック
isSuperAdmin(user: User | null): boolean
```

## 管理者機能

### 管理者アクション記録

```typescript
logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId?: string,
  details?: any
): Promise<void>
```

### ユーザーステータス管理

```typescript
// アクティベート
activateUser(userId: string): Promise<User | null>

// サスペンド
suspendUser(userId: string): Promise<User | null>
```

## モックデータ

### デモユーザー

```typescript
const mockUsers = [
  {
    email: 'demo@example.com',
    password: 'demo123', // 平文（モックのみ）
    role: 'USER',
  },
  {
    email: 'admin@example.com',
    password: 'admin123',
    role: 'ADMIN',
  },
]
```

## エラーハンドリング

### 一般的なエラー

- ユーザーが見つからない
- パスワードが間違っている
- メールアドレスが既に使用されている
- データベース接続エラー

### モックモードの制限

- 新規登録不可（デモユーザーのみ）
- プロフィール更新不可
- 管理者機能は限定的

## セキュリティ考慮事項

1. **パスワード**

   - bcryptで12ラウンドのハッシュ化
   - 平文パスワードは保存しない

2. **JWT**

   - 7日間の有効期限
   - 環境変数からシークレット取得
   - ペイロードに最小限の情報のみ

3. **ソフト削除**
   - データの完全削除を避ける
   - 監査証跡の保持

## 環境変数

```bash
JWT_SECRET=your-secret-key  # JWT署名用シークレット
USE_MOCK_DATA=false        # モックモード切り替え
```

## 使用例

### ログイン

```typescript
const user = await loginUser('user@example.com', 'password123')
if (user) {
  const token = generateToken(user)
  // トークンをCookieに保存
}
```

### 認証チェック

```typescript
const user = await authenticateRequest(request)
if (!user) {
  return new Response('Unauthorized', { status: 401 })
}
```

### 管理者操作

```typescript
if (isAdmin(currentUser)) {
  await suspendUser(targetUserId)
  await logAdminAction(currentUser.id, 'USER_SUSPENDED', 'USER', targetUserId)
}
```
