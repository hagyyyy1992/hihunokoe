# .claude ディレクトリ構成

このディレクトリはClaude Codeとの効率的な対話のための設定とドキュメントを管理します。

## 📁 ディレクトリ構成

```
.claude/
├── CLAUDE.md               # 会話固有の追加指示（TDD原則など）
├── README.md               # このファイル - ディレクトリ構成の説明
├── settings.local.json     # ローカル設定（gitignoreに追加済み）
├── docs/                   # プロジェクト文書
│   ├── README-database.md  # データベース設計の概要
│   ├── DEPLOYMENT.md       # デプロイメント手順
│   ├── development-workflow.md  # 開発ワークフロー
│   ├── project-conventions.md   # プロジェクト規約
│   ├── testing-strategy.md      # テスト戦略
│   ├── backend/            # バックエンド関連文書
│   │   ├── clean-architecture.md  # クリーンアーキテクチャ
│   │   ├── database-design.md     # データベース詳細設計
│   │   └── email-system.md        # メールシステム設計
│   ├── business/           # ビジネス要件
│   │   ├── project-overview.md    # プロジェクト概要
│   │   ├── business-requirements.md # ビジネス要件
│   │   └── kpi-metrics.md         # KPI・指標
│   ├── design/            # デザインシステム
│   │   └── design-system.md       # デザインシステム仕様
│   ├── frontend/          # フロントエンド仕様
│   │   ├── component-specifications.md # コンポーネント仕様
│   │   └── project-structure.md    # プロジェクト構造
│   ├── infrastructure/    # インフラ構成
│   │   └── architecture.md        # システムアーキテクチャ
│   └── operations/        # 運用手順
│       ├── maintenance.md         # 保守・運用手順
│       └── user-account-recovery.md # アカウント復旧手順
└── prompts/               # 頻繁に使用するプロンプトテンプレート
    ├── bug-fix.md         # バグ修正時のテンプレート
    ├── code-review.md     # コードレビュー依頼
    ├── database-migration.md # DB移行
    └── feature-implementation.md # 機能実装
```

## 📝 主要ファイル説明

### CLAUDE.md

- **役割**: 会話固有の追加指示
- **内容**:
  - TDD（テスト駆動開発）の7ステップ
  - 日本語での会話ルール
  - プロジェクトのメインCLAUDE.mdへの参照
  - 重要な開発原則のサマリー

### docs/

- **開発ガイド**: development-workflow.md, project-conventions.md
- **技術文書**: backend/, frontend/, infrastructure/
- **ビジネス文書**: business/
- **運用手順**: operations/

### prompts/

- **目的**: 一貫性のある指示を効率的に出すため
- **内容**: よく使うタスクのテンプレート
- **利点**: チーム全体で品質を統一

## 🚀 使い方

### 1. 新しいタスクを始める時

```bash
# 機能実装の場合
cat .claude/prompts/feature-implementation.md

# バグ修正の場合
cat .claude/prompts/bug-fix.md
```

### 2. 技術的な詳細が必要な時

```bash
# データベース設計を確認
cat .claude/docs/backend/database-design.md

# コンポーネント仕様を確認
cat .claude/docs/frontend/component-specifications.md
```

### 3. 運用作業を行う時

```bash
# 保守手順を確認
cat .claude/docs/operations/maintenance.md

# アカウント復旧手順
cat .claude/docs/operations/user-account-recovery.md
```

## 🔧 設定のカスタマイズ

### settings.local.json

```json
{
  "permissions": {
    "allowed_commands": ["npm", "git", "docker"],
    "forbidden_commands": ["rm -rf", "sudo"]
  },
  "project_context": {
    "name": "Usaka",
    "type": "cosmetics-sharing-platform"
  },
  "claude_preferences": {
    "language": "ja",
    "code_style": "consistent",
    "test_first": true
  }
}
```

## 📋 ベストプラクティス

### 安全な操作

- ✅ 危険なコマンドは禁止設定済み
- ✅ プッシュ前に必ず品質チェック実行
- ✅ データベース操作は慎重に

### 効率的な対話

- ✅ 具体的で明確な指示
- ✅ 関連するプロンプトを活用
- ✅ 段階的なアプローチ

### 品質維持

- ✅ TDD（テスト駆動開発）を徹底
- ✅ 自動フォーマット・Lint実行
- ✅ セキュリティファーストの思考

## 🔍 トラブルシューティング

### よくある問題

1. **権限エラー**

   - `settings.local.json`の`permissions`を確認
   - 禁止コマンドを使用していないか確認

2. **プロンプトが見つからない**

   - `.claude/prompts/`ディレクトリを確認
   - ファイル名のタイポをチェック

3. **設定が反映されない**
   - `settings.local.json`の構文を確認
   - Claude Codeを再起動

### サポート

- **プロジェクト全体**: ルートの`CLAUDE.md`を参照
- **会話固有**: `.claude/CLAUDE.md`を確認
- **技術文書**: `.claude/docs/`内を検索

## 📌 メンテナンス

### 文書の更新

- 新機能追加時は関連文書も更新
- 廃止された機能の文書は削除
- 定期的なレビューを実施

### プロンプトの改善

- 使用頻度の高いパターンを追加
- 効果的でないプロンプトは改善
- チームのフィードバックを反映
