# Worktree ポート管理コマンド

## 🚀 クイックリファレンス

### ポート情報の確認

```bash
# すべてのworktreeのポート一覧を表示
./scripts/worktree-ports.sh

# 現在のworktreeのポート情報を表示
./scripts/worktree-ports.sh check

# アクティブなポートをスキャン
./scripts/worktree-ports.sh scan

# ダッシュボード表示（詳細ビュー）
./scripts/worktree-dashboard.sh
```

### worktreeの管理

```bash
# worktreeを起動
./scripts/worktree-dev.sh up <worktree-name>

# worktreeを停止
./scripts/worktree-dev.sh down <worktree-name>

# 新しいworktreeを作成
./scripts/worktree-dev.sh create <worktree-name> <branch-name>
```

## 📊 ポート割り当てルール

各worktreeは以下のルールでポートが自動割り当てされます：

| サービス | メイン | worktree 1 | worktree 2 | worktree 3 |
|---------|--------|------------|------------|------------|
| Next.js | 3000 | 3001 | 3002 | 3003 |
| PostgreSQL | 5432 | 5433 | 5434 | 5435 |
| MailHog | 8025 | 8026 | 8027 | 8028 |
| Adminer | 8080 | 8081 | 8082 | 8083 |

## 🛠️ セットアップ

### zshrcへの関数追加

便利なエイリアスを追加するには：

```bash
./scripts/worktree-ports.sh setup
source ~/.zshrc

# 以下のコマンドが使用可能になります
wt-ports        # ポート一覧表示
wt-ports check  # 現在のworktreeを確認
wt-ports scan   # アクティブポートスキャン
```

## 📝 使用例

### 1. 新しいfeatureブランチで作業開始

```bash
# worktreeを作成
./scripts/worktree-dev.sh create feature-auth feat/new-auth-system

# ポートを確認
./scripts/worktree-ports.sh check

# 出力例:
# === 現在のWorktree: feature-auth ===
# 
# 🟢 feature-auth
#    Next.js:    http://localhost:3001
#    PostgreSQL: localhost:5433
#    MailHog:    http://localhost:8026
#    Adminer:    http://localhost:8081
```

### 2. 複数のworktreeを同時に管理

```bash
# ダッシュボードで全体を確認
./scripts/worktree-dashboard.sh

# 出力例:
# ╔════════════════════════════════════════════════════════════════╗
# ║               🚀 Hihunokoe Worktree Dashboard 🚀               ║
# ╚════════════════════════════════════════════════════════════════╝
# 
# Worktree        Status   Next.js      PostgreSQL   MailHog      Adminer      Branch
# ────────────────────────────────────────────────────────────────────────────────────────
# 🟢 main         起動中   :3000        :5432        :8025        :8080        main
# 🟢 feature-auth 起動中   :3001        :5433        :8026        :8081        feat/new-auth-system
# 🔴 bugfix       停止     :3002        :5434        :8027        :8082        fix/login-issue
```

### 3. ポートの競合を調査

```bash
# アクティブなポートをスキャン
./scripts/worktree-ports.sh scan

# 出力例:
# === 使用中のポートスキャン ===
# 
# ● Port 3000 - Next.js
#   node      12345 user   23u  IPv6 0x... TCP *:3000 (LISTEN)
# 
# ● Port 5432 - PostgreSQL
#   postgres  12346 user   7u  IPv6 0x... TCP *:5432 (LISTEN)
```

## 🔍 トラブルシューティング

### ポートが既に使用中の場合

```bash
# 使用中のプロセスを確認
lsof -i :3000

# プロセスを停止
kill -9 <PID>

# またはworktreeを再起動
./scripts/worktree-dev.sh down <worktree-name>
./scripts/worktree-dev.sh up <worktree-name>
```

### .env.localが見つからない場合

```bash
# worktreeディレクトリに移動
cd ../worktrees/<worktree-name>

# 環境変数ファイルを再生成
./scripts/worktree-dev.sh setup <worktree-name>
```