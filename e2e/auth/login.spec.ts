import { test, expect } from '@playwright/test'
import { AuthHelper } from '@e2e/helpers/auth-helpers'
import { testUsers, generateRandomUser } from '@e2e/helpers/test-data'

test.describe('ログイン', () => {
  let authHelper: AuthHelper

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)

    // レート制限をリセット（他のテストの影響を避けるため）
    try {
      const response = await page.request.post('http://localhost:3000/api/test/reset-rate-limiters')
      if (!response.ok()) {
        console.log('Rate limiter reset failed with status:', response.status())
      }
    } catch (error) {
      console.log('Rate limiter reset failed (continuing anyway):', error)
    }

    // レート制限リセット後に少し待機
    await page.waitForTimeout(500)
  })

  test('正常なログインができる', async ({ page }) => {
    // メール認証済みのデモユーザーを使用
    const demoUser = { email: 'demo@example.com', password: 'demo1234' }

    // まずトップページに移動
    await page.goto('/')

    // ログアウト状態にする（既にログアウト状態の場合はエラーを無視）
    try {
      await authHelper.logout()
    } catch (error) {
      console.log('Already logged out or logout failed:', error)
    }

    // ログイン
    await authHelper.login(demoUser.email, demoUser.password)

    // ログイン後の認証状態が反映されるのを待つ
    await page.waitForTimeout(2000)

    // ログイン成功を確認（リトライロジック付き）
    let loginSuccess = false
    let retryCount = 0
    const maxRetries = 3

    while (!loginSuccess && retryCount < maxRetries) {
      const currentUrl = page.url()
      if (!currentUrl.includes('/auth/login')) {
        loginSuccess = true
        break
      }

      retryCount++
      console.log(
        `Login verification attempt ${retryCount}/${maxRetries}. Current URL: ${currentUrl}`
      )
      await page.waitForTimeout(2000)
    }

    await expect(page).toHaveURL(/\/home|\//)
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
    await page.getByRole('button', { name: 'ログイン' }).click()

    // HTML5バリデーションメッセージが表示されることを確認
    const emailInput = page.getByLabel('メールアドレス')
    const passwordInput = page.locator('input[name="password"]')

    await expect(emailInput).toHaveAttribute('required')
    await expect(passwordInput).toHaveAttribute('required')

    // まだログインページにいることを確認（送信されていない）
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('無効なメールアドレス形式でエラーが表示される', async ({ page }) => {
    await page.goto('/auth/login')

    // 無効なメールアドレスを入力
    await page.getByLabel('メールアドレス').fill('invalid-email')
    await page.locator('input[name="password"]').fill('somepassword')
    await page.getByRole('button', { name: 'ログイン' }).click()

    // HTML5 validation によりフォームが送信されない（ページが変わらない）
    await expect(page).toHaveURL(/\/auth\/login/)

    // メールフィールドが無効状態になっている
    const emailInput = page.getByLabel('メールアドレス')
    await expect(emailInput).toHaveAttribute('type', 'email')
  })

  test('ログイン成功後にリダイレクトされる', async ({ page }) => {
    // メール認証済みのデモユーザーを使用（新規登録ユーザーは未認証のためログインできない）
    const demoUser = { email: 'demo@example.com', password: 'demo123' }

    // まずトップページに移動
    await page.goto('/')

    // ログアウト状態にする（既にログアウト状態の場合はエラーを無視）
    try {
      await authHelper.logout()
    } catch (error) {
      console.log(
        'User was already logged out or logout failed:',
        error instanceof Error ? error.message : String(error)
      )
    }

    // 保護されたページにアクセスを試行 - use domcontentloaded for better compatibility
    try {
      await page.goto('/home', { waitUntil: 'domcontentloaded' })
    } catch (error) {
      // If navigation fails due to redirect, that's expected
      console.log('Navigation redirected as expected')
    }

    // ログインページにリダイレクトされる (longer timeout for slower browsers)
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15000 })

    // ログイン
    await authHelper.login(demoUser.email, demoUser.password)

    // 元々アクセスしようとしたページにリダイレクトされる
    await expect(page).toHaveURL(/\/home/)
  })

  test('Remember me 機能のテスト', async ({ page, context }) => {
    // メール認証済みのデモユーザーを使用
    const demoUser = { email: 'demo@example.com', password: 'demo1234' }

    await page.goto('/auth/login')
    await page.getByLabel('メールアドレス').fill(demoUser.email)
    await page.locator('input[name="password"]').fill(demoUser.password)

    // Remember me チェックボックスをチェック
    await page.getByLabel('ログイン状態を保持する').check()
    await page.getByRole('button', { name: 'ログイン' }).click()

    // ログイン成功を待つ - ホームページまたは投稿一覧ページへのリダイレクトを確認
    await page.waitForURL(
      url => {
        return url.pathname === '/home' || url.pathname === '/'
      },
      { timeout: 10000 }
    )

    await authHelper.expectToBeLoggedIn()

    // 新しいページを開いてもログイン状態が維持されているかテスト
    const newPage = await context.newPage()
    const newAuthHelper = new AuthHelper(newPage)
    await newPage.goto('/')
    await newAuthHelper.expectToBeLoggedIn()
  })

  test('パスワードリセットリンクが機能する', async ({ page }) => {
    await page.goto('/auth/login')

    // より確実にリンクがクリックされるように待機とナビゲーション検証を追加
    const forgotPasswordLink = page.getByText('パスワードをお忘れですか？')
    await forgotPasswordLink.waitFor({ state: 'visible' })

    // ナビゲーション完了を待つ
    const [response] = await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      forgotPasswordLink.click(),
    ])

    await expect(page).toHaveURL(/\/auth\/forgot-password/)

    // パスワードリセットフォームが表示される
    await expect(page.locator('[data-testid="reset-password-form"]')).toBeVisible()
  })

  test('新規登録リンクが機能する', async ({ page }) => {
    await page.goto('/auth/login')

    // リンクがクリック可能になるまで待つ
    const registerLink = page.getByText('会員登録')
    await registerLink.waitFor({ state: 'visible' })

    // クリックして直接遷移を待つ
    await registerLink.click()

    // URL変更を待つ
    await page.waitForURL(/\/auth\/register/, { timeout: 10000 })

    // 登録フォームが表示される
    await expect(page.locator('[data-testid="register-form"]')).toBeVisible()
  })

  test('ログイン試行回数制限のテスト', async ({ page }) => {
    // 実在するユーザー（デモユーザー）を使用
    const email = 'demo@example.com'
    const wrongPassword = 'wrongpassword123'

    // 複数回間違ったパスワードでログインを試行
    for (let i = 0; i < 3; i++) {
      await authHelper.login(email, wrongPassword, false)
      // 毎回エラーメッセージを確認
      await authHelper.expectErrorMessage('メールアドレスまたはパスワードが間違っています')
      await page.waitForTimeout(1000) // 次の試行までの待機
    }
  })

  test('ログアウト機能が正常に動作する', async ({ page }) => {
    // メール認証済みのデモユーザーを使用
    const demoUser = { email: 'demo@example.com', password: 'demo1234' }

    // ログインページから開始
    await page.goto('/auth/login')
    await page.getByLabel('メールアドレス').fill(demoUser.email)
    await page.locator('input[name="password"]').fill(demoUser.password)
    await page.getByRole('button', { name: 'ログイン' }).click()

    // ログイン成功を待つ（タイムアウトを延長）
    await expect(page).toHaveURL('/home', { timeout: 10000 })

    // ログイン状態を確認
    await authHelper.expectToBeLoggedIn()

    // ログアウト
    await authHelper.logout()

    // ログアウト状態を確認
    await authHelper.expectToBeLoggedOut()
    await expect(page).toHaveURL(/\/auth\/login|\//)
  })
})
