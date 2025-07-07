#!/bin/bash

# Worktreeのポート情報を管理・表示するスクリプト

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKTREE_CONFIG_DIR="$HOME/.config/hihunokoe-worktree"

# カラー定義
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# コマンドライン引数の処理
COMMAND="${1:-list}"

show_usage() {
    echo "使用方法: ./scripts/worktree-ports.sh [コマンド]"
    echo ""
    echo "コマンド:"
    echo "  list    - すべてのworktreeのポート情報を表示（デフォルト）"
    echo "  check   - 現在のworktreeのポート情報を表示"
    echo "  scan    - 使用中のポートをスキャンして表示"
    echo "  help    - このヘルプを表示"
    echo ""
    echo "例:"
    echo "  ./scripts/worktree-ports.sh"
    echo "  ./scripts/worktree-ports.sh check"
    echo "  ./scripts/worktree-ports.sh scan"
}

# 現在のworktree名を取得
get_current_worktree() {
    local current_path=$(pwd)
    if [[ $current_path == *"/worktrees/"* ]]; then
        echo $(basename "$current_path")
    else
        echo "main"
    fi
}

# ポート情報を表示
show_port_info() {
    local worktree_name=$1
    local env_file=$2
    local status_icon="⚫"
    local status_color=$RED
    
    # .envファイルからポート情報を読み取る
    if [ -f "$env_file" ]; then
        local next_port=$(grep "^PORT=" "$env_file" 2>/dev/null | cut -d'=' -f2 || echo "3000")
        local db_port=$(grep "^DB_PORT=" "$env_file" 2>/dev/null | cut -d'=' -f2 || echo "5432")
        local mailhog_port=$(grep "^MAILHOG_PORT=" "$env_file" 2>/dev/null | cut -d'=' -f2 || echo "8025")
        local adminer_port=$(grep "^ADMINER_PORT=" "$env_file" 2>/dev/null | cut -d'=' -f2 || echo "8080")
        
        # ポートが使用中かチェック
        if lsof -Pi :$next_port -sTCP:LISTEN -t >/dev/null 2>&1; then
            status_icon="🟢"
            status_color=$GREEN
        fi
        
        echo -e "${status_color}${status_icon}${NC} ${BLUE}${worktree_name}${NC}"
        echo "   Next.js:    http://localhost:${next_port}"
        echo "   PostgreSQL: localhost:${db_port}"
        echo "   MailHog:    http://localhost:${mailhog_port}"
        echo "   Adminer:    http://localhost:${adminer_port}"
        echo ""
    fi
}

# すべてのworktreeのポート情報を表示
list_all_ports() {
    echo -e "${YELLOW}=== Worktree ポート一覧 ===${NC}"
    echo ""
    
    # メインブランチの情報
    if [ -f "$PROJECT_ROOT/.env.local" ]; then
        show_port_info "main" "$PROJECT_ROOT/.env.local"
    fi
    
    # worktreesディレクトリ内のすべてのworktree
    if [ -d "$PROJECT_ROOT/../worktrees" ]; then
        for worktree_dir in "$PROJECT_ROOT/../worktrees"/*; do
            if [ -d "$worktree_dir" ]; then
                local worktree_name=$(basename "$worktree_dir")
                local env_file="$worktree_dir/.env.local"
                if [ -f "$env_file" ]; then
                    show_port_info "$worktree_name" "$env_file"
                fi
            fi
        done
    fi
    
    echo -e "${YELLOW}凡例:${NC}"
    echo -e "  🟢 = 起動中"
    echo -e "  ⚫ = 停止中"
}

# 現在のworktreeのポート情報を表示
check_current_ports() {
    local current_worktree=$(get_current_worktree)
    echo -e "${YELLOW}=== 現在のWorktree: ${current_worktree} ===${NC}"
    echo ""
    
    if [ -f ".env.local" ]; then
        show_port_info "$current_worktree" ".env.local"
    else
        echo -e "${RED}エラー: .env.localファイルが見つかりません${NC}"
        exit 1
    fi
}

# 使用中のポートをスキャン
scan_active_ports() {
    echo -e "${YELLOW}=== 使用中のポートスキャン ===${NC}"
    echo ""
    
    # プロジェクト関連のポート範囲をスキャン
    local ports=(3000 3001 3002 3003 5432 5433 5434 5435 8025 8026 8027 8028 8080 8081 8082 8083)
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN >/dev/null 2>&1; then
            local process=$(lsof -Pi :$port -sTCP:LISTEN | grep LISTEN | head -1)
            local service=""
            
            # サービスを特定
            case $port in
                300[0-9]) service="Next.js" ;;
                543[2-9]) service="PostgreSQL" ;;
                802[5-9]) service="MailHog" ;;
                808[0-9]) service="Adminer" ;;
            esac
            
            echo -e "${GREEN}● Port $port${NC} - $service"
            echo "  $process"
            echo ""
        fi
    done
}

# ポート情報を.zshrcに追加する関数を作成
create_zshrc_function() {
    local zshrc="$HOME/.zshrc"
    local function_marker="# Worktree ports function"
    
    # すでに追加されているかチェック
    if grep -q "$function_marker" "$zshrc" 2>/dev/null; then
        echo -e "${GREEN}✓ ポート確認関数は既に.zshrcに追加されています${NC}"
        echo "  使用方法: wt-ports"
        return
    fi
    
    cat >> "$zshrc" << 'EOF'

# Worktree ports function
wt-ports() {
    local script_path="$HOME/work/my-app/usaka/scripts/worktree-ports.sh"
    if [ -f "$script_path" ]; then
        bash "$script_path" "$@"
    else
        echo "エラー: worktree-ports.shが見つかりません"
    fi
}
EOF
    
    echo -e "${GREEN}✓ ポート確認関数を.zshrcに追加しました${NC}"
    echo "  使用方法: source ~/.zshrc && wt-ports"
}

# メイン処理
case "$COMMAND" in
    list)
        list_all_ports
        ;;
    check)
        check_current_ports
        ;;
    scan)
        scan_active_ports
        ;;
    setup)
        create_zshrc_function
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        echo -e "${RED}エラー: 不明なコマンド '$COMMAND'${NC}"
        echo ""
        show_usage
        exit 1
        ;;
esac