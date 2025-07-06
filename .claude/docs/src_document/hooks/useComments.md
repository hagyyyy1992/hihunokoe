# hooks/useComments.ts

## 概要

投稿に対するコメント機能を包括的に管理するカスタムフック。コメントの取得、ページネーション、CRUD操作、返信機能を提供します。

## 引数

```typescript
interface UseCommentsOptions {
  postId: string // 投稿ID（必須）
  initialPage?: number // 初期ページ番号（デフォルト: 1）
  initialLimit?: number // 1ページあたりの件数（デフォルト: 10）
}
```

## 戻り値

```typescript
interface UseCommentsReturn {
  comments: Comment[] // コメント配列
  pagination: CommentsPagination // ページネーション情報
  isLoading: boolean // ローディング状態
  error: string // エラーメッセージ
  fetchComments: (page?: number) => Promise<void> // コメント取得
  addComment: (comment: Comment) => void // コメント追加
  updateComment: (commentId: string, updatedComment: Comment) => void // コメント更新
  deleteComment: (commentId: string) => void // コメント削除
  addReply: (parentCommentId: string, reply: Comment) => void // 返信追加
  refreshComments: () => Promise<void> // リフレッシュ
  loadMore: () => Promise<void> // 次ページ読み込み
}
```

## 基本的な使用方法

```tsx
import { useComments } from '@/hooks/useComments'

function CommentSection({ postId }: { postId: string }) {
  const { comments, pagination, isLoading, error, addComment, loadMore } = useComments({ postId })

  if (isLoading && comments.length === 0) {
    return <div>コメントを読み込み中...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div>
      {comments.map(comment => (
        <CommentItem key={comment.id} comment={comment} />
      ))}

      {pagination.hasMore && (
        <button onClick={loadMore} disabled={isLoading} className="mt-4">
          {isLoading ? '読み込み中...' : 'もっと見る'}
        </button>
      )}
    </div>
  )
}
```

## 高度な使用例

### コメント投稿機能

```tsx
function CommentForm({ postId }: { postId: string }) {
  const [content, setContent] = useState('')
  const { addComment } = useComments({ postId })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // APIでコメントを作成
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
        credentials: 'include',
      })

      if (response.ok) {
        const newComment = await response.json()
        addComment(newComment) // UIを即座に更新
        setContent('')
      }
    } catch (error) {
      console.error('コメントの投稿に失敗しました')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="コメントを入力..."
        required
      />
      <button type="submit">投稿</button>
    </form>
  )
}
```

### 返信機能

```tsx
function ReplyForm({
  parentCommentId,
  onReply,
}: {
  parentCommentId: string
  onReply: (reply: Comment) => void
}) {
  const [content, setContent] = useState('')
  const { addReply } = useComments({ postId: 'post-id' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const response = await fetch(`/api/comments/${parentCommentId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
      credentials: 'include',
    })

    if (response.ok) {
      const reply = await response.json()
      addReply(parentCommentId, reply)
      onReply(reply)
      setContent('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="ml-8 mt-2">
      <input
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="返信を入力..."
        required
      />
      <button type="submit">返信</button>
    </form>
  )
}
```

### 編集・削除機能

```tsx
function CommentActions({ comment }: { comment: Comment }) {
  const { updateComment, deleteComment } = useComments({
    postId: comment.postId,
  })
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)

  const handleUpdate = async () => {
    const response = await fetch(`/api/comments/${comment.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editContent }),
      credentials: 'include',
    })

    if (response.ok) {
      const updated = await response.json()
      updateComment(comment.id, updated)
      setIsEditing(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('コメントを削除しますか？')) return

    const response = await fetch(`/api/comments/${comment.id}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    if (response.ok) {
      deleteComment(comment.id)
    }
  }

  return (
    <div>
      {isEditing ? (
        <div>
          <textarea value={editContent} onChange={e => setEditContent(e.target.value)} />
          <button onClick={handleUpdate}>保存</button>
          <button onClick={() => setIsEditing(false)}>キャンセル</button>
        </div>
      ) : (
        <div>
          <button onClick={() => setIsEditing(true)}>編集</button>
          <button onClick={handleDelete}>削除</button>
        </div>
      )}
    </div>
  )
}
```

## API連携

### エンドポイント

```
GET /api/posts/comments?id={postId}&page={page}&limit={limit}
```

### レスポンス形式

```typescript
{
  comments: Comment[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasMore: boolean
  }
}
```

## 主要機能の詳細

### 自動初期読み込み

```typescript
useEffect(() => {
  if (postId) {
    fetchComments(currentPage)
  }
}, [postId])
```

### 楽観的更新

- `addComment`: 即座にUIに反映
- `updateComment`: ローカル状態を即更新
- `deleteComment`: UIから即削除

### ネストされた返信の処理

```typescript
// 返信を含むコメントの更新・削除時、
// トップレベルと返信の両方を検索
const findAndUpdateComment = (commentId: string) => {
  // トップレベルを検索
  // 見つからない場合は返信を検索
}
```

## エラーハンドリング

- APIエラーをキャッチして日本語メッセージで表示
- ネットワークエラーのフォールバック
- ローディング中の重複リクエスト防止

## パフォーマンス最適化

- `useCallback`による関数メモ化
- 条件付き初期読み込み
- ページネーションによる段階的読み込み

## 型定義

```typescript
interface Comment {
  id: string
  content: string
  postId: string
  userId: string
  parentId?: string
  createdAt: Date
  updatedAt: Date
  isEdited: boolean
  user?: User
  replies?: Comment[]
  _count?: {
    replies: number
  }
}

interface CommentsPagination {
  page: number
  limit: number
  total: number
  pages: number
  hasMore: boolean
}
```

## 注意事項

- 初回マウント時に自動でコメントを取得
- 削除は論理削除（isActive）を想定
- 返信は2階層まで（返信への返信は非対応）
