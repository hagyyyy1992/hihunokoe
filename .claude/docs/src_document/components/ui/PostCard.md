# components/ui/PostCard.tsx

## 概要

コスメ体験投稿を表示するカードコンポーネント。投稿の概要、ユーザー情報、インタラクション要素を統合的に表示します。

## Props

```typescript
interface PostCardProps {
  post: Post // 投稿データオブジェクト
}

interface Post {
  id: string
  title: string
  content: string
  cosmeticName: string
  cosmeticCategory?: string
  skinType?: string
  moodTag?: string
  publishedAt: string
  empathyCount: number
  viewCount: number
  user: {
    id: string
    userName: string
    skinType?: string
  }
  _count: {
    empathies: number
    comments: number
  }
}
```

## 主要機能

### 表示内容

1. **投稿情報**

   - タイトル
   - コスメ商品名
   - 内容（150文字で切り詰め）
   - 投稿日時（相対時間表示）

2. **カテゴリーバッジ**

   ```typescript
   const categoryLabels: Record<string, string> = {
     toner: '化粧水',
     serum: '美容液',
     cream: 'クリーム',
     // ... 全14カテゴリー
   }
   ```

3. **気分タグ**

   - がっかり（disappointment）: グレー
   - まあまあ（okay）: 青
   - いい感じ（good）: 緑
   - お気に入り（love）: ピンク
   - 運命（perfect）: 紫

4. **ユーザー情報**

   - ユーザー名
   - 肌質バッジ（オプション）

5. **エンゲージメント**
   - 共感ボタン（認証時のみインタラクティブ）
   - コメント数
   - 閲覧数

### 共感機能の統合

```typescript
useEffect(() => {
  if (user && post) {
    checkEmpathyStatus()
  }
}, [user, post])
```

- 認証ユーザーの場合、共感状態を自動取得
- 非認証ユーザーには静的な共感数を表示

## スタイリング

### レイアウト

- カード型デザイン（影付き）
- ホバー時の浮き上がり効果
- レスポンシブ対応

### カラースキーム

```typescript
const moodColors = {
  disappointed: 'bg-gray-100 text-gray-700',
  okay: 'bg-blue-100 text-blue-700',
  good: 'bg-green-100 text-green-700',
  love: 'bg-pink-100 text-pink-700',
  perfect: 'bg-purple-100 text-purple-700',
}
```

## 使用例

### 基本的な使用

```tsx
<PostCard post={postData} />
```

### 投稿一覧での使用

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {posts.map(post => (
    <PostCard key={post.id} post={post} />
  ))}
</div>
```

### リンクとの組み合わせ

```tsx
<Link href={`/posts/${post.id}`}>
  <PostCard post={post} />
</Link>
```

## 依存関係

- `@/components/ui/Badge`: カテゴリー・肌質表示
- `@/components/ui/MoodTag`: 気分タグ表示
- `@/components/ui/EmpathyButton`: 共感ボタン
- `@/lib/auth/AuthContext`: 認証状態
- `date-fns`: 日時フォーマット

## パフォーマンス最適化

- 共感状態のチェックは認証時のみ
- 長文コンテンツの切り詰めで描画負荷軽減
- 条件付きレンダリングで不要な要素を削減

## アクセシビリティ

- セマンティックHTMLの使用
- 適切な見出し階層（h3）
- カラーコントラストの確保
- フォーカス可能な要素の適切な配置

## 注意事項

- 投稿データは事前に取得済みである必要がある
- 共感機能は認証状態に依存
- 日時表示は日本語ロケールを使用
