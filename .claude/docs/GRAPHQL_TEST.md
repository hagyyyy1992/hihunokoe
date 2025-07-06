# GraphQL API動作確認手順

## 開発サーバーの起動

```bash
# 別のターミナルで実行
npm run dev
```

サーバーはhttp://localhost:3000（またはhttp://localhost:3001）で起動します。

## 1. GraphQL Playgroundでの確認

ブラウザで以下のURLにアクセス:

```
http://localhost:3000/api/graphql
```

## 2. 投稿一覧の取得

以下のクエリを実行:

```graphql
query GetPosts {
  posts(first: 10, orderBy: CREATED_AT_DESC) {
    edges {
      node {
        id
        title
        content
        cosmeticName
        skinType
        moodTag
        author {
          userName
        }
        createdAt
        empathyCount
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

## 3. 特定の投稿の詳細取得

```graphql
query GetPost($id: ID!) {
  post(id: $id) {
    id
    title
    content
    cosmeticName
    cosmeticCategory
    skinType
    moodTag
    author {
      id
      userName
      skinType
    }
    createdAt
    updatedAt
    empathyCount
    comments(first: 10) {
      edges {
        node {
          id
          content
          author {
            userName
          }
          createdAt
        }
      }
    }
  }
}
```

Variables:

```json
{
  "id": "1"
}
```

## 4. 投稿の作成（認証が必要）

まず、ログインして認証トークンを取得:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user1@example.com", "password": "demo123"}'
```

取得したトークンを使用して投稿作成:

```graphql
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    id
    title
    content
    cosmeticName
  }
}
```

Variables:

```json
{
  "input": {
    "title": "GraphQLテスト投稿",
    "content": "GraphQL APIから作成した投稿です",
    "cosmeticName": "テスト化粧品",
    "cosmeticCategory": "FOUNDATION",
    "skinType": "NORMAL",
    "moodTag": "KAWAII"
  }
}
```

Headers:

```json
{
  "Authorization": "Bearer YOUR_TOKEN_HERE"
}
```

## 5. UIでの動作確認

1. **投稿一覧ページ**: http://localhost:3000/posts

   - GraphQLクエリで投稿一覧が表示されることを確認
   - フィルタリング機能の動作確認
   - ページネーションの動作確認

2. **投稿作成ページ**: http://localhost:3000/posts/new

   - ログイン後にアクセス
   - フォームからの投稿作成がGraphQL Mutationで実行されることを確認

3. **投稿詳細ページ**: http://localhost:3000/posts/[id]
   - 各投稿の詳細がGraphQLクエリで表示されることを確認
   - コメント一覧の表示確認

## トラブルシューティング

### サーバーが起動しない場合

```bash
# プロセスを確認
ps aux | grep "next dev"

# ポートを変更して起動
npm run dev -- -p 3002
```

### GraphQL Playgroundが表示されない場合

NODE_ENV=developmentで起動していることを確認してください。

### 認証エラーが発生する場合

1. ブラウザのCookieをクリア
2. 再度ログイン
3. 開発者ツールでAuthorizationヘッダーが送信されているか確認
