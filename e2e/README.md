# E2E テスト

このディレクトリには、Playwrightを使用したエンドツーエンド（E2E）テストが含まれています。

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
npx playwright install
```

### 2. テスト用データベースの準備

```bash
# Docker Composeでローカルデータベースを起動
npm run db:setup

# テスト用データベースの作成（オプション）
createdb usaka_e2e
```

### 3. 環境変数の設定

`.env.e2e`ファイルを確認し、必要に応じて調整してください。

## テストの実行

### 基本的な実行方法

```bash
# すべてのE2Eテストを実行
npm run test:e2e

# ヘッド付きモードで実行（ブラウザが表示される）
npm run test:e2e:headed

# UIモードで実行（インタラクティブ）
npm run test:e2e:ui

# デバッグモードで実行
npm run test:e2e:debug
```

### 特定のテストファイルの実行

```bash
# 認証テストのみ実行
npx playwright test e2e/auth/

# 投稿関連テストのみ実行
npx playwright test e2e/posts/

# 特定のブラウザで実行
npx playwright test --project=chromium
```

### テストレポートの表示

```bash
npm run test:e2e:report
```

## テスト構成

### ディレクトリ構造

```
e2e/
├── auth/                   # 認証関連テスト
│   ├── login.spec.ts
│   └── registration.spec.ts
├── posts/                  # 投稿関連テスト
│   ├── create-post.spec.ts
│   ├── view-post.spec.ts
│   └── search-posts.spec.ts
└── helpers/                # テストヘルパー
    ├── auth-helpers.ts
    ├── post-helpers.ts
    └── test-data.ts
```

### テストファイルの命名規則

- `*.spec.ts` - テストファイル
- `*-helpers.ts` - ヘルパークラス
- `test-data.ts` - テストデータ定義

## テストの書き方

### 基本的なテスト構造

```typescript
import { test, expect } from '@playwright/test'
import { AuthHelper } from '../helpers/auth-helpers'

test.describe('機能名', () => {
  let authHelper: AuthHelper

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)
    // 共通のセットアップ
  })

  test('テストケース名', async ({ page }) => {
    // テストの実装
    await page.goto('/some-page')
    await expect(page.locator('[data-testid="element"]')).toBeVisible()
  })
})
```

### ヘルパークラスの使用

```typescript
// 認証操作
await authHelper.login('user@example.com', 'password')
await authHelper.expectToBeLoggedIn()

// 投稿操作
await postHelper.createPost({
  title: 'テスト投稿',
  content: '投稿内容',
  category: 'SKINCARE',
})
```

## データテストID

E2Eテストでは、`data-testid`属性を使用して要素を特定します。

### 命名規則

- ボタン: `{action}-button` (例: `login-button`, `save-button`)
- 入力フィールド: `{field}-input` (例: `email-input`, `password-input`)
- フォーム: `{name}-form` (例: `login-form`, `register-form`)
- メッセージ: `{type}-message` (例: `error-message`, `success-message`)

### 例

```jsx
<button data-testid="login-button">ログイン</button>
<input data-testid="email-input" type="email" />
<div data-testid="error-message">エラーメッセージ</div>
```

## トラブルシューティング

### よくある問題

1. **テストが失敗する場合**

   - データベースが起動しているか確認
   - テスト用データが正しく作成されているか確認
   - ブラウザが最新版か確認

2. **要素が見つからない場合**

   - `data-testid`属性が正しく設定されているか確認
   - 要素が実際にDOMに存在するか確認
   - 非同期処理の完了を待っているか確認

3. **タイムアウトエラー**
   - `playwright.config.ts`のタイムアウト設定を確認
   - 重い処理の場合は`page.waitForTimeout()`を使用

### デバッグのコツ

```typescript
// 要素の存在確認
await page.locator('[data-testid="element"]').waitFor()

// スクリーンショットを撮る
await page.screenshot({ path: 'debug.png' })

// ページのHTMLを出力
console.log(await page.content())

// 要素の状態を確認
const element = page.locator('[data-testid="element"]')
console.log(await element.isVisible())
console.log(await element.textContent())
```

## CI/CD での実行

GitHub Actionsでの自動実行設定は `.github/workflows/e2e-tests.yml` に定義されています。

### ローカルでのCI環境再現

```bash
# CI環境と同じ条件でテスト実行
CI=true npm run test:e2e
```

## ベストプラクティス

1. **テストの独立性**: 各テストは他のテストに依存しない
2. **データの分離**: テストごとに独自のテストデータを使用
3. **明確なアサーション**: 何をテストしているかが明確
4. **適切な待機**: 非同期処理の完了を適切に待機
5. **リソースの後始末**: テスト後のデータクリーンアップ
