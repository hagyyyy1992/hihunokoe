# api/posts/route.ts

## 概要

コスメ体験投稿の作成と一覧取得を行うメインAPIエンドポイント。フィルタリング、ページネーション、検索機能を提供します。

## エンドポイント

### POST /api/posts

新規投稿を作成します。

#### リクエスト

```typescript
Headers:
  Content-Type: application/json
  Cookie: auth-token=<jwt-token>  // 必須

Body: {
  title: string                   // タイトル（必須、最大200文字）
  content: string                 // 本文（必須）
  cosmeticName: string           // 商品名（必須、最大200文字）
  cosmeticCategory?: string      // カテゴリー
  skinType?: string              // 肌質
  usageSituation?: {             // 使用シチュエーション
    season?: string[]            // 季節
    timeOfDay?: string[]         // 時間帯
    menstrualCycle?: string[]    // 生理周期
    skinCondition?: string[]     // 肌の状態
    weatherCondition?: string[]  // 天候
  }
  experienceDetails?: {          // 体験詳細
    fragrance?: {                // 香り
      type?: string
      intensity?: string
      description?: string
    }
    texture?: {                  // テクスチャー
      type?: string
      spreadability?: string
      absorption?: string
      description?: string
    }
    afterUse?: {                 // 使用後
      moisture?: string
      texture?: string
      comfort?: string
      duration?: string
      description?: string
    }
  }
  moodTag?: string               // 気分タグ
}
```

#### レスポンス

```json
// 成功 (201 Created)
{
  "id": "uuid",
  "title": "投稿タイトル",
  "content": "投稿内容",
  "cosmeticName": "商品名",
  "cosmeticCategory": "serum",
  "skinType": "dry",
  "usageSituation": {...},
  "experienceDetails": {...},
  "moodTag": "love",
  "viewCount": 0,
  "empathyCount": 0,
  "commentCount": 0,
  "status": "published",
  "userId": "user-uuid",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "user": {
    "id": "user-uuid",
    "userName": "username",
    "skinType": "dry"
  }
}

// エラー (400 Bad Request)
{
  "error": "タイトルと内容は必須です"
}

// 認証エラー (401 Unauthorized)
{
  "error": "認証が必要です"
}
```

### GET /api/posts

投稿一覧を取得します。

#### リクエスト

```
Query Parameters:
  page?: number        // ページ番号（デフォルト: 1）
  limit?: number       // 取得件数（デフォルト: 10）
  skinType?: string    // 肌質フィルター
  category?: string    // カテゴリーフィルター
  moodTag?: string     // 気分タグフィルター
  search?: string      // 検索キーワード
```

#### レスポンス

```json
{
  "posts": [
    {
      "id": "uuid",
      "title": "投稿タイトル",
      "content": "投稿内容...",
      "cosmeticName": "商品名",
      "cosmeticCategory": "serum",
      "skinType": "dry",
      "moodTag": "love",
      "viewCount": 123,
      "empathyCount": 45,
      "commentCount": 12,
      "createdAt": "2024-01-01T00:00:00Z",
      "user": {
        "id": "user-uuid",
        "userName": "username",
        "skinType": "dry"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## 主要機能

### 入力検証

```typescript
const postSchema = z.object({
  title: z.string().max(200, 'タイトルは200文字以内で入力してください'),
  content: z.string(),
  cosmeticName: z.string().max(200, '商品名は200文字以内で入力してください'),
  // ... その他のフィールド
})
```

### フィルタリング

- 肌質による絞り込み
- カテゴリーによる絞り込み
- 気分タグによる絞り込み
- キーワード検索（タイトル、内容、商品名）

### ページネーション

- ページ単位での取得
- 総件数とページ数の計算
- カスタマイズ可能な取得件数

### ソート順

- 作成日時の降順（新しい投稿が上）
- 公開状態の投稿のみ表示

## データベース操作

### 投稿作成時のトランザクション

```typescript
const result = await prisma.$transaction(async (tx) => {
  // 1. 投稿を作成
  const post = await tx.post.create({...})

  // 2. 関連データを含めて再取得
  return await tx.post.findUnique({
    where: { id: post.id },
    include: { user: true }
  })
})
```

### 検索クエリ

```typescript
where: {
  status: 'published',
  AND: [
    skinType ? { skinType } : {},
    category ? { cosmeticCategory: category } : {},
    moodTag ? { moodTag } : {},
    search ? {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { cosmeticName: { contains: search, mode: 'insensitive' } }
      ]
    } : {}
  ]
}
```

## エラーハンドリング

- 認証エラー：401
- バリデーションエラー：400
- サーバーエラー：500
- 詳細なエラーメッセージ

## セキュリティ

- JWT認証必須（POST）
- 入力データの厳密な検証
- SQLインジェクション対策（Prisma使用）

## 使用例

### 新規投稿作成

```javascript
const response = await fetch('/api/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    title: '乾燥肌に最適な美容液を見つけました',
    content: '使用感がとても良く...',
    cosmeticName: '○○美容液',
    cosmeticCategory: 'serum',
    skinType: 'dry',
    moodTag: 'love',
  }),
})
```

### 投稿一覧取得

```javascript
const response = await fetch('/api/posts?skinType=dry&page=1&limit=10')
const data = await response.json()
console.log(`全${data.pagination.total}件中、${data.posts.length}件取得`)
```
