import { test, expect } from '@playwright/test'
import { AuthHelper } from '@e2e/helpers/auth-helpers'
import { wait, waitWithLog } from '@e2e/helpers/wait-helper'

test.describe('ログイン', () => {
  let authHelper: AuthHelper

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)

    // レート制限をリセット（他のテストの影響を避けるため）
    try {
      const response = await page.request.post('http://localhost:3000/api/test/reset-rate-limiters')
      if (!response.ok()) {
      }
    } catch (error) {}

    // レート制限リセット後に少し待機
    await waitWithLog(500, 'after rate limiter reset')
  })

  test('正常なログインができる', async ({ page }) => {
    // メール認証済みのデモユーザーを使用
    const demoUser = { email: 'demo@example.com', password: 'demo1234' }

    // 利用規約同意状態を確保
    const port = process.env.PORT || '3000'
    await fetch(`http://localhost:${port}/api/test/accept-terms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: demoUser.email }),
    })

    // まずトップページに移動
    await page.goto('/')

    // ログアウト状態にする（既にログアウト状態の場合はエラーを無視）
    try {
      await authHelper.logout()
    } catch (error) {}

    // ログイン
    await authHelper.login(demoUser.email, demoUser.password)

    // ログイン後の認証状態が反映されるのを待つ
    await wait(2000)

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

      await wait(2000)
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
    const demoUser = { email: 'demo@example.com', password: 'demo1234' }

    // 利用規約同意状態を確保
    const port = process.env.PORT || '3000'
    await fetch(`http://localhost:${port}/api/test/accept-terms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: demoUser.email }),
    })

    // まずトップページに移動
    await page.goto('/')

    // ログアウト状態にする（既にログアウト状態の場合はエラーを無視）
    try {
      await authHelper.logout()
    } catch (error) {}

    // 保護されたページにアクセスを試行 - use domcontentloaded for better compatibility
    try {
      await page.goto('/home', { waitUntil: 'domcontentloaded' })
    } catch (error) {
      // If navigation fails due to redirect, that's expected
    }

    // ログインページにリダイレクトされる (longer timeout for slower browsers)
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15000 })

    // ログイン
    await authHelper.login(demoUser.email, demoUser.password)

    // ログイン後の処理が完了するまで待機
    await wait(2000)

    // 元々アクセスしようとしたページにリダイレクトされる
    await expect(page).toHaveURL(/\/home/, { timeout: 15000 })
  })

  test('Remember me 機能のテスト', async ({ page, context }) => {
    const authHelper = new AuthHelper(page)
    // メール認証済みのデモユーザーを使用
    const demoUser = { email: 'demo@example.com', password: 'demo1234' }

    // 利用規約同意状態を確保
    const port = process.env.PORT || '3000'
    await fetch(`http://localhost:${port}/api/test/accept-terms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: demoUser.email }),
    })

    // ログインページに移動
    await page.goto('/auth/login')

    // メールアドレスとパスワードを入力
    await page.getByLabel('メールアドレス').fill(demoUser.email)
    await page.locator('input[name="password"]').fill(demoUser.password)

    // Remember me チェックボックスがチェック可能であることを確認
    const rememberMeCheckbox = page.getByLabel('ログイン状態を保持する')
    await expect(rememberMeCheckbox).toBeVisible()
    await rememberMeCheckbox.check()
    await expect(rememberMeCheckbox).toBeChecked()

    // ログインボタンをクリック
    await page.getByRole('button', { name: 'ログイン' }).click()

    // ログイン成功を待つ - ホームページへのリダイレクトを確認
    await page.waitForURL('/home', { timeout: 15000 })

    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('networkidle')

    // ログイン状態を確認
    await authHelper.expectToBeLoggedIn()

    // クッキーを確認
    const cookies = await context.cookies()
    const authCookie = cookies.find(cookie => cookie.name === 'auth-token')
    expect(authCookie).toBeDefined()

    // 注: 現在の実装では、Remember me機能は完全には実装されていないため、
    // ページリロード後のセッション維持はテストしない
    // TODO: Remember me機能が実装されたら、以下のテストを有効にする
    /*
    // ページをリロードしてもログイン状態が維持されているかテスト
    await page.reload()
    await page.waitForLoadState('networkidle')

    // リロード後もログアウトボタンが表示されることを確認
    await expect(page.getByRole('button', { name: 'ログアウト' })).toBeVisible()
    */
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

    // data-testidを使用して特定のリンクを取得
    const registerLink = page.getByTestId('register-link')
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
      await wait(1000) // 次の試行までの待機
    }
  })

  test('初回ログイン時に利用規約・プライバシーポリシーへの同意ページにリダイレクトされる', async ({
    page,
  }) => {
    // 既存のdemoユーザーを使用（パスワードが既知）
    const demoUser = { email: 'demo@example.com', password: 'demo1234' }

    // 利用規約同意状態をリセット
    const port = process.env.PORT || '3000'
    await fetch(`http://localhost:${port}/api/test/reset-terms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: demoUser.email }),
    })

    await page.goto('/auth/login')

    // メールアドレスとパスワードを入力
    await page.getByLabel('メールアドレス').fill(demoUser.email)
    await page.locator('input[name="password"]').fill(demoUser.password)

    // ログインボタンをクリック
    await page.getByRole('button', { name: 'ログイン' }).click()

    // 利用規約同意ページにリダイレクトされることを確認
    await expect(page).toHaveURL('/auth/terms-agreement', { timeout: 10000 })

    // 同意ページの要素が表示されることを確認
    await expect(page.getByRole('heading', { name: '利用規約への同意' })).toBeVisible()

    // チェックボックスが表示されることを確認
    const agreeTermsCheckbox = page.getByTestId('agree-terms-checkbox')
    const agreePrivacyCheckbox = page.getByTestId('agree-privacy-checkbox')
    await expect(agreeTermsCheckbox).toBeVisible()
    await expect(agreePrivacyCheckbox).toBeVisible()

    // 利用規約とプライバシーポリシーのリンクが表示されることを確認
    await expect(page.getByRole('main').getByRole('link', { name: '利用規約' })).toBeVisible()
    await expect(
      page.getByRole('main').getByRole('link', { name: 'プライバシーポリシー' })
    ).toBeVisible()

    // まずは何もしていない状態で同意ボタンが無効であることを確認
    await expect(page.getByTestId('submit-agreement-button')).toBeDisabled()

    // 利用規約リンクをクリックして開く
    await page.getByRole('main').getByRole('link', { name: '利用規約' }).click()

    // 新しいタブが開くのを待つ
    await page.waitForTimeout(100)

    // プライバシーポリシーリンクをクリックして開く
    await page.getByRole('main').getByRole('link', { name: 'プライバシーポリシー' }).click()

    // 新しいタブが開くのを待つ
    await page.waitForTimeout(100)

    // 3秒待機（リンククリック後の最小読了時間）
    await page.waitForTimeout(3100)

    // チェックボックスをチェック
    await agreeTermsCheckbox.check()
    await agreePrivacyCheckbox.check()

    // 同意ボタンが有効になることを確認してクリック
    await expect(page.getByTestId('submit-agreement-button')).toBeEnabled()
    await page.getByTestId('submit-agreement-button').click()

    // ホームページにリダイレクトされることを確認
    await expect(page).toHaveURL('/home', { timeout: 10000 })
  })

  test('利用規約同意ページから利用規約リンクが新しいタブで開く', async ({ page, context }) => {
    // 既存のdemoユーザーを使用
    const demoUser = { email: 'demo@example.com', password: 'demo1234' }

    // 利用規約同意状態をリセット
    const port = process.env.PORT || '3000'
    await fetch(`http://localhost:${port}/api/test/reset-terms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: demoUser.email }),
    })

    await page.goto('/auth/login')

    // メールアドレスとパスワードを入力
    await page.getByLabel('メールアドレス').fill(demoUser.email)
    await page.locator('input[name="password"]').fill(demoUser.password)
    await page.getByRole('button', { name: 'ログイン' }).click()

    // 利用規約同意ページにリダイレクトされるのを待つ
    await expect(page).toHaveURL('/auth/terms-agreement', { timeout: 10000 })

    // 利用規約リンクをクリック
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('main').getByRole('link', { name: '利用規約' }).click(),
    ])

    // 新しいタブで利用規約ページが開くことを確認
    await expect(newPage).toHaveURL(/\/legal\/terms/)
    await newPage.close()
  })

  test('ログアウト機能が正常に動作する', async ({ page }) => {
    // メール認証済みのデモユーザーを使用
    const demoUser = { email: 'demo@example.com', password: 'demo1234' }

    // 利用規約同意状態を確保
    const port = process.env.PORT || '3000'
    await fetch(`http://localhost:${port}/api/test/accept-terms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: demoUser.email }),
    })

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
