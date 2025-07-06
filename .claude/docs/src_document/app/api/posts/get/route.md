# api/posts/get/route.ts

## 概要

特定の投稿の詳細情報を取得するAPIエンドポイント。閲覧数の自動インクリメント、関連データの取得を行います。

## エンドポイント

```
GET /api/posts/get
```

## リクエスト

### Query Parameters

```
id: string  // 投稿ID（UUID形式、必須）
```

### 例

```
GET /api/posts/get?id=123e4567-e89b-12d3-a456-426614174000
```

## レスポンス

### 成功 (200 OK)

```json
{
  "post": {
    "id": "uuid",
    "title": "投稿タイトル",
    "content": "投稿本文...",
    "cosmeticName": "商品名",
    "cosmeticCategory": "serum",
    "skinType": "dry",
    "usageSituation": {
      "season": ["spring", "summer"],
      "timeOfDay": ["morning"],
      "skinCondition": ["good"]
    },
    "experienceDetails": {
      "fragrance": {
        "type": "floral",
        "intensity": "moderate",
        "description": "優しい花の香り"
      },
      "texture": {
        "type": "gel",
        "spreadability": "easy",
        "absorption": "fast"
      },
      "afterUse": {
        "moisture": "moist",
        "texture": "smooth",
        "comfort": "comfortable"
      }
    },
    "moodTag": "love",
    "viewCount": 124,  // 自動的に+1される
    "empathyCount": 45,
    "commentCount": 12,
    "status": "published",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "user": {
      "id": "user-uuid",
      "userName": "username",
      "skinType": "dry"
    },
    "empathies": [
      {
        "id": "empathy-uuid",
        "empathyType": "helpful",
        "user": {
          "id": "user-uuid",
          "userName": "otheruser"
        }
      }
    ],
    "comments": [
      {
        "id": "comment-uuid",
        "content": "とても参考になりました！",
        "parentId": null,
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00Z",
        "user": {
          "id": "user-uuid",
          "userName": "commenter"
        },
        "replies": [
          {
            "id": "reply-uuid",
            "content": "ありがとうございます！",
            "parentId": "comment-uuid",
            "user": {...}
          }
        ],
        "_count": {
          "replies": 1
        }
      }
    ],
    "_count": {
      "empathies": 45,
      "comments": 12
    }
  }
}
```

### エラーレスポンス

#### バリデーションエラー (400)

```json
{
  "error": "投稿IDが必要です"
}

{
  "error": "無効な投稿IDフォーマットです"
}
```

#### 投稿が見つからない (404)

```json
{
  "error": "投稿が見つかりません"
}
```

## 主要機能

### 閲覧数の自動インクリメント

```typescript
await prisma.post.update({
  where: { id },
  data: { viewCount: { increment: 1 } },
})
```

- 投稿を取得するたびに自動的に閲覧数が1増加
- 同一ユーザーの重複カウントも含む（簡易実装）

### 関連データの取得

取得される関連データ：

1. **ユーザー情報**: 投稿者の基本情報
2. **共感情報**: すべての共感とそのユーザー情報
3. **コメント情報**: アクティブなコメントと返信（階層構造）
4. **カウント情報**: 共感数とコメント数

### コメントの階層構造

```typescript
include: {
  comments: {
    where: {
      parentId: null,      // トップレベルコメントのみ
      isActive: true       // アクティブなもののみ
    },
    include: {
      user: true,
      replies: {           // 返信を含める
        where: { isActive: true },
        include: { user: true }
      },
      _count: {
        select: { replies: true }
      }
    }
  }
}
```

## UUID検証

```typescript
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

if (!uuidRegex.test(id)) {
  return NextResponse.json({ error: '無効な投稿IDフォーマットです' }, { status: 400 })
}
```

## データベースモード/モックモード

- データベース接続時：Prismaを使用してPostgreSQLから取得
- モックモード時：メモリ内のモックデータから取得
- 自動的に環境に応じて切り替え

## パフォーマンス考慮

- 必要な関連データのみをincludeで取得
- N+1問題を回避する設計
- 大量のコメントがある場合の対策（ページネーション検討）

## 使用例

### JavaScriptでの使用

```javascript
const getPostDetail = async postId => {
  try {
    const response = await fetch(`/api/posts/get?id=${postId}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error)
    }

    const data = await response.json()
    return data.post
  } catch (error) {
    console.error('投稿の取得に失敗:', error)
    throw error
  }
}
```

### Reactコンポーネントでの使用

```typescript
useEffect(() => {
  const fetchPost = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/posts/get?id=${id}`)
      if (response.ok) {
        const data = await response.json()
        setPost(data.post)
      } else {
        setError('投稿が見つかりません')
      }
    } catch (error) {
      setError('投稿の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  fetchPost()
}, [id])
```

## 関連エンドポイント

- `/api/posts` - 投稿一覧・作成
- `/api/posts/[id]/empathy` - 共感の管理
- `/api/posts/[id]/comments` - コメントの投稿
