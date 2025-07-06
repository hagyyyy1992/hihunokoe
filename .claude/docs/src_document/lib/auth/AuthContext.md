# lib/auth/AuthContext.tsx

## 概要

React Contextを使用したクライアントサイドの認証状態管理。アプリケーション全体で認証情報を共有し、認証関連の操作を提供します。

## Context構造

```typescript
interface AuthContextType {
  user: User | null // 現在のユーザー情報
  login: (email: string, password: string) => Promise<void>
  register: (userData: RegisterData) => Promise<User>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  checkAuthComplete: boolean // 初回認証チェック完了フラグ
}
```

## 主要機能

### 自動認証チェック

```typescript
useEffect(() => {
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } finally {
      setCheckAuthComplete(true)
    }
  }

  checkAuth()
}, [])
```

- アプリケーション起動時に自動実行
- HTTPOnlyクッキーからJWTトークンを読み取り
- 有効な場合はユーザー情報を設定

### ログイン機能

```typescript
const login = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })

  if (response.ok) {
    const data = await response.json()
    setUser(data.user)
  } else {
    const error = await response.json()
    throw new Error(error.error || 'ログインに失敗しました')
  }
}
```

### 登録機能

```typescript
const register = async (userData: RegisterData) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  })

  if (response.ok) {
    const data = await response.json()
    return data.user // 注：自動ログインはしない（メール認証が必要）
  } else {
    const error = await response.json()
    throw error
  }
}
```

### ログアウト機能

```typescript
const logout = async () => {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    setUser(null) // エラーでも必ずユーザー情報をクリア
  }
}
```

### 認証状態の更新

```typescript
const refreshAuth = async () => {
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

### プロフィール更新

```typescript
const updateProfile = async (data: Partial<User>) => {
  const response = await fetch('/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  if (response.ok) {
    await refreshAuth() // 更新後に最新情報を取得
  } else {
    throw new Error('プロフィールの更新に失敗しました')
  }
}
```

## 使用方法

### Provider設定（app/layout.tsx）

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
```

### コンポーネントでの使用

```tsx
import { useAuth } from '@/lib/auth/AuthContext'

function MyComponent() {
  const { user, login, logout, checkAuthComplete } = useAuth()

  if (!checkAuthComplete) {
    return <div>認証情報を確認中...</div>
  }

  if (!user) {
    return <LoginForm onSubmit={login} />
  }

  return (
    <div>
      <p>ようこそ、{user.userName}さん</p>
      <button onClick={logout}>ログアウト</button>
    </div>
  )
}
```

### 保護されたルート

```tsx
function ProtectedPage() {
  const { user, checkAuthComplete } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (checkAuthComplete && !user) {
      router.push('/auth/login')
    }
  }, [checkAuthComplete, user, router])

  if (!checkAuthComplete || !user) {
    return <div>Loading...</div>
  }

  return <div>Protected content</div>
}
```

## 状態管理

| State               | 型           | 説明                   |
| ------------------- | ------------ | ---------------------- |
| `user`              | User \| null | 現在のユーザー情報     |
| `checkAuthComplete` | boolean      | 初回チェック完了フラグ |

## エラーハンドリング

### ログインエラー

```tsx
try {
  await login(email, password)
} catch (error) {
  if (error.message === 'メールアドレスが認証されていません') {
    // メール認証画面へ
  } else {
    // 一般的なエラー処理
  }
}
```

### 登録エラー

```tsx
try {
  await register(formData)
} catch (error) {
  if (error.fieldErrors) {
    // フィールド別エラー表示
  } else {
    // 一般的なエラー
  }
}
```

## セキュリティ考慮事項

1. **HTTPOnlyクッキー**

   - JWTトークンはJavaScriptからアクセス不可
   - XSS攻撃への対策

2. **credentials: 'include'**

   - すべてのAPI呼び出しでクッキーを送信
   - CORS設定との連携が必要

3. **エラー時のクリーンアップ**
   - ログアウト失敗時もローカル状態をクリア
   - セキュリティを優先

## パフォーマンス最適化

1. **初回チェックの最適化**

   - アプリ起動時に1回のみ実行
   - checkAuthCompleteフラグで管理

2. **不要な再レンダリング防止**
   - Context値のメモ化
   - 子コンポーネントへの影響を最小化

## 関連ファイル

- `/api/auth/*`: 認証APIエンドポイント
- `lib/auth/auth.ts`: サーバーサイド認証ロジック
- `components/auth/AuthGuard.tsx`: 認証ガードコンポーネント
