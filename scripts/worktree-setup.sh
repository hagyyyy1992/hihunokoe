#!/bin/bash

# Worktree 作成時の初期セットアップスクリプト

# 色付き出力用
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

echo -e "${YELLOW}新しい worktree を作成します...${NC}"

# Worktree 作成
git worktree add "$WORKTREE_PATH" "$BRANCH_NAME"

# Worktree に移動
cd "$WORKTREE_PATH" || exit 1

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