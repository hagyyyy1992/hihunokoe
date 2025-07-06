# posts/page.tsx

## 概要

コスメ体験投稿の一覧表示ページ。高度なフィルタリング機能とページネーションを備えた、メインのブラウジングページです。

## 主要機能

### フィルタリングシステム

```typescript
interface Filters {
  skinType: SkinType | ''
  category: CosmeticCategory | ''
  mood: MoodTag | ''
  keyword: string
}
```

#### フィルターオプション

- **肌質**: 普通肌、乾燥肌、脂性肌、混合肌、敏感肌
- **カテゴリー**: 化粧水、美容液、クリーム、ファンデーションなど14種類
- **気分タグ**: がっかり、まあまあ、いい感じ、お気に入り、運命
- **キーワード検索**: 商品名や投稿内容で検索

### ページネーション

- 1ページあたり12件表示
- 前後ページへのナビゲーション
- 現在のページ番号表示
- フィルター状態を維持したまま遷移

### データ取得

```typescript
const fetchPosts = async () => {
  const queryParams = new URLSearchParams({
    page: currentPage.toString(),
    limit: POSTS_PER_PAGE.toString(),
    ...Object.entries(filters).filter(([_, value]) => value),
  })

  const response = await fetch(`/api/posts?${queryParams}`)
}
```

## UI/UX設計

### レイアウト

- レスポンシブグリッド（1〜3列）
- モバイルファーストデザイン
- スティッキーヘッダー（フィルターエリア）

### ローディング状態

- スケルトンローダー表示
- 12個のプレースホルダーカード

### 空状態

```typescript
{posts.length === 0 && (
  <div className="text-center">
    <p>投稿が見つかりませんでした</p>
    <p>フィルターを変更してみてください</p>
  </div>
)}
```

### アクションボタン

- 認証済みユーザーのみ「体験を投稿する」ボタン表示
- フローティングアクションボタンスタイル

## 状態管理

| State         | 型      | 説明                 |
| ------------- | ------- | -------------------- |
| `posts`       | Post[]  | 投稿データの配列     |
| `filters`     | Filters | 現在のフィルター状態 |
| `currentPage` | number  | 現在のページ番号     |
| `totalPages`  | number  | 総ページ数           |
| `isLoading`   | boolean | データ取得中フラグ   |

## パフォーマンス最適化

- デバウンスされたキーワード検索
- ページ遷移時のスムーズなスクロール
- 条件付きレンダリングによる不要な再描画防止

## 依存関係

- `@/components/ui/PostCard`: 投稿カード表示
- `@/lib/auth/AuthContext`: 認証状態確認
- `@/types`: 型定義（Post, SkinType等）

## API連携

```typescript
GET /api/posts
Query Parameters:
- page: number
- limit: number
- skinType?: SkinType
- category?: CosmeticCategory
- mood?: MoodTag
- keyword?: string
```

## アクセシビリティ

- セレクトボックスの適切なラベル
- ページネーションのaria-label
- キーボードナビゲーション対応

## 関連ページ

- `/posts/new`: 新規投稿作成
- `/posts/[id]`: 投稿詳細表示
