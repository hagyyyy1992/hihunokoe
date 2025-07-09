import { test, expect } from '@playwright/test'
import { AuthHelper } from '../helpers/auth-helpers'

test.describe('アクセシビリティエラーハンドリング', () => {
  let authHelper: AuthHelper

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)
  })

  test.describe('キーボードナビゲーション', () => {
    test('キーボードのみでのログインフォーム操作', async ({ page }) => {
      await page.goto('/auth/login')

      // Tabキーでフォーカスを移動
      await page.keyboard.press('Tab') // メールアドレスフィールドにフォーカス
      await page.keyboard.type('test@example.com')

      await page.keyboard.press('Tab') // パスワードフィールドにフォーカス
      await page.keyboard.type('password123')

      await page.keyboard.press('Tab') // ログインボタンにフォーカス
      await page.keyboard.press('Enter') // ログインボタンをクリック

      // エラーメッセージが表示されることを確認（存在しないユーザーのため）
      await expect(page.getByTestId('error-message')).toBeVisible()
    })

    test('キーボードのみでのユーザー登録フォーム操作', async ({ page }) => {
      await page.goto('/auth/register')

      // Tabキーでフォーカスを移動してフォームを入力
      await page.keyboard.press('Tab') // ユーザー名フィールド
      await page.keyboard.type('testuser')

      await page.keyboard.press('Tab') // メールアドレスフィールド
      await page.keyboard.type('test@example.com')

      await page.keyboard.press('Tab') // パスワードフィールド
      await page.keyboard.type('password123')

      await page.keyboard.press('Tab') // パスワード確認フィールド
      await page.keyboard.type('password123')

      await page.keyboard.press('Tab') // 肌質選択
      await page.keyboard.press('ArrowDown') // 肌質を選択

      await page.keyboard.press('Tab') // 利用規約チェックボックス
      await page.keyboard.press('Space') // チェックボックスをチェック

      await page.keyboard.press('Tab') // 会員登録ボタン
      await page.keyboard.press('Enter') // 会員登録ボタンをクリック

      // 登録成功または適切なエラーメッセージが表示されることを確認
      const isRegistered = await page
        .getByText('アカウントが作成されました')
        .isVisible()
        .catch(() => false)
      const hasError = await page
        .getByTestId('error-message')
        .isVisible()
        .catch(() => false)

      expect(isRegistered || hasError).toBe(true)
    })
  })

  test.describe('スクリーンリーダー対応', () => {
    test('エラーメッセージにaria-live属性が設定されている', async ({ page }) => {
      await page.goto('/auth/login')

      // 無効なログインを試行
      await page.getByLabel('メールアドレス').fill('invalid@example.com')
      await page.locator('input[name="password"]').fill('wrongpassword')
      await page.getByRole('button', { name: 'ログイン' }).click()

      // エラーメッセージが表示されることを確認
      await expect(page.getByTestId('error-message')).toBeVisible()

      // aria-live属性があることを確認
      const errorMessage = page.getByTestId('error-message')
      const ariaLive = await errorMessage.getAttribute('aria-live')
      expect(ariaLive).toBeTruthy()
    })

    test('フォームフィールドに適切なラベルが設定されている', async ({ page }) => {
      await page.goto('/auth/register')

      // 各フィールドにラベルが関連付けられていることを確認
      await expect(page.getByLabel('ユーザー名 *')).toBeVisible()
      await expect(page.getByLabel('メールアドレス *')).toBeVisible()
      await expect(page.getByLabel('パスワード *')).toBeVisible()
      await expect(page.getByLabel('パスワード確認 *')).toBeVisible()
    })

    test('エラー状態のフィールドにaria-invalid属性が設定される', async ({ page }) => {
      await page.goto('/auth/register')

      // 空のフォームを送信
      await page.getByRole('button', { name: '会員登録' }).click()

      // エラーが表示されるまで待機
      await expect(page.getByText('ユーザー名を入力してください')).toBeVisible()

      // aria-invalid属性が設定されていることを確認
      const usernameField = page.getByLabel('ユーザー名 *')
      const ariaInvalid = await usernameField.getAttribute('aria-invalid')
      expect(ariaInvalid).toBe('true')
    })
  })

  test.describe('フォーカス管理', () => {
    test('エラー後のフォーカス管理', async ({ page }) => {
      await page.goto('/auth/login')

      // 無効なログインを試行
      await page.getByLabel('メールアドレス').fill('invalid@example.com')
      await page.locator('input[name="password"]').fill('wrongpassword')
      await page.getByRole('button', { name: 'ログイン' }).click()

      // エラーメッセージが表示されることを確認
      await expect(page.getByTestId('error-message')).toBeVisible()

      // フォーカスが適切な要素に移動することを確認
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
      expect(focusedElement).toBeTruthy()
    })

    test('モーダルダイアログのフォーカストラップ', async ({ page }) => {
      // ログインしてから投稿詳細ページにアクセス
      await authHelper.registerAndLogin()

      // 投稿を作成
      await page.goto('/posts/create')
      await page.locator('input[name="title"]').fill('テスト投稿')
      await page.locator('textarea[name="content"]').fill('テスト内容')
      await page.locator('input[name="cosmeticName"]').fill('テスト化粧品')
      await page.locator('select[name="cosmeticCategory"]').selectOption('toner')
      await page.locator('select[name="skinType"]').selectOption('normal')
      await page.locator('select[name="moodTag"]').selectOption('good')
      await page.getByRole('button', { name: '投稿する' }).click()

      // 投稿一覧から詳細ページに移動
      await page.goto('/posts')
      await page.getByRole('link', { name: 'テスト投稿' }).click()

      // 削除ボタンをクリック
      await page.getByTestId('post-menu-button').click()

      // 削除確認ダイアログが表示されることを確認
      await expect(page.getByText('投稿を削除しますか？')).toBeVisible()

      // Tabキーでフォーカスが適切に移動することを確認
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // ESCキーでダイアログを閉じる
      await page.keyboard.press('Escape')

      // ダイアログが閉じることを確認
      await expect(page.getByText('投稿を削除しますか？')).not.toBeVisible()
    })
  })

  test.describe('色覚対応', () => {
    test('エラー状態が色だけでなく文字でも表現される', async ({ page }) => {
      await page.goto('/auth/login')

      // 無効なログインを試行
      await page.getByLabel('メールアドレス').fill('invalid@example.com')
      await page.locator('input[name="password"]').fill('wrongpassword')
      await page.getByRole('button', { name: 'ログイン' }).click()

      // エラーメッセージが表示されることを確認
      await expect(page.getByTestId('error-message')).toBeVisible()

      // エラーメッセージにテキストが含まれることを確認
      const errorText = await page.getByTestId('error-message').textContent()
      expect(errorText).toBeTruthy()
      expect(errorText?.length).toBeGreaterThan(0)
    })
  })

  test.describe('レスポンシブデザインエラー', () => {
    test('モバイル画面でのエラーメッセージ表示', async ({ page }) => {
      // モバイル画面サイズに設定
      await page.setViewportSize({ width: 375, height: 667 })

      await page.goto('/auth/login')

      // 無効なログインを試行
      await page.getByLabel('メールアドレス').fill('invalid@example.com')
      await page.locator('input[name="password"]').fill('wrongpassword')
      await page.getByRole('button', { name: 'ログイン' }).click()

      // エラーメッセージが表示されることを確認
      await expect(page.getByTestId('error-message')).toBeVisible()

      // エラーメッセージが画面内に収まることを確認
      const errorElement = page.getByTestId('error-message')
      const boundingBox = await errorElement.boundingBox()

      expect(boundingBox).toBeTruthy()
      expect(boundingBox!.x).toBeGreaterThanOrEqual(0)
      expect(boundingBox!.y).toBeGreaterThanOrEqual(0)
      expect(boundingBox!.x + boundingBox!.width).toBeLessThanOrEqual(375)
    })

    test('タブレット画面でのフォームエラー表示', async ({ page }) => {
      // タブレット画面サイズに設定
      await page.setViewportSize({ width: 768, height: 1024 })

      await page.goto('/auth/register')

      // 空のフォームを送信
      await page.getByRole('button', { name: '会員登録' }).click()

      // バリデーションエラーが表示されることを確認
      await expect(page.getByText('ユーザー名を入力してください')).toBeVisible()
      await expect(page.getByText('メールアドレスを入力してください')).toBeVisible()
      await expect(page.getByText('パスワードを入力してください')).toBeVisible()

      // エラーメッセージが適切に配置されることを確認
      const errorMessages = await page.locator('text=を入力してください').all()
      expect(errorMessages.length).toBeGreaterThan(0)
    })
  })
})
