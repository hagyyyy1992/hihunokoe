# Git Worktree + Docker 開発環境

## 概要

Git worktree を使用した並行開発時のポート競合を解決するため、既存の Docker Compose 設定を拡張して各 worktree に独立した開発環境を提供します。

## 特徴

- **自動ポート割り当て**: 利用可能なポートを自動的に検出・割り当て
- **独立したデータベース**: worktree ごとに専用のデータベース
- **独立したボリューム**: データの分離により環境間の干渉を防止
- **簡単なセットアップ**: ワンコマンドで環境構築

## セットアップ手順

### 1. Worktree の作成

```bash
# 新しい worktree を作成
git worktree add ../usaka-feature-x feature/x

# worktree に移動
cd ../usaka-feature-x
```

### 2. 開発環境の起動

```bash
# 開発環境を起動
./scripts/worktree-dev.sh up

# シードデータも投入する場合
./scripts/worktree-dev.sh up --seed
```

### 3. 開発の開始

自動的に割り当てられたポートが表示されます：

```
割り当てられたポート:
  Next.js App:     http://localhost:3001
  PostgreSQL:      localhost:5433
  Adminer:         http://localhost:8081
  MailHog Web UI:  http://localhost:8026
  MailHog SMTP:    localhost:1026
```

## コマンド一覧

| コマンド                           | 説明                           |
| ---------------------------------- | ------------------------------ |
| `./scripts/worktree-dev.sh up`     | 開発環境を起動                 |
| `./scripts/worktree-dev.sh down`   | 開発環境を停止                 |
| `./scripts/worktree-dev.sh clean`  | 環境を完全削除（データも削除） |
| `./scripts/worktree-dev.sh logs`   | ログを表示                     |
| `./scripts/worktree-dev.sh status` | コンテナの状態を確認           |

## アーキテクチャ

```
main/ (usaka)
├── .env.local            # デフォルトポート使用
├── docker-compose.yml    # 共通の設定ファイル
└── アプリケーションコード

worktree-1/
├── .env.local            # 自動生成される環境変数（異なるポート）
├── docker-compose.yml    # main からの参照
└── アプリケーションコード

worktree-2/
├── .env.local            # 自動生成される環境変数（異なるポート）
├── docker-compose.yml    # main からの参照
└── アプリケーションコード
```

### 環境変数による分離

- `WORKTREE_NAME`: データベース名の区別に使用
- `WORKTREE_SUFFIX`: コンテナ名とボリューム名の区別に使用
- 各種ポート番号: 自動割り当てで競合を回避

## ポート割り当てルール

スクリプトは以下の順序でポートを確認し、利用可能なポートを割り当てます：

1. **Next.js**: 3000 から開始
2. **PostgreSQL**: 5432 から開始
3. **Adminer**: 8080 から開始
4. **MailHog SMTP**: 1025 から開始
5. **MailHog Web**: 8025 から開始

既に使用中の場合は、+1 ずつ増やして利用可能なポートを探します。

## トラブルシューティング

### ポートが既に使用されている

```bash
# 使用中のポートを確認
lsof -i :3000

# 特定のプロセスを終了
kill -9 <PID>
```

### データベース接続エラー

```bash
# コンテナの状態を確認
./scripts/worktree-dev.sh status

# ログを確認
./scripts/worktree-dev.sh logs db
```

### 環境のリセット

```bash
# 完全にクリーンアップ
./scripts/worktree-dev.sh clean

# 再度セットアップ
./scripts/worktree-dev.sh up
```

## 注意事項

1. **`.env.worktree` はコミットしない**: 自動生成されるファイルのため
2. **メモリ使用量**: 複数の環境を同時に起動するとメモリを消費します
3. **データの永続性**: `clean` コマンドはデータを削除します

## 既存の開発コマンドとの関係

worktree 環境でも既存のコマンドがそのまま使用可能：

```bash
# Next.js 開発サーバー（ポート指定）
npm run dev -- -p 3001

# データベース操作
npm run db:migrate
npm run db:seed

# テスト実行
npm test
npm run test:e2e
```

### 統合された開発フロー

1. **Docker環境起動**: `./scripts/worktree-dev.sh up`
2. **Next.js起動**: `npm run dev -- -p <割り当てられたポート>`
3. **開発作業**: 通常通りの開発が可能
4. **環境停止**: `./scripts/worktree-dev.sh down`
