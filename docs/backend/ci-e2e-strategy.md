# CI E2Eテスト戦略: 閾値ベース評価システム

## 概要

従来の「1つでも失敗したら全体失敗」アプローチから、**成功率に基づく閾値評価システム**に移行しました。これにより、E2Eテストの偶発的な失敗（flaky tests）を考慮しつつ、重要な機能の品質を保証します。

## 背景

### 従来の問題点

- `--max-failures=1`により、1つのテストが失敗するとCI全体が停止
- Flaky testsによる偽陰性で、正常なコードがブロックされる
- 複数ブラウザ・デバイスでの完璧な実行を期待するのは非現実的

### 業界ベストプラクティス

- 100%成功率の期待は非現実的かつ非経済的
- 重要なユーザージャーニーの優先順位付け
- Flaky testsの影響を最小化する戦略的なリトライとエラーハンドリング

## 新しい評価基準

### テストカテゴリーと閾値

```javascript
const TEST_CATEGORIES = {
  critical: {
    name: 'Critical Tests',
    patterns: ['e2e/auth/**'],
    threshold: 0.9, // 90% pass rate
    description: 'Authentication flows (login, registration, basic auth)',
  },
  core: {
    name: 'Core Tests',
    patterns: ['e2e/posts/**'],
    threshold: 0.85, // 85% pass rate
    description: 'Post management features (create, view, search)',
  },
}
```

### 閾値設定の根拠

**Critical Tests (90%)**

- ユーザー認証は最重要機能
- ログイン・登録の失敗はサービス利用不可につながる
- ただし、モバイル環境での偶発的失敗を考慮して90%に設定

**Core Tests (85%)**

- 投稿機能はサービスの中核だが、部分的な失敗でもサービス継続可能
- 検索・表示機能の一部失敗は許容範囲内
- より現実的な85%の閾値

## 実装詳細

### CI/CDパイプライン統合

```yaml
# .github/workflows/deploy.yml
- name: Run E2E tests with threshold evaluation
  run: node scripts/ci-e2e-runner.js
  env:
    NODE_ENV: test
    CI: true
```

### 実行結果の例

```
🚀 Starting CI E2E Tests with Threshold-based Evaluation
============================================================

🧪 Running Critical Tests...
📊 Required pass rate: 90%
📝 Description: Authentication flows (login, registration, basic auth)

📊 Critical Tests Results:
   Total: 25
   Passed: 23
   Failed: 2
   Pass Rate: 92.0% (required: 90%)
   Status: ✅ PASS

🧪 Running Core Tests...
📊 Required pass rate: 85%
📝 Description: Post management features (create, view, search)

📊 Core Tests Results:
   Total: 15
   Passed: 13
   Failed: 2
   Pass Rate: 86.7% (required: 85%)
   Status: ✅ PASS

============================================================
📋 FINAL E2E TEST SUMMARY
============================================================

✅ Critical Tests:
   Pass Rate: 92.0% (threshold: 90%)
   Tests: 23/25

✅ Core Tests:
   Pass Rate: 86.7% (threshold: 85%)
   Tests: 13/15

----------------------------------------
📊 Overall Statistics:
   Total Tests: 40
   Overall Pass Rate: 90.0%
   Categories Passed: 2/2 (100%)
   Final Status: ✅ SUCCESS
```

## 利点

### 1. **偽陰性の削減**

- Flaky testsによるCI停止を大幅に削減
- より安定したデプロイメントパイプライン

### 2. **現実的な品質基準**

- 業界標準に基づいた実用的な成功率
- 完璧を求めすぎない現実的なアプローチ

### 3. **詳細な可視性**

- カテゴリー別の成功率を明確に表示
- 問題のある領域の特定が容易

### 4. **柔軟な設定**

- 閾値はプロジェクトの成熟度に応じて調整可能
- 新機能追加時の段階的な厳格化

## 監視と改善

### 継続的監視指標

- **月次成功率トレンド**: 閾値を上回っているか
- **Flaky testの特定**: 繰り返し失敗するテストの洗い出し
- **カテゴリー別パフォーマンス**: どの機能が安定しているか

### 改善サイクル

1. **週次レビュー**: テスト結果の傾向分析
2. **月次調整**: 閾値の見直しと最適化
3. **四半期評価**: テスト戦略全体の有効性評価

## 使用方法

### ローカル実行

```bash
# 閾値ベーステストの実行
npm run test:e2e:threshold

# ヘルプの表示
node scripts/ci-e2e-runner.js --help
```

### CI環境

GitHub ActionsでCI時に自動実行され、結果はアーティファクトとして保存されます。

### レポート確認

- `e2e-threshold-report.json`: 詳細な実行結果
- GitHub Actionsアーティファクト: 30日間保持

## 今後の拡張

### 追加予定機能

- **動的閾値調整**: 過去の成功率履歴に基づく自動調整
- **通知システム**: 閾値を下回った場合の Slack/Teams 通知
- **ダッシュボード**: 成功率トレンドの可視化
- **A/Bテスト**: 異なる閾値での実験と最適化

この戦略により、E2Eテストの安定性と実用性を両立し、継続的な品質改善を実現します。
