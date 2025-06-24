import { test, expect } from '@playwright/test'
import { AuthHelper } from '../helpers/auth-helpers'
import { generateRandomUser } from '../helpers/test-data'

test.describe('ユーザー登録', () => {
  let authHelper: AuthHelper

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)
  })

  test('正常なユーザー登録ができる', async ({ page }) => {
    const newUser = generateRandomUser()

    await authHelper.register(newUser)

    // 登録成功後のリダイレクトまたは成功メッセージを確認
    await expect(page).toHaveURL(/\/auth\/verify-email|\/dashboard/)
    await authHelper.expectSuccessMessage('アカウントが作成されました')
  })

  test('バリデーションエラーが正しく表示される', async ({ page }) => {
    await page.goto('/auth/register')

    // 空のフォームで送信
    await page.click('[data-testid="register-button"]')

    // バリデーションエラーメッセージを確認
    await expect(page.locator('[data-testid="username-error"]')).toContainText(
      'ユーザー名は必須です'
    )
    await expect(page.locator('[data-testid="email-error"]')).toContainText(
      'メールアドレスは必須です'
    )
    await expect(page.locator('[data-testid="password-error"]')).toContainText(
      'パスワードは必須です'
    )
  })

  test('無効なメールアドレスでエラーが表示される', async ({ page }) => {
    const invalidUser = {
      ...generateRandomUser(),
      email: 'invalid-email',
    }

    await authHelper.register(invalidUser)
    await authHelper.expectErrorMessage('有効なメールアドレスを入力してください')
  })

  test('短すぎるパスワードでエラーが表示される', async ({ page }) => {
    const invalidUser = {
      ...generateRandomUser(),
      password: '123',
    }

    await authHelper.register(invalidUser)
    await authHelper.expectErrorMessage('パスワードは6文字以上である必要があります')
  })

  test('既存のメールアドレスで登録しようとするとエラーが表示される', async ({ page }) => {
    const user1 = generateRandomUser()
    const user2 = {
      ...generateRandomUser(),
      email: user1.email, // 同じメールアドレス
    }

    // 最初のユーザーを登録
    await authHelper.register(user1)

    // ログアウト
    await page.goto('/auth/logout')

    // 同じメールアドレスで再度登録を試行
    await authHelper.register(user2)
    await authHelper.expectErrorMessage('このメールアドレスは既に使用されています')
  })

  test('必須フィールドの動的バリデーション', async ({ page }) => {
    await page.goto('/auth/register')

    const usernameInput = page.locator('[data-testid="username-input"]')
    const emailInput = page.locator('[data-testid="email-input"]')
    const passwordInput = page.locator('[data-testid="password-input"]')

    // フィールドをフォーカスして離すとエラーが表示される
    await usernameInput.click()
    await emailInput.click()
    await expect(page.locator('[data-testid="username-error"]')).toBeVisible()

    await emailInput.click()
    await passwordInput.click()
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible()

    await passwordInput.click()
    await usernameInput.click()
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible()
  })

  test('パスワード表示/非表示の切り替え', async ({ page }) => {
    await page.goto('/auth/register')

    const passwordInput = page.locator('[data-testid="password-input"]')
    const toggleButton = page.locator('[data-testid="password-toggle"]')

    // 初期状態はパスワードが隠されている
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // 表示ボタンをクリック
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')

    // 再度クリックして非表示に
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('肌タイプ選択が正常に動作する', async ({ page }) => {
    await page.goto('/auth/register')

    const skinTypeSelect = page.locator('[data-testid="skin-type-select"]')

    // 各肌タイプオプションが存在することを確認
    await expect(skinTypeSelect.locator('option[value="NORMAL"]')).toContainText('普通肌')
    await expect(skinTypeSelect.locator('option[value="DRY"]')).toContainText('乾燥肌')
    await expect(skinTypeSelect.locator('option[value="OILY"]')).toContainText('脂性肌')
    await expect(skinTypeSelect.locator('option[value="COMBINATION"]')).toContainText('混合肌')
    await expect(skinTypeSelect.locator('option[value="SENSITIVE"]')).toContainText('敏感肌')

    // 肌タイプを選択
    await skinTypeSelect.selectOption('COMBINATION')
    await expect(skinTypeSelect).toHaveValue('COMBINATION')
  })
})
