# Claude Code Configuration

このディレクトリには、UsakaプロジェクトでClaude Codeを効率的に活用するための設定とドキュメントが含まれています。

## ディレクトリ構成

```
.claude/
├── README.md                    # このファイル
├── settings.local.json          # ローカル設定（権限、プロジェクト情報）
├── prompts/                     # 再利用可能なプロンプト
│   ├── code-review.md          # コードレビュー用プロンプト
│   ├── feature-implementation.md # 機能実装用プロンプト
│   ├── bug-fix.md              # バグ修正用プロンプト
│   └── database-migration.md    # DB マイグレーション用プロンプト
└── docs/                       # Claude専用ドキュメント
    ├── development-workflow.md  # 開発ワークフロー
    ├── project-conventions.md   # プロジェクト規約
    └── testing-strategy.md      # テスト戦略
```

## 使用方法

### 1. プロンプトの活用

特定のタスクに応じて、適切なプロンプトを参照してください：

- **新機能開発**: `.claude/prompts/feature-implementation.md`
- **バグ修正**: `.claude/prompts/bug-fix.md`
- **コードレビュー**: `.claude/prompts/code-review.md`
- **DB変更**: `.claude/prompts/database-migration.md`

### 2. 設定のカスタマイズ

`settings.local.json`で以下をカスタマイズできます：

- **permissions**: 許可/禁止するコマンド
- **project_context**: プロジェクト情報
- **claude_preferences**: Claude Codeの動作設定

### 3. ワークフローの参照

効率的な開発のため、以下のドキュメントを参照してください：

- **開発フロー**: `.claude/docs/development-workflow.md`
- **コーディング規約**: `.claude/docs/project-conventions.md`
- **テスト戦略**: `.claude/docs/testing-strategy.md`

## ベストプラクティス

### 安全な操作

- 危険なコマンド（`rm -rf`, `sudo`など）は禁止設定済み
- プッシュ前に必ず品質チェックを実行
- データベース操作は慎重に実行

### 効率的な対話

- 具体的で明確な指示を提供
- 関連するプロンプトを参照
- 段階的なアプローチを採用

### 品質維持

- 自動フォーマット・Lint実行
- テスト駆動開発の推奨
- セキュリティファーストの思考

## トラブルシューティング

### よくある問題

1. **権限エラー**: `settings.local.json`の`permissions`を確認
2. **プロンプト不明**: 適切な`.claude/prompts/`ファイルを参照
3. **設定変更**: `settings.local.json`を編集して再起動

### サポート

- プロジェクト固有の問題: CLAUDE.mdを参照
- 一般的な問題: `.claude/docs/`内のドキュメントを確認
- 設定の問題: `settings.local.json`の構文を確認
