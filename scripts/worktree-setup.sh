#!/bin/bash

# Worktree 作成時の初期セットアップスクリプト

# 色付き出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 引数チェック
if [ $# -lt 2 ]; then
    echo "使用方法: $0 <worktree-path> <branch-name>"
    echo "例: $0 ../usaka-feature-auth feature/auth-improvement"
    exit 1
fi

WORKTREE_PATH=$1
BRANCH_NAME=$2

# 元のリポジトリのパスを保存（worktree作成前に取得）
MAIN_REPO_PATH=$(pwd)
echo -e "${YELLOW}元のリポジトリのパス: $MAIN_REPO_PATH${NC}"

echo -e "${YELLOW}新しい worktree を作成します...${NC}"

# ブランチが存在するかチェック
if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
    echo "既存のブランチ '$BRANCH_NAME' を使用します"
    git worktree add "$WORKTREE_PATH" "$BRANCH_NAME"
else
    echo "新しいブランチ '$BRANCH_NAME' を作成します"
    git worktree add -b "$BRANCH_NAME" "$WORKTREE_PATH"
fi

# Worktree 作成の成功をチェック
if [ $? -ne 0 ]; then
    echo -e "${RED}エラー: worktree の作成に失敗しました${NC}"
    exit 1
fi

# Worktree に移動
cd "$WORKTREE_PATH" || exit 1

# 環境変数ファイルをコピー
echo -e "${YELLOW}環境変数ファイルをコピーします...${NC}"

# .env をコピー
if [ -f "$MAIN_REPO_PATH/.env" ]; then
    cp "$MAIN_REPO_PATH/.env" .env
    echo -e "${GREEN}.env をコピーしました${NC}"
else
    echo -e "${YELLOW}情報: .env が見つかりません${NC}"
fi

# 環境変数ファイルが一つもコピーされなかった場合の警告
if [ ! -f ".env.local" ] && [ ! -f ".env" ] && [ ! -f ".env.production" ] && [ ! -f ".env.development" ]; then
    echo -e "${YELLOW}警告: 環境変数ファイルが見つかりませんでした。手動で作成してください。${NC}"
fi

echo -e "${YELLOW}依存関係をインストールします...${NC}"

# node_modules をインストール（独立したバージョン管理のため）
npm ci

# .next ディレクトリを作成（ビルドキャッシュの分離）
mkdir -p .next

# .gitignore に追加（もし追加されていない場合）
if ! grep -q "^.env.local$" .gitignore 2>/dev/null; then
    echo ".env.local" >> .gitignore
fi


echo -e "${GREEN}Worktree のセットアップが完了しました！${NC}"
echo ""
echo "次のステップ:"
echo "1. cd $WORKTREE_PATH"
echo "2. ./scripts/worktree-dev.sh up"
echo "3. npm run dev -- -p <割り当てられたポート>"