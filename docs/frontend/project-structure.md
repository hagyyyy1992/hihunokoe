# フロントエンド プロジェクト構成

## 技術スタック

### コアテクノロジー

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript 5
- **スタイリング**: Tailwind CSS v4
- **UI コンポーネント**: カスタムコンポーネント
- **状態管理**: React Context API
- **フォームバリデーション**: Zod
- **日付処理**: date-fns
- **HTTP クライアント**: Fetch API

### 開発・ビルドツール

- **バンドラー**: Turbopack (Next.js組み込み)
- **リンター**: ESLint
- **フォーマッター**: Next.js デフォルト設定
- **型チェック**: TypeScript
- **パッケージマネージャー**: npm

### デプロイ・ホスティング

- **本番環境**: Vercel
- **プレビュー環境**: Vercel Preview Deployments
- **ドメイン**: TBD
- **CDN**: Vercel Edge Network

## ディレクトリ構造

```
/
├── api/                            # クリーンアーキテクチャAPI層
│   └── src/
│       ├── domain/                 # ドメイン層
│       │   ├── entities/           # エンティティ
│       │   ├── value-objects/      # 値オブジェクト
│       │   ├── repositories/       # リポジトリインターフェース
│       │   ├── services/           # サービスインターフェース
│       │   └── exceptions/         # ドメイン例外
│       ├── usecases/               # ユースケース層
│       │   ├── auth/               # 認証関連ユースケース
│       │   └── user/               # ユーザー関連ユースケース
│       │       ├── interactor.ts   # ユースケース実装
│       │       ├── input-port.ts   # 入力ポート
│       │       └── output-port.ts  # 出力ポート
│       ├── interface-adapters/     # インターフェースアダプター層
│       │   ├── repositories/       # リポジトリ実装
│       │   └── services/           # サービス実装
│       └── framework/              # フレームワーク層
│           └── controllers/        # コントローラー
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── auth/                   # 認証関連ページ
│   │   │   ├── login/
│   │   │   │   └── page.tsx        # ログインページ
│   │   │   └── register/
│   │   │       └── page.tsx        # 会員登録ページ
│   │   ├── posts/                  # 投稿関連ページ
│   │   │   ├── new/
│   │   │   │   └── page.tsx        # 投稿作成ページ
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx        # 投稿詳細ページ
│   │   │   └── page.tsx            # 投稿一覧ページ
│   │   ├── profile/                # プロフィール関連ページ
│   │   ├── search/                 # 検索関連ページ
│   │   ├── api/                    # API Routes
│   │   │   └── auth/               # 認証API
│   │   │       ├── login/
│   │   │       ├── register/
│   │   │       ├── logout/
│   │   │       └── me/
│   │   ├── globals.css             # グローバルスタイル
│   │   ├── layout.tsx              # ルートレイアウト
│   │   └── page.tsx                # ホームページ
│   │
│   ├── components/                 # 再利用可能コンポーネント
│   │   ├── ui/                     # 基本UIコンポーネント
│   │   │   ├── PostCard.tsx        # 投稿カード
│   │   │   ├── Button.tsx          # ボタンコンポーネント
│   │   │   ├── Input.tsx           # 入力コンポーネント
│   │   │   └── Modal.tsx           # モーダルコンポーネント
│   │   ├── forms/                  # フォーム関連コンポーネント
│   │   │   ├── PostForm.tsx        # 投稿作成フォーム
│   │   │   ├── LoginForm.tsx       # ログインフォーム
│   │   │   └── RegisterForm.tsx    # 会員登録フォーム
│   │   └── layout/                 # レイアウト関連コンポーネント
│   │       ├── Header.tsx          # ヘッダー
│   │       ├── Footer.tsx          # フッター
│   │       └── Navigation.tsx      # ナビゲーション
│   │
│   ├── lib/                        # ユーティリティ・設定
│   │   ├── auth/                   # 認証関連
│   │   │   ├── auth.ts            # 認証ロジック
│   │   │   └── AuthContext.tsx    # 認証コンテキスト
│   │   ├── prisma.ts              # Prisma クライアント
│   │   ├── supabase.ts            # Supabase クライアント
│   │   └── utils.ts               # 汎用ユーティリティ
│   │
│   └── types/                      # TypeScript型定義
│       └── index.ts                # 共通型定義
│
├── prisma/                         # データベース関連
│   └── schema.prisma               # Prismaスキーマ
│
├── public/                         # 静的ファイル
│   ├── images/                     # 画像ファイル
│   └── icons/                      # アイコンファイル
│
├── docs/                           # プロジェクト文書
│
├── .env.local                      # 環境変数（ローカル）
├── .env.example                    # 環境変数テンプレート
├── .gitignore                      # Git除外設定
├── eslint.config.mjs               # ESLint設定
├── next.config.ts                  # Next.js設定
├── package.json                    # 依存関係・スクリプト
├── postcss.config.mjs              # PostCSS設定
├── tailwind.config.js              # Tailwind CSS設定
├── tsconfig.json                   # TypeScript設定
└── README.md                       # プロジェクト説明
```

