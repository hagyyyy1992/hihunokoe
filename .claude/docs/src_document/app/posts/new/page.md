# posts/new/page.tsx

## 概要

新規コスメ体験投稿の作成ページ。認証が必要な保護されたルートで、投稿ガイドラインと共に投稿フォームを提供します。

## 主要機能

### 認証保護

```typescript
useEffect(() => {
  if (checkAuthComplete && !user) {
    router.push('/auth/login')
  }
}, [checkAuthComplete, user, router])
```

- 未認証ユーザーは自動的にログインページへリダイレクト
- 認証チェック中はローディング表示

### 投稿ガイドライン

ユーザーが質の高い投稿を作成できるよう、以下のガイドラインを表示：

1. **具体的な使用感を書く**

   - テクスチャー、香り、使い心地の詳細

2. **使用期間を明記**

   - どのくらい使用したかの情報

3. **肌の変化を詳しく**

   - Before/Afterの違い

4. **正直な感想を**

   - 良い点も悪い点も率直に

5. **他製品との比較があれば**
   - 参考になる比較情報

## コンポーネント構成

### レイアウト

```typescript
<div className="container mx-auto px-4 py-8 max-w-4xl">
  <h1>コスメ体験を投稿する</h1>
  <div className="grid md:grid-cols-3 gap-8">
    <div className="md:col-span-2">
      <PostForm />
    </div>
    <div>
      {/* ガイドライン */}
    </div>
  </div>
</div>
```

- レスポンシブ2カラムレイアウト
- モバイルでは1カラムに
- 最大幅制限で読みやすさ確保

### 状態管理

- `user`: 認証ユーザー情報
- `checkAuthComplete`: 認証チェック完了フラグ

## UI/UX設計

### ローディング状態

```typescript
if (!checkAuthComplete) {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin">⏳</div>
    </div>
  )
}
```

### ガイドラインデザイン

- 背景色で視覚的に分離
- 番号付きリストで読みやすく
- アイコンで視覚的アクセント

## 依存関係

- `@/components/forms/PostForm`: 投稿フォームコンポーネント
- `@/lib/auth/AuthContext`: 認証状態管理
- Next.js: `useRouter` for navigation

## セキュリティ

- クライアントサイドの認証チェック
- サーバーサイドでも追加の認証検証（API側）
- 未認証アクセスの適切なハンドリング

## アクセシビリティ

- 見出しの階層構造
- ガイドラインの明確な構造
- フォーカス管理

## 関連機能

- `PostForm`: 実際の投稿作成フォーム
- `/api/posts/create`: 投稿作成API
- `/auth/login`: リダイレクト先のログインページ

## テストポイント

- 認証状態による適切なリダイレクト
- ローディング状態の表示
- ガイドラインの表示確認
- PostFormコンポーネントの統合
