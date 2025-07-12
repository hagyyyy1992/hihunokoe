# Create Pull Request Command

高品質なプルリクエストを自動生成するコマンドです。

## 使用方法

```
/create-pr [オプション]
```

## オプション

- `--title "タイトル"` - PRタイトルを指定
- `--draft` - ドラフトPRとして作成
- `--no-ci` - CI実行をスキップ（緊急時のみ）

## 機能

### 1. 自動分析・生成

- ✅ 変更ファイルの分析
- ✅ コミット履歴の解析
- ✅ 適切なprefixの自動判定（feat/fix/refactor等）
- ✅ 技術的詳細の抽出
- ✅ テスト計画の生成

### 2. 品質チェック

- ✅ プッシュ前品質チェック実行
- ✅ CI/CDステータス監視
- ✅ 失敗時の自動修正（最大3回）

### 3. PRテンプレート

- ✅ Summary: 変更概要（日本語）
- ✅ Changes: 技術的詳細
- ✅ Performance: パフォーマンス影響
- ✅ Test plan: テスト計画
- ✅ Breaking changes: 破壊的変更の有無

## 実行例

```bash
# 基本的な使用方法
/create-pr

# タイトル指定
/create-pr --title "feat: ユーザー認証機能を追加"

# ドラフトPRとして作成
/create-pr --draft
```

## 生成されるPRの構造

```markdown
## Summary

- 主要な変更点を3-5個の箇条書きで説明
- ビジネス価値と技術的改善を明記

## Changes

### 🚀 New Features

- 新機能の詳細

### 🐛 Bug Fixes

- 修正されたバグ

### ⚡ Performance

- パフォーマンス改善

### 🔧 Refactoring

- リファクタリング内容

## Breaking Changes

- 破壊的変更がある場合に記載

## Test plan

- [ ] ユニットテスト実行
- [ ] E2Eテスト実行
- [ ] 手動テスト項目

🤖 Generated with [Claude Code](https://claude.ai/code)
```

## 技術仕様

### コマンド処理フロー

1. **変更分析**

   ```bash
   git status
   git diff --name-only origin/main...HEAD
   git log --oneline origin/main..HEAD
   ```

2. **品質チェック**

   ```bash
   npm run quality-check
   ```

3. **PR作成**

   ```bash
   gh pr create --title "..." --body "..."
   ```

4. **CI監視**
   ```bash
   gh pr checks --watch
   ```

### 自動判定ロジック

#### Prefix判定

```typescript
const determinePrefixFromChanges = (files: string[], commits: string[]) => {
  // ファイルパターン分析
  if (files.some(f => f.includes('test') || f.includes('spec'))) return 'test'
  if (files.some(f => f.includes('docs') || f.includes('.md'))) return 'docs'

  // コミットメッセージ分析
  if (commits.some(c => c.includes('fix') || c.includes('bug'))) return 'fix'
  if (commits.some(c => c.includes('feat') || c.includes('add'))) return 'feat'

  return 'chore'
}
```

#### 技術領域判定

```typescript
const determineAreas = (files: string[]) => {
  const areas = []
  if (files.some(f => f.includes('api/') || f.includes('backend'))) areas.push('Backend')
  if (files.some(f => f.includes('components/') || f.includes('pages/'))) areas.push('Frontend')
  if (files.some(f => f.includes('prisma/') || f.includes('schema'))) areas.push('Database')
  return areas
}
```

## カスタマイズ

### プロジェクト固有設定

`.claude/pr-templates/` ディレクトリに以下のテンプレートを配置可能：

- `feature.md` - 機能追加用
- `bugfix.md` - バグ修正用
- `performance.md` - パフォーマンス改善用
- `refactor.md` - リファクタリング用

### 自動ラベル設定

```yaml
# .github/pr-labeler.yml
frontend: ['src/components/**', 'src/pages/**']
backend: ['api/**', 'src/lib/**']
database: ['prisma/**', 'migrations/**']
performance: ['**/performance/**', '**/cache/**']
```

## 注意事項

- 品質チェックが失敗した場合、PR作成を中止
- CI失敗時は最大3回まで自動修正を試行
- 破壊的変更の検出時は特別な警告を表示
- 大規模変更（50ファイル以上）時は確認プロンプト表示
