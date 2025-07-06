# posts/[id]/page.tsx

## 概要

個別のコスメ体験投稿の詳細を表示するページ。投稿内容、ユーザー情報、体験詳細、エンゲージメント機能を包括的に表示します。

## 主要機能

### 投稿情報表示

- **基本情報**: 商品名、ブランド名、カテゴリー
- **ユーザー情報**: 投稿者名（匿名可）、肌質
- **評価**: 5段階評価の星表示
- **投稿内容**: 改行を保持した本文表示
- **メタ情報**: 投稿日時、閲覧数

### 詳細情報表示

#### 使用シチュエーション

```typescript
const situationLabels = {
  season: { label: '季節', values: seasonLabels },
  timeOfDay: { label: '時間帯', values: timeOfDayLabels },
  skinCondition: { label: '肌の状態' },
  specialCare: { label: '特別なケア', values: specialCareLabels },
}
```

#### 体験詳細

```typescript
const experienceLabels = {
  fragrance: {
    label: '香りの強さ',
    values: fragranceStrengthLabels,
  },
  texture: {
    label: 'テクスチャー',
    values: textureTypeLabels,
  },
  afterUse: {
    label: '使用後の感覚',
    values: afterUseFeelingLabels,
  },
}
```

### エンゲージメント機能（現在コメントアウト）

- **共感ボタンシステム**: 4種類の反応
- **コメントシステム**: 返信機能付き
- **認証ゲート**: ログインユーザーのみ利用可

### 投稿者専用機能

```typescript
{user && user.id === post.userId && (
  <div className="flex gap-2">
    <Link href={`/posts/${post.id}/edit`}>
      <Button>編集</Button>
    </Link>
  </div>
)}
```

## データ取得

### API通信

```typescript
// 投稿データ取得
const postResponse = await fetch(`/api/posts/get?id=${id}`)

// 共感状態確認（認証時）
const empathyResponse = await fetch(`/api/posts/${id}/empathy/status`, { credentials: 'include' })
```

### エラーハンドリング

- 投稿が見つからない場合の404表示
- APIエラーのキャッチと表示

## UI/UX設計

### レイアウト構造

1. **ヘッダーセクション**: ユーザー情報とカテゴリー
2. **メインコンテンツ**: 商品情報と投稿本文
3. **詳細情報セクション**: 使用状況と体験詳細
4. **エンゲージメントセクション**: 共感とコメント

### ビジュアル要素

- **MoodTag**: 気分を色で表現
- **評価スター**: 視覚的な5段階評価
- **Badgeコンポーネント**: カテゴリーや情報の強調表示

## ラベルマッピング

包括的なenumからラベルへの変換マッピング：

```typescript
const categoryLabels: Record<string, string> = {
  toner: '化粧水',
  serum: '美容液',
  cream: 'クリーム',
  // ... 全14カテゴリー
}
```

## 状態管理

| State            | 型                  | 説明             |
| ---------------- | ------------------- | ---------------- |
| `post`           | Post \| null        | 投稿データ       |
| `loading`        | boolean             | データ取得中     |
| `error`          | string \| null      | エラーメッセージ |
| `currentEmpathy` | EmpathyType \| null | 現在の共感状態   |

## 依存関係

- `@/components/ui/*`: UI コンポーネント群
- `@/components/comments/*`: コメント関連（現在未使用）
- `@/lib/auth/AuthContext`: 認証状態
- `@/types`: 型定義

## パフォーマンス考慮

- 初回レンダリング時のローディング表示
- 条件付きレンダリングで不要な処理を削減
- 大量のラベルマッピングをconstで最適化

## 関連ページ

- `/posts`: 投稿一覧
- `/posts/[id]/edit`: 投稿編集（投稿者のみ）
