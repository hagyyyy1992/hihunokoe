# 負荷テスト用Seedスクリプト

Hihunokoeアプリケーションの負荷テスト用に大量のテストデータを生成するスクリプトです。

## セットアップ

必要な依存関係をインストール:

```bash
npm install
```

## 使用可能なスクリプト

### 1. 基本的な負荷テストデータ生成

```bash
npm run db:seed:load-test
```

デフォルト設定:

- ユーザー数: 1,000人
- 各ユーザーの投稿数: 5件
- 各投稿のコメント数: 3件
- 各投稿の共感数: 10件
- 合計: 5,000投稿、15,000コメント、50,000共感

### 2. 高度な負荷テストデータ生成

```bash
npm run db:seed:load-test:advanced
```

#### オプション

```bash
# カスタム設定例
node scripts/seed-load-test-advanced.js --users 5000 --posts 10 --comments 5 --empathies 20

# 全てのオプション
--users <number>      # 生成するユーザー数 (デフォルト: 1000)
--posts <number>      # 各ユーザーの投稿数 (デフォルト: 5)
--comments <number>   # 各投稿のコメント数 (デフォルト: 3)
--empathies <number>  # 各投稿の共感数 (デフォルト: 10)
--batch <number>      # バッチ処理サイズ (デフォルト: 100)
--clean              # 実行前に既存のテストデータを削除
--parallel           # 並列処理を有効化（メモリ使用量増加）
--no-comments        # コメント生成をスキップ
--no-empathies       # 共感生成をスキップ
```

#### 実行例

```bash
# 小規模テスト（100ユーザー、各3投稿）
node scripts/seed-load-test-advanced.js --users 100 --posts 3 --clean

# 中規模テスト（1,000ユーザー、各10投稿、並列処理）
node scripts/seed-load-test-advanced.js --users 1000 --posts 10 --parallel --clean

# 大規模テスト（10,000ユーザー、各5投稿、コメント・共感なし）
node scripts/seed-load-test-advanced.js --users 10000 --posts 5 --no-comments --no-empathies --clean

# 超大規模テスト（50,000ユーザー、バッチサイズ最適化）
node scripts/seed-load-test-advanced.js --users 50000 --posts 3 --batch 500 --clean
```

## 特徴

### 基本スクリプト (seed-load-test.js)

- シンプルな実装
- 固定設定での大量データ生成
- 進捗表示（100件ごと）
- バッチ処理による効率化

### 高度スクリプト (seed-load-test-advanced.js)

- コマンドラインオプション対応
- プログレスバーによる詳細な進捗表示
- 並列処理オプション
- より現実的なデータ生成
  - 日本の化粧品ブランド名
  - リアルな投稿タイトルとコンテンツ
  - 詳細な使用体験データ
- メモリ効率の最適化
- エラーハンドリングとクリーンアップ

## パフォーマンス目安

環境: MacBook Pro M1, 16GB RAM, Docker PostgreSQL

| ユーザー数 | 投稿数  | 実行時間（目安） |
| ---------- | ------- | ---------------- |
| 100        | 500     | 約10秒           |
| 1,000      | 5,000   | 約1分            |
| 10,000     | 50,000  | 約10分           |
| 50,000     | 150,000 | 約30分           |

\*注: 実行時間はデータベースの状態、マシンスペック、ネットワーク状況により変動します

## テストデータの識別

生成されるテストデータは以下の規則で識別可能です:

- ユーザー名: `loadtest_user_[番号]`
- メールアドレス: `loadtest[番号]@loadtest.example.com`
- パスワード: 全ユーザー共通で `loadtest123`

## クリーンアップ

テストデータを削除するには:

```bash
# 高度スクリプトで生成したデータのみ削除
node scripts/seed-load-test-advanced.js --clean --users 0

# または手動でSQLを実行
DELETE FROM users WHERE email LIKE '%@loadtest.example.com';
```

## 注意事項

1. **本番環境では実行しない**: このスクリプトは開発・テスト環境専用です
2. **ディスク容量**: 大量のデータ生成にはそれなりのディスク容量が必要です
3. **メモリ使用量**: 並列処理オプションを使用するとメモリ使用量が増加します
4. **データベース負荷**: 実行中はデータベースに高負荷がかかります

## トラブルシューティング

### メモリ不足エラー

```bash
# Node.jsのメモリ上限を増やす
NODE_OPTIONS="--max-old-space-size=8192" node scripts/seed-load-test-advanced.js --users 50000
```

### タイムアウトエラー

```bash
# バッチサイズを小さくする
node scripts/seed-load-test-advanced.js --batch 50
```

### 接続エラー

```bash
# データベース接続を確認
npm run db:status

# データベースを再起動
npm run db:stop && npm run db:setup
```
