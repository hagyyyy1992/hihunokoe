#!/bin/bash

# Worktree状態をダッシュボード形式で表示するスクリプト

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# カラー定義
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# 画面をクリア
clear

# ヘッダー表示
echo -e "${BOLD}${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║               🚀 Hihunokoe Worktree Dashboard 🚀               ║${NC}"
echo -e "${BOLD}${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 現在時刻
echo -e "${YELLOW}📅 $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""

# Worktree情報を収集
worktree_paths=""

# メインブランチ情報
if [ -f "$PROJECT_ROOT/.env.local" ]; then
    worktree_paths="main:$PROJECT_ROOT"
fi

# worktreesディレクトリ内のworktree
if [ -d "$PROJECT_ROOT/../worktrees" ]; then
    for worktree_dir in "$PROJECT_ROOT/../worktrees"/*; do
        if [ -d "$worktree_dir" ]; then
            name=$(basename "$worktree_dir")
            if [ -z "$worktree_paths" ]; then
                worktree_paths="$name:$worktree_dir"
            else
                worktree_paths="$worktree_paths|$name:$worktree_dir"
            fi
        fi
    done
fi

# テーブルヘッダー
printf "${BOLD}%-15s %-8s %-12s %-12s %-12s %-12s %-20s${NC}\n" \
    "Worktree" "Status" "Next.js" "PostgreSQL" "MailHog" "Adminer" "Branch"
echo "────────────────────────────────────────────────────────────────────────────────────────"

# 各worktreeの情報を表示
IFS='|' read -ra WORKTREES <<< "$worktree_paths"
for worktree_entry in "${WORKTREES[@]}"; do
    if [ -n "$worktree_entry" ]; then
        IFS=':' read -r worktree_name worktree_path <<< "$worktree_entry"
        env_file="$worktree_path/.env.local"
        
        if [ -f "$env_file" ]; then
            # ポート情報を読み取る
            next_port=$(grep "^PORT=" "$env_file" 2>/dev/null | cut -d'=' -f2 || echo "3000")
            db_port=$(grep "^DB_PORT=" "$env_file" 2>/dev/null | cut -d'=' -f2 || echo "5432")
            mailhog_port=$(grep "^MAILHOG_PORT=" "$env_file" 2>/dev/null | cut -d'=' -f2 || echo "8025")
            adminer_port=$(grep "^ADMINER_PORT=" "$env_file" 2>/dev/null | cut -d'=' -f2 || echo "8080")
            
            # サービスの起動状態をチェック
            status="🔴"
            status_text="停止"
            if lsof -Pi :$next_port -sTCP:LISTEN -t >/dev/null 2>&1; then
                status="🟢"
                status_text="起動中"
            fi
            
            # ブランチ名を取得
            branch_name=""
            if cd "$worktree_path" 2>/dev/null && git rev-parse --git-dir >/dev/null 2>&1; then
                branch_name=$(git branch --show-current 2>/dev/null || echo "不明")
                cd - >/dev/null 2>&1
            fi
            
            # 情報を表示
            printf "%-15s %-8s %-12s %-12s %-12s %-12s %-20s\n" \
                "$status $worktree_name" \
                "$status_text" \
                ":$next_port" \
                ":$db_port" \
                ":$mailhog_port" \
                ":$adminer_port" \
                "$branch_name"
        fi
    fi
done | sort

echo ""
echo "────────────────────────────────────────────────────────────────────────────────────────"

# 使用可能なコマンド
echo ""
echo -e "${BOLD}${MAGENTA}📝 使用可能なコマンド:${NC}"
echo -e "  ${CYAN}./scripts/worktree-dev.sh up <worktree-name>${NC}    - worktreeを起動"
echo -e "  ${CYAN}./scripts/worktree-dev.sh down <worktree-name>${NC}  - worktreeを停止"
echo -e "  ${CYAN}./scripts/worktree-ports.sh check${NC}               - 現在のworktreeのポート確認"
echo -e "  ${CYAN}./scripts/worktree-ports.sh scan${NC}                - アクティブなポートをスキャン"

# メモリ使用状況（オプション）
echo ""
echo -e "${BOLD}${YELLOW}💾 Docker コンテナ状況:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(hihunokoe|postgres|mailhog|adminer)" | head -10 || echo "  Dockerコンテナは起動していません"

echo ""