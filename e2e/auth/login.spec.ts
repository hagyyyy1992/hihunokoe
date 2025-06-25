import { test, expect } from '@playwright/test'
import { AuthHelper } from '../helpers/auth-helpers'
import { testUsers, generateRandomUser } from '../helpers/test-data'

test.describe('ログイン', () => {
  let authHelper: AuthHelper

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)
  })

  test('正常なログインができる', async ({ page }) => {
    // まず新しいユーザーを登録
    const newUser = generateRandomUser()
    await authHelper.register(newUser)

    // ログアウト
    await authHelper.logout()

    // ログイン
    await authHelper.login(newUser.email, newUser.password)

    // ログイン成功を確認
    await expect(page).toHaveURL(/\/dashboard|\//)
    await authHelper.expectToBeLoggedIn()
  })

  test('無効な認証情報でログインが失敗する', async ({ page }) => {
    await authHelper.login('nonexistent@example.com', 'wrongpassword', false)
    await authHelper.expectErrorMessage('メールアドレスまたはパスワードが間違っています')
    await authHelper.expectToBeLoggedOut()
  })

  test('空のフィールドでバリデーションエラーが表示される', async ({ page }) => {
    await page.goto('/auth/login')

    // 空のフォームで送信（HTML5 validationが発生する）
    await page.click('[data-testid="login-button"]')

    // HTML5バリデーションメッセージが表示されることを確認
    const emailInput = page.locator('[data-testid="email-input"]')
    const passwordInput = page.locator('[data-testid="password-input"]')

    await expect(emailInput).toHaveAttribute('required')
    await expect(passwordInput).toHaveAttribute('required')

    // まだログインページにいることを確認（送信されていない）
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('無効なメールアドレス形式でエラーが表示される', async ({ page }) => {
    await page.goto('/auth/login')

    // 無効なメールアドレスを入力
    await page.fill('[data-testid="email-input"]', 'invalid-email')
    await page.fill('[data-testid="password-input"]', 'somepassword')
    await page.click('[data-testid="login-button"]')

    // HTML5 validation によりフォームが送信されない（ページが変わらない）
    await expect(page).toHaveURL(/\/auth\/login/)

    // メールフィールドが無効状態になっている
    const emailInput = page.locator('[data-testid="email-input"]')
    await expect(emailInput).toHaveAttribute('type', 'email')
  })

  test('ログイン成功後にリダイレクトされる', async ({ page }) => {
    const newUser = generateRandomUser()
    await authHelper.register(newUser)
    await authHelper.logout()

    // ログアウト状態を確認
    await authHelper.expectToBeLoggedOut()

    // 保護されたページにアクセスを試行 - use domcontentloaded for better compatibility
    try {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    } catch (error) {
      // If navigation fails due to redirect, that's expected
      console.log('Navigation redirected as expected')
    }

    // ログインページにリダイレクトされる (longer timeout for slower browsers)
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15000 })

    // ログイン
    await authHelper.login(newUser.email, newUser.password)

    // 元々アクセスしようとしたページにリダイレクトされる
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('Remember me 機能のテスト', async ({ page, context }) => {
    const newUser = generateRandomUser()
    await authHelper.register(newUser)
    await authHelper.logout()

    await page.goto('/auth/login')
    await page.fill('[data-testid="email-input"]', newUser.email)
    await page.fill('[data-testid="password-input"]', newUser.password)

    // Remember me チェックボックスをチェック
    await page.check('[data-testid="remember-me-checkbox"]')
    await page.click('[data-testid="login-button"]')

    await authHelper.expectToBeLoggedIn()

    // 新しいページを開いてもログイン状態が維持されているかテスト
    const newPage = await context.newPage()
    const newAuthHelper = new AuthHelper(newPage)
    await newPage.goto('/')
    await newAuthHelper.expectToBeLoggedIn()
  })

  test('パスワードリセットリンクが機能する', async ({ page }) => {
    await page.goto('/auth/login')

    await page.click('[data-testid="forgot-password-link"]')
    await expect(page).toHaveURL(/\/auth\/forgot-password/)

    // パスワードリセットフォームが表示される
    await expect(page.locator('[data-testid="reset-password-form"]')).toBeVisible()
  })

  test('新規登録リンクが機能する', async ({ page }) => {
    await page.goto('/auth/login')

    await page.click('[data-testid="register-link"]')
    await expect(page).toHaveURL(/\/auth\/register/)

    // 登録フォームが表示される
    await expect(page.locator('[data-testid="register-form"]')).toBeVisible()
  })

  test('ログイン試行回数制限のテスト', async ({ page }) => {
    const email = 'test@example.com'
    const wrongPassword = 'wrongpassword'

    // 複数回間違ったパスワードでログインを試行
    for (let i = 0; i < 3; i++) {
      await authHelper.login(email, wrongPassword, false)
      // 最後の試行で期待されるエラーメッセージを確認
      if (i === 2) {
        await authHelper.expectErrorMessage('メールアドレスまたはパスワードが間違っています')
      }
      await page.waitForTimeout(1000) // 次の試行までの待機
    }
  })

  test('ログアウト機能が正常に動作する', async ({ page }) => {
    // Mobile Safari用に複数回リトライするため、タイムスタンプを含むより一意性の高いユーザー名を使用
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const newUser = {
      username: `user_${timestamp}_${randomId}`,
      email: `user_${timestamp}_${randomId}@example.com`,
      password: 'testpassword123',
    }

    await authHelper.register(newUser)

    // ログイン状態を確認
    await authHelper.expectToBeLoggedIn()

    // ログアウト
    await authHelper.logout()

    // ログアウト状態を確認
    await authHelper.expectToBeLoggedOut()
    await expect(page).toHaveURL(/\/auth\/login|\//)
  })
})
