# posts/[id]/edit/page.tsx

## 概要

既存のコスメ体験投稿を編集するページ。投稿者のみがアクセス可能で、編集と削除機能を提供します。

## 主要機能

### 認可チェック

```typescript
if (post.userId !== user.id) {
  return (
    <div className="container mx-auto px-4 py-8">
      <p className="text-red-600">この投稿を編集する権限がありません。</p>
    </div>
  )
}
```

- 投稿者以外のアクセスを拒否
- 明確なエラーメッセージ表示

### データ検証

```typescript
const validateEnumValue = <T extends string>(
  value: string | undefined,
  validValues: readonly T[],
  defaultValue: T
): T => {
  if (!value) return defaultValue
  return validValues.includes(value as T) ? (value as T) : defaultValue
}
```

- enum値の厳密な検証
- 不正な値をデフォルト値で置換
- 型安全性の確保

### 削除機能

```typescript
useEffect(() => {
  if (window.location.hash === '#delete') {
    setShowDeleteConfirm(true)
  }
}, [])
```

#### 削除フロー

1. URLハッシュ（#delete）で削除モード起動
2. 確認ダイアログ表示
3. 削除API呼び出し
4. 成功時は投稿一覧へリダイレクト

## データ準備

### 初期データ整形

```typescript
const initialData: Partial<Post> = {
  ...post,
  category: validateEnumValue(post.category, COSMETIC_CATEGORIES, 'other'),
  mood: post.mood ? validateEnumValue(post.mood, MOOD_TAGS, 'okay') : undefined,
  // ... その他のフィールド検証
}
```

### 配列データの検証

```typescript
situation: post.situation
  ? {
      ...post.situation,
      season: Array.isArray(post.situation.season)
        ? post.situation.season.filter(s => SEASONS.includes(s as (typeof SEASONS)[number]))
        : undefined,
      // ... 他の配列フィールド
    }
  : undefined
```

## UI/UX設計

### 削除確認ダイアログ

```typescript
<AlertDialog open={showDeleteConfirm}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>投稿を削除しますか？</AlertDialogTitle>
      <AlertDialogDescription>
        この操作は取り消せません。
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>キャンセル</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>
        削除する
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### レイアウト

- 最大幅2xlで中央配置
- ヘッダーに編集/削除アクション
- PostFormコンポーネントを編集モードで使用

## API連携

### 投稿データ取得

```typescript
GET /api/posts/get?id={id}
```

### 投稿削除

```typescript
DELETE /api/posts/delete
Body: { postId: string }
```

## 状態管理

| State               | 型             | 説明             |
| ------------------- | -------------- | ---------------- |
| `post`              | Post \| null   | 編集対象の投稿   |
| `loading`           | boolean        | データ取得中     |
| `error`             | string \| null | エラーメッセージ |
| `showDeleteConfirm` | boolean        | 削除確認表示     |
| `isDeleting`        | boolean        | 削除処理中       |

## セキュリティ考慮事項

- クライアントサイドの認可チェック
- サーバーサイドでも追加の認可検証（API側）
- 削除操作の確認プロセス

## 定数定義

```typescript
const COSMETIC_CATEGORIES = [...] as const
const MOOD_TAGS = [...] as const
const SEASONS = [...] as const
// ... 他の定数
```

型安全性のための厳密な定数定義

## エラーハンドリング

- データ取得エラー
- 認可エラー
- 削除エラー
- 無効なenum値の処理

## 関連コンポーネント

- `PostForm`: 実際の編集フォーム
- `AlertDialog`: 削除確認ダイアログ
- `/posts`: 削除後のリダイレクト先
