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
    await authHelper.login('nonexistent@example.com', 'wrongpassword')
    await authHelper.expectErrorMessage('メールアドレスまたはパスワードが正しくありません')
    await authHelper.expectToBeLoggedOut()
  })

  test('空のフィールドでバリデーションエラーが表示される', async ({ page }) => {
    await page.goto('/auth/login')
    
    // 空のフォームで送信
    await page.click('[data-testid="login-button"]')
    
    // バリデーションエラーメッセージを確認
    await expect(page.locator('[data-testid="email-error"]')).toContainText('メールアドレスは必須です')
    await expect(page.locator('[data-testid="password-error"]')).toContainText('パスワードは必須です')
  })

  test('無効なメールアドレス形式でエラーが表示される', async ({ page }) => {
    await authHelper.login('invalid-email', 'somepassword')
    await authHelper.expectErrorMessage('有効なメールアドレスを入力してください')
  })

  test('ログイン成功後にリダイレクトされる', async ({ page }) => {
    const newUser = generateRandomUser()
    await authHelper.register(newUser)
    await authHelper.logout()
    
    // 保護されたページにアクセスを試行
    await page.goto('/dashboard')
    
    // ログインページにリダイレクトされる
    await expect(page).toHaveURL(/\/auth\/login/)
    
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
    await newPage.goto('/')
    await expect(newPage.locator('[data-testid="user-menu-button"]')).toBeVisible()
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
    for (let i = 0; i < 5; i++) {
      await authHelper.login(email, wrongPassword)
      await page.waitForTimeout(1000) // レート制限を避けるための待機
    }
    
    // 試行回数制限のメッセージを確認
    await authHelper.expectErrorMessage('ログイン試行回数が上限に達しました')
  })

  test('ログアウト機能が正常に動作する', async ({ page }) => {
    const newUser = generateRandomUser()
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