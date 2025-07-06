# components/ui/EmpathyButton.tsx

## 概要

投稿への共感（いいね）を表現するインタラクティブボタン。楽観的UI更新により、快適なユーザー体験を提供します。

## Props

```typescript
interface EmpathyButtonProps {
  postId: string // 投稿ID（必須）
  initialCount: number // 初期共感数（必須）
  initialHasEmpathized?: boolean // 初期共感状態（デフォルト: false）
  initialEmpathyType?: EmpathyType // 初期共感タイプ
  className?: string // 追加CSSクラス
  size?: 'sm' | 'md' | 'lg' // サイズ（デフォルト: 'md'）
  initializing?: boolean // 初期化中フラグ（デフォルト: false）
}

type EmpathyType = 'helpful' | 'same' | 'interested' | 'tried'
```

## 主要機能

### 楽観的UI更新

```typescript
// 即座にUIを更新
setHasEmpathized(!hasEmpathized)
setCount(hasEmpathized ? count - 1 : count + 1)

// その後サーバーと同期
try {
  const result = await toggleEmpathy(postId, hasEmpathized)
  // 成功時は何もしない（既に更新済み）
} catch (error) {
  // エラー時は元に戻す
  setHasEmpathized(hasEmpathized)
  setCount(hasEmpathized ? count + 1 : count - 1)
}
```

### エラーハンドリング

- エラー時は元の状態に戻す
- 一時的なエラーメッセージを表示（2秒後に自動消去）
- ユーザーに再試行を促す

### サイズバリエーション

```typescript
const sizeClasses = {
  sm: 'px-2 py-1 text-sm',
  md: 'px-3 py-1.5 text-base',
  lg: 'px-4 py-2 text-lg',
}
```

## 表示状態

### 共感していない状態

```
🤍 共感する 42
```

### 共感している状態

```
❤️ 共感済み 43
```

### ローディング中

```
[パルスアニメーション] 処理中... 42
```

### エラー状態

```
❤️ 共感済み 43
エラーが発生しました
```

### 小サイズ（sm）

```
❤️ 43  // テキストなし、数字のみ
```

## 使用例

### 基本的な使用

```tsx
<EmpathyButton postId={post.id} initialCount={post.empathyCount} />
```

### 初期状態を指定

```tsx
<EmpathyButton
  postId={post.id}
  initialCount={post.empathyCount}
  initialHasEmpathized={userEmpathy !== null}
  initialEmpathyType={userEmpathy?.type}
/>
```

### PostCard内での使用

```tsx
{
  user ? (
    <EmpathyButton
      postId={post.id}
      initialCount={post.empathyCount}
      initialHasEmpathized={hasEmpathized}
      size="sm"
      initializing={checkingEmpathy}
    />
  ) : (
    <div className="text-gray-500">❤️ {post.empathyCount}</div>
  )
}
```

### カスタムスタイル

```tsx
<EmpathyButton
  postId={post.id}
  initialCount={count}
  className="shadow-lg hover:shadow-xl"
  size="lg"
/>
```

## スタイリング

### 基本スタイル

```typescript
const baseClasses = cn(
  'inline-flex items-center gap-2 rounded-full',
  'transition-all duration-200',
  'focus:outline-none focus:ring-2 focus:ring-offset-2',
  hasEmpathized
    ? 'bg-pink-100 text-pink-700 hover:bg-pink-200 focus:ring-pink-500'
    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500',
  loading && 'opacity-50 cursor-not-allowed animate-pulse'
)
```

### アニメーション

- ホバー時の背景色変化
- クリック時のスケール変化
- ローディング時のパルス効果
- エラーメッセージのフェードイン/アウト

## API連携

### 共感の追加/削除

```typescript
const toggleEmpathy = async (postId: string, hasEmpathized: boolean) => {
  const method = hasEmpathized ? 'DELETE' : 'POST'
  const response = await fetch(`/api/posts/${postId}/empathy`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'POST' ? JSON.stringify({ empathyType: 'helpful' }) : undefined,
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('共感の更新に失敗しました')
  }

  return response.json()
}
```

## パフォーマンス最適化

- 楽観的更新によるレスポンスの高速化
- デバウンス処理で連続クリックを防止
- プロップの変更時のみ状態を同期

## アクセシビリティ

- 適切なaria-label
- フォーカス可能（キーボード操作対応）
- 視覚的フィードバック（フォーカスリング）
- スクリーンリーダー対応のテキスト

## エラー処理のベストプラクティス

1. ユーザーの操作を即座に反映（楽観的更新）
2. バックグラウンドでサーバーと同期
3. エラー時は元の状態に戻す
4. 明確なエラーメッセージを表示
5. 自動的にメッセージを消去

## 依存関係

- React hooks（useState, useCallback, useEffect）
- クラス名ユーティリティ（cn）
- 認証状態（間接的に）
