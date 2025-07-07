# Playwright と Worktree の並行実行

## 問題と解決策

複数のworktreeでPlaywrightテストを同時実行する際のバッティングを防ぐ設定です。

## バッティングが発生する要因

1. **同じポート（3000）へのアクセス**
2. **同じデータベース**への書き込み
3. **同じテストユーザー**の競合
4. **スクリーンショット/ビデオ**の保存先

## 現在の構成での解決

### 1. ポートの分離

各worktreeで異なるポートを使用：

```bash
# Worktree 1
npm run dev -- -p 3000
PORT=3000 npm run test:e2e

# Worktree 2
npm run dev -- -p 3001
PORT=3001 npm run test:e2e
```

### 2. データベースの分離

各worktreeで独立したデータベース：

- Main: `hihunokoe_dev`
- Feature: `hihunokoe_feature_auth`

### 3. テストデータの分離

`e2e/global-setup.ts`でデータベースごとに独立したテストユーザーが作成されます。

## 並行実行の例

**ターミナル1 (main branch):**

```bash
# 1. Docker環境起動
./scripts/worktree-dev.sh up

# 2. Next.js起動
npm run dev
# → http://localhost:3000

# 3. Playwrightテスト実行
npm run test:e2e
```

**ターミナル2 (feature branch):**

```bash
# 1. worktreeに移動
cd ../usaka-feature-auth

# 2. Docker環境起動
./scripts/worktree-dev.sh up
# → 自動的に異なるポートが割り当てられる

# 3. Next.js起動
npm run dev -- -p 3001
# → http://localhost:3001

# 4. Playwrightテスト実行
PORT=3001 npm run test:e2e
```

## テスト結果の分離

テスト結果も別々に保存されます：

- `playwright-report/` - HTMLレポート
- `test-results/` - スクリーンショット・ビデオ

## 注意事項

1. **PORT環境変数を必ず指定**: Playwrightが正しいポートにアクセスするため
2. **同時実行数**: マシンのリソースに応じて調整
3. **CI環境**: 並列実行は `workers: 1` に設定済み

## トラブルシューティング

### ポート競合エラー

```bash
# ポートを確認
lsof -i :3000

# 別のポートを使用
PORT=3002 npm run test:e2e
```

### データベース接続エラー

```bash
# 環境の状態確認
./scripts/worktree-dev.sh status

# 環境の再起動
./scripts/worktree-dev.sh down
./scripts/worktree-dev.sh up
```
