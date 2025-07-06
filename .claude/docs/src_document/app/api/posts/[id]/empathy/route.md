# api/posts/[id]/empathy/route.ts

## 概要

投稿への共感（エンパシー）機能を管理するAPIエンドポイント。共感の追加、削除、状態確認を行います。

## エンドポイント

```
GET    /api/posts/[id]/empathy  // 共感状態の確認
POST   /api/posts/[id]/empathy  // 共感の追加
DELETE /api/posts/[id]/empathy  // 共感の削除
```

## 共感タイプ

```typescript
type EmpathyType =
  | 'understand' // わかる
  | 'interested' // 気になる
  | 'helpful' // 参考になった
  | 'similar' // 同じ経験
  | 'thanks' // ありがとう
```

## GET - 共感状態の確認

### リクエスト

```
GET /api/posts/[id]/empathy
Cookie: auth-token=<jwt-token>  // 必須
```

### レスポンス

```json
// 成功 (200 OK)
{
  "hasEmpathized": true,
  "empathyType": "helpful",
  "totalCount": 45
}

// 共感していない場合
{
  "hasEmpathized": false,
  "totalCount": 45
}

// 認証エラー (401)
{
  "error": "認証が必要です"
}
```

## POST - 共感の追加

### リクエスト

```
POST /api/posts/[id]/empathy
Cookie: auth-token=<jwt-token>  // 必須
Content-Type: application/json

Body:
{
  "empathyType": "helpful"  // オプション（デフォルト: "helpful"）
}
```

### レスポンス

```json
// 成功 (200 OK)
{
  "success": true,
  "empathy": {
    "id": "empathy-uuid",
    "postId": "post-uuid",
    "userId": "user-uuid",
    "empathyType": "helpful",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "totalCount": 46
}

// 既に共感済み (400)
{
  "error": "既にこの投稿に共感しています"
}

// 投稿が見つからない (404)
{
  "error": "投稿が見つかりません"
}
```

## DELETE - 共感の削除

### リクエスト

```
DELETE /api/posts/[id]/empathy
Cookie: auth-token=<jwt-token>  // 必須
```

### レスポンス

```json
// 成功 (200 OK)
{
  "success": true,
  "message": "共感を取り消しました",
  "totalCount": 45
}

// 共感していない (404)
{
  "error": "この投稿に共感していません"
}
```

## 実装の詳細

### トランザクション処理

共感の追加・削除時は、データの整合性を保つためトランザクションを使用：

```typescript
// 共感追加時
await prisma.$transaction(async (tx) => {
  // 1. 共感を作成
  const empathy = await tx.empathy.create({...})

  // 2. 投稿の共感カウントを更新
  await tx.post.update({
    where: { id: postId },
    data: { empathyCount: { increment: 1 } }
  })

  return empathy
})
```

### 重複チェック

```typescript
// 既存の共感をチェック
const existingEmpathy = await prisma.empathy.findFirst({
  where: {
    postId: postId,
    userId: userId,
  },
})

if (existingEmpathy) {
  return NextResponse.json({ error: '既にこの投稿に共感しています' }, { status: 400 })
}
```

### パラメータ検証

```typescript
// UUID形式の検証
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

if (!uuidRegex.test(params.id)) {
  return NextResponse.json({ error: '無効な投稿IDです' }, { status: 400 })
}
```

## セキュリティ

- JWT認証必須（すべてのメソッド）
- ユーザーは自分の共感のみ操作可能
- トランザクションによるデータ整合性保証

## 使用例

### 共感状態の確認

```javascript
const checkEmpathyStatus = async postId => {
  const response = await fetch(`/api/posts/${postId}/empathy`, {
    credentials: 'include',
  })

  if (response.ok) {
    const data = await response.json()
    return data
  }
  return { hasEmpathized: false, totalCount: 0 }
}
```

### 共感の追加

```javascript
const addEmpathy = async (postId, type = 'helpful') => {
  const response = await fetch(`/api/posts/${postId}/empathy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ empathyType: type }),
  })

  if (response.ok) {
    const data = await response.json()
    return data
  }
  throw new Error('共感の追加に失敗しました')
}
```

### 共感の削除

```javascript
const removeEmpathy = async postId => {
  const response = await fetch(`/api/posts/${postId}/empathy`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (response.ok) {
    const data = await response.json()
    return data
  }
  throw new Error('共感の削除に失敗しました')
}
```

## React コンポーネントでの使用例

```typescript
const EmpathyButton = ({ postId }) => {
  const [hasEmpathized, setHasEmpathized] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const toggleEmpathy = async () => {
    setLoading(true)
    try {
      if (hasEmpathized) {
        const data = await removeEmpathy(postId)
        setHasEmpathized(false)
        setTotalCount(data.totalCount)
      } else {
        const data = await addEmpathy(postId, 'helpful')
        setHasEmpathized(true)
        setTotalCount(data.totalCount)
      }
    } catch (error) {
      console.error('共感の操作に失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={toggleEmpathy} disabled={loading}>
      {hasEmpathized ? '❤️' : '🤍'} {totalCount}
    </button>
  )
}
```

## 関連エンドポイント

- `/api/posts/get` - 投稿詳細（共感一覧を含む）
- `/api/posts` - 投稿一覧・作成