## 主要コンポーネント

### レイアウトコンポーネント

- **Header**: ナビゲーション、ユーザーメニュー、モバイル対応
- **Footer**: サイト情報、リンク集
- **Layout**: 共通レイアウト、認証状態管理

### UIコンポーネント

- **PostCard**: 投稿一覧での投稿表示カード
- **Button**: 統一されたボタンデザイン
- **Input**: フォーム入力コンポーネント
- **Modal**: モーダルダイアログ

### フォームコンポーネント

- **PostForm**: 4ステップの投稿作成フォーム
- **LoginForm**: ログインフォーム
- **RegisterForm**: 会員登録フォーム

### ページコンポーネント

- **Home**: ランディングページ
- **Posts**: 投稿一覧・検索・フィルタ
- **PostDetail**: 投稿詳細・共感・コメント
- **PostCreate**: 投稿作成
- **Auth**: ログイン・会員登録

## 状態管理

### グローバル状態

- **AuthContext**: ユーザー認証状態
  - ユーザー情報
  - ログイン・ログアウト関数
  - 認証状態の確認

### ローカル状態

- **useState**: コンポーネント固有の状態
- **useEffect**: 副作用・データフェッチ
- **カスタムフック**: 再利用可能なロジック

## ルーティング

### パブリックルート

- `/` - ホームページ
- `/posts` - 投稿一覧
- `/posts/[id]` - 投稿詳細
- `/auth/login` - ログイン
- `/auth/register` - 会員登録

### プライベートルート（認証必須）

- `/posts/new` - 投稿作成
- `/profile` - プロフィール
- `/profile/posts` - 自分の投稿一覧

### API ルート

- `/api/auth/*` - 認証関連API
- `/api/posts` - 投稿関連API
- `/api/posts/[id]` - 個別投稿API

## スタイリング戦略

### Tailwind CSS設定

- **カスタムカラー**: ブランドカラーの定義
- **レスポンシブ**: モバイルファースト
- **コンポーネント**: 再利用可能なスタイルクラス

### デザイントークン

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf2f8',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          // ...
        },
      },
    },
  },
}
```

### レスポンシブデザイン

- **ブレークポイント**: sm(640px), md(768px), lg(1024px), xl(1280px)
- **モバイルファースト**: 小さい画面から設計
- **柔軟なレイアウト**: Grid・Flexbox活用

## パフォーマンス最適化

### 画像最適化

- Next.js Image コンポーネント使用
- WebP形式対応
- 遅延読み込み

### コード分割

- ページレベルでの自動分割
- 動的インポート活用
- Tree shaking

### キャッシュ戦略

- Static Generation（SSG）
- Incremental Static Regeneration（ISR）
- クライアントサイドキャッシュ

## 開発ワークフロー

### 開発環境

```bash
# 開発サーバー起動
npm run dev

# 型チェック
npm run type-check

# リント
npm run lint

# ビルド
npm run build
```

### デプロイプロセス

1. **Pull Request作成**
2. **Vercel Preview Deploy自動実行**
3. **レビュー・承認**
4. **main ブランチマージ**
5. **本番デプロイ自動実行**

### 品質チェック

- **TypeScript**: 型安全性
- **ESLint**: コード品質
- **Prettier**: コードフォーマット
- **テスト**: Jest + Testing Library（今後追加）
