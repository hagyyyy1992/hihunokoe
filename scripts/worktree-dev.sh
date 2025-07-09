#!/bin/bash

# Worktree 開発環境セットアップスクリプト

# 色付き出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 現在のディレクトリ名を取得（worktree名として使用）
WORKTREE_NAME=$(basename $(pwd))
WORKTREE_SUFFIX="_${WORKTREE_NAME}"

# mainブランチの場合はサフィックスなし
if [ "$WORKTREE_NAME" = "usaka" ] || [ "$WORKTREE_NAME" = "hihunokoe" ]; then
    WORKTREE_NAME="dev"
    WORKTREE_SUFFIX=""
else
    # worktree名をクリーンアップ（スラッシュをアンダースコアに変換）
    WORKTREE_NAME=$(echo "$WORKTREE_NAME" | sed 's/\//_/g')
fi

# デフォルトポート設定
DEFAULT_APP_PORT=3000
DEFAULT_DB_PORT=5432
DEFAULT_ADMINER_PORT=8080
DEFAULT_MAILHOG_SMTP_PORT=1025
DEFAULT_MAILHOG_WEB_PORT=8025

# 使用中のポートをチェック
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
}

# 利用可能なポートを見つける
find_available_port() {
    local port=$1
    while check_port $port; do
        port=$((port + 1))
    done
    echo $port
}

# コマンドライン引数の処理
case "$1" in
    "up")
        # ポート番号を自動割り当て
        echo -e "${YELLOW}Worktree: ${WORKTREE_NAME}${NC}"
        echo "ポートの自動割り当てを開始します..."

        # サフィックスがない場合（main環境）はデフォルトポートを使用
        if [ -z "$WORKTREE_SUFFIX" ]; then
            APP_PORT=$DEFAULT_APP_PORT
            DB_PORT=$DEFAULT_DB_PORT
            ADMINER_PORT=$DEFAULT_ADMINER_PORT
            MAILHOG_SMTP_PORT=$DEFAULT_MAILHOG_SMTP_PORT
            MAILHOG_WEB_PORT=$DEFAULT_MAILHOG_WEB_PORT
        else
            # worktree環境の場合は利用可能なポートを探す
            APP_PORT=$(find_available_port $DEFAULT_APP_PORT)
            DB_PORT=$(find_available_port $DEFAULT_DB_PORT)
            ADMINER_PORT=$(find_available_port $DEFAULT_ADMINER_PORT)
            MAILHOG_SMTP_PORT=$(find_available_port $DEFAULT_MAILHOG_SMTP_PORT)
            MAILHOG_WEB_PORT=$(find_available_port $DEFAULT_MAILHOG_WEB_PORT)
        fi

        # データベース名を決定
        if [ "$WORKTREE_NAME" = "dev" ]; then
            DB_NAME="hihunokoe_dev"
        else
            DB_NAME="hihunokoe_${WORKTREE_NAME}"
        fi

        # .env ファイルを作成/更新
        cat > .env << EOF
# Worktree: ${WORKTREE_NAME}
# 自動生成された環境変数

# Docker環境用
WORKTREE_NAME=${WORKTREE_NAME}
WORKTREE_SUFFIX=${WORKTREE_SUFFIX}
DB_PORT=${DB_PORT}
ADMINER_PORT=${ADMINER_PORT}
MAILHOG_SMTP_PORT=${MAILHOG_SMTP_PORT}
MAILHOG_WEB_PORT=${MAILHOG_WEB_PORT}

# アプリケーション設定
DATABASE_URL=postgresql://postgres:password@localhost:${DB_PORT}/${DB_NAME}
DIRECT_URL=postgresql://postgres:password@localhost:${DB_PORT}/${DB_NAME}
NEXT_PUBLIC_API_URL=http://localhost:${APP_PORT}
MAILHOG_HOST=localhost
MAILHOG_PORT=${MAILHOG_SMTP_PORT}
MAILHOG_WEB_URL=http://localhost:${MAILHOG_WEB_PORT}

# その他の設定
JWT_SECRET=your-jwt-secret-for-development
USE_MOCK_DATA=false
EOF

        echo -e "${GREEN}環境変数ファイル (.env) を作成しました${NC}"
        echo ""
        echo "割り当てられたポート:"
        echo -e "  Next.js App:     ${GREEN}http://localhost:${APP_PORT}${NC}"
        echo -e "  PostgreSQL:      ${GREEN}localhost:${DB_PORT}${NC}"
        echo -e "  Adminer:         ${GREEN}http://localhost:${ADMINER_PORT}${NC}"
        echo -e "  MailHog Web UI:  ${GREEN}http://localhost:${MAILHOG_WEB_PORT}${NC}"
        echo -e "  MailHog SMTP:    ${GREEN}localhost:${MAILHOG_SMTP_PORT}${NC}"
        echo ""

        # Docker Compose 起動
        echo "Docker Compose を起動します..."
        docker-compose up -d
        
        # データベースの準備を待つ
        echo "データベースの準備を待っています..."
        sleep 5
        
        # データベースのマイグレーション実行
        echo "データベースマイグレーションを実行します..."
        npm run db:migrate
        
        # シードデータ投入（オプション）
        if [ "$2" == "--seed" ]; then
            echo "シードデータを投入します..."
            npm run db:seed
        fi
        
        echo -e "${GREEN}開発環境が起動しました！${NC}"
        echo ""
        echo "Next.js開発サーバーを起動するには:"
        echo -e "  ${YELLOW}npm run dev -- -p ${APP_PORT}${NC}"
        echo ""
        echo "Playwrightテストを実行するには:"
        echo -e "  ${YELLOW}PORT=${APP_PORT} npm run test:e2e${NC}"
        ;;
        
    "down")
        echo "Docker Compose を停止します..."
        docker-compose down
        echo -e "${GREEN}開発環境を停止しました${NC}"
        ;;
        
    "clean")
        echo "Docker Compose を停止し、ボリュームを削除します..."
        docker-compose down -v
        echo -e "${GREEN}開発環境をクリーンアップしました${NC}"
        ;;
        
    "logs")
        docker-compose logs -f
        ;;
        
    "status")
        docker-compose ps
        ;;
        
    *)
        echo "使用方法: $0 {up|down|clean|logs|status} [--seed]"
        echo ""
        echo "コマンド:"
        echo "  up      - Docker環境を起動（DBとメールサーバー）"
        echo "  down    - Docker環境を停止"
        echo "  clean   - Docker環境を停止し、データを削除"
        echo "  logs    - ログを表示"
        echo "  status  - コンテナの状態を表示"
        echo ""
        echo "オプション:"
        echo "  --seed  - シードデータを投入（upコマンドと併用）"
        echo ""
        echo "注意: Next.js開発サーバーは別途起動する必要があります"
        exit 1
        ;;
esac