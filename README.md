# Usaka - 化粧品体験共有サービス

<!-- Verification test by Devin - confirming repo access and workflow -->

## プロジェクト概要

Usakaは、化粧品の本当の使い心地を体験談で共有するコミュニティです。成分や評価ではなく、リアルな体験で「自分に合うかも」を見つけることを目的としています。

### 目的（Why）

使えない化粧品が多いことに悩んでいる人向けに、体験ベースのリアルな声を共有できる空間を提供する。広告や専門知識ではなく、肌感覚や実際の使い心地から「自分に合うかも／合わないかも」が判断できるアプリを目指す。

### 想定ユーザー（Who）

- **メインターゲット**: 20代女性（敏感肌／乾燥肌が多い）
- **特徴**:
  - 成分には詳しくない
  - 市販のクチコミアプリの「お気に入り」が多い投稿に信頼性を感じない
  - 自分の肌質で使えるかどうかを判断したい
  - SNSや@cosmeは見るが、広告っぽい投稿に不信感を持つ

### 提供価値（What）

- ネガティブな体験も「批判でなく共感」で投稿できる
- 成分や点数評価ではなく「実感・状況・肌状態」で判断できる
- 肌質・季節・体調などに合わせた"リアルな使い方の参考"になる

## 技術スタック

- **フロントエンド**: Next.js 15 (App Router) + TypeScript
- **スタイリング**: Tailwind CSS v4
- **データベース**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **認証**: JWT + bcrypt + メール認証
- **メール送信**: Resend (本番) / MailHog (開発)
- **ホスティング**: Vercel
- **バリデーション**: Zod
- **日付処理**: date-fns

## 現在の実装状況 (MVP フェーズ1)

### ✅ 完了済み機能

- [x] プロジェクトセットアップ（Next.js + TypeScript + Tailwind CSS）
- [x] データベーススキーマ設計（Prisma）
- [x] Supabase開発環境セットアップ
- [x] 基本レイアウト・ナビゲーション（レスポンシブ対応）
- [x] 認証システム（ユーザー登録・ログイン・ログアウト）
- [x] メール認証システム（Resend + MailHog）
- [x] 投稿作成機能（4ステップフォーム）
- [x] 投稿一覧・詳細表示機能
- [x] フィルタ・検索機能

### 🚧 作業中・次のステップ


## 開発環境セットアップ

### 前提条件

- Node.js 18以上
- Docker Desktop (Supabase、MailHog用)

### セットアップ手順

```bash
# 1. 依存関係のインストール
npm install

# 2. Supabase CLI インストール (未インストールの場合)
brew install supabase/tap/supabase

# 3. Supabase ローカル環境を起動
supabase start

# 4. データベースマイグレーション
npx prisma migrate dev

# 5. MailHog起動 (メールテスト用)
npm run mailhog:start

# 6. 開発サーバー起動
npm run dev
```

### 環境変数設定

`.env`ファイルは既に設定済みです。本番環境用に以下を設定してください：

```bash
# 本番環境のみ設定
RESEND_API_KEY="your_resend_api_key"
FROM_EMAIL="noreply@yourdomain.com"  # オプション（デフォルト値あり）
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"  # オプション（メール認証リンク用）
```

### Vercel環境変数設定

Vercelでメール送信機能を有効にするには、以下の環境変数を設定してください：

**必須:**

- `RESEND_API_KEY`: ResendのAPIキー

**オプション:**

- `FROM_EMAIL`: 送信元メールアドレス（デフォルト: noreply@yourdomain.com）
- `NEXT_PUBLIC_BASE_URL`: 本番ドメイン（メール認証リンク用、デフォルト: http://localhost:3000）

### 開発環境URL

- **アプリケーション**: http://localhost:3000
- **Supabase Studio**: http://localhost:54323
- **MailHog (メールテスト)**: http://localhost:8025

## 開発コマンド

### 基本コマンド

- `npm run dev` - 開発サーバー起動（Turbopack有効）
- `npm run dev:full` - Supabase + MailHog + 開発サーバーを一括起動
- `npm run build` - プロダクションビルド
- `npm start` - プロダクションサーバー起動
- `npm run lint` - ESLint実行

### データベース関連

- `npx prisma migrate dev` - マイグレーション実行
- `npx prisma studio` - Prisma Studio起動
- `npx prisma generate` - Prismaクライアント生成

### Supabase関連

- `supabase start` - ローカルSupabase起動
- `supabase stop` - ローカルSupabase停止
- `supabase status` - ローカルSupabase状態確認

### メール関連

- `npm run mailhog:start` - MailHog起動
- `npm run mailhog:stop` - MailHog停止

## 文書構成

このプロジェクトの詳細な技術文書は以下のディレクトリに整理されています：

- [`business/`](./business/) - ビジネス・企画関連
- [`design/`](./design/) - デザイン関連
- [`backend/`](./backend/) - バックエンド関連
- [`frontend/`](./frontend/) - フロントエンド関連
- [`infrastructure/`](./infrastructure/) - インフラ・DevOps関連
- [`operations/`](./operations/) - 運用関連

各ロールの担当者は対応するディレクトリを参照してください。

## コントリビューション

このプロジェクトへの貢献を歓迎します。開発に参加する際は：

1. 該当するロールの文書ディレクトリを確認
2. 実装前に関連する仕様書を確認
3. コードスタイルとガイドラインに従って開発
4. 適切なテストを追加

## ライセンス

このプロジェクトは社内開発プロジェクトです。
