# /quality-check - 品質チェック実行

## 概要

開発時の品質チェックコマンドを一括実行するスラッシュコマンドです。

## 実行内容

以下のコマンドを順次実行します：

1. **フォーマット**: `npm run format`
2. **Prismaフォーマット**: `npx prisma format`
3. **ESLint**: `npm run lint`
4. **TypeScript型チェック**: `npx tsc --noEmit`
5. **テストカバレッジ**: `npm run test:coverage`

## 使用方法

```
/quality-check
```

## 詳細

### 各コマンドの役割

- **npm run format**: Prettierによるコードフォーマット
- **npx prisma format**: Prismaスキーマファイルのフォーマット
- **npm run lint**: ESLintによる静的解析
- **npx tsc --noEmit**: TypeScript型チェック（ビルドなし）
- **npm run test:coverage**: テスト実行とカバレッジ計測

### 推奨タイミング

- 機能追加・修正後
- コードレビュー前
- コミット前
- プルリクエスト作成前

### エラー処理

いずれかのコマンドが失敗した場合、そこで処理を停止し、エラー内容を表示します。全てのコマンドが成功した場合のみ、品質チェック完了とみなします。

### メリット

- **コードスタイルの統一**: 一貫したフォーマットルールの適用
- **潜在的なバグの早期発見**: ESLintと型チェックによる問題検出
- **テストカバレッジの維持**: 継続的なテスト品質管理
- **型安全性の確保**: TypeScriptによる厳密な型チェック
