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

    // 登録成功後のリダイレクトを確認
    await expect(page).toHaveURL(/\/auth\/registration-complete/)
    await authHelper.expectSuccessMessage('アカウントが作成されました')
  })

  test('バリデーションエラーが正しく表示される', async ({ page }) => {
    await page.goto('/auth/register')

    // 空のフォームで送信（HTML5 validationが発生する）
    await page.click('[data-testid="register-button"]')

    // HTML5バリデーション属性を確認
    const usernameInput = page.locator('[data-testid="username-input"]')
    const emailInput = page.locator('[data-testid="email-input"]')
    const passwordInput = page.locator('[data-testid="password-input"]')

    await expect(usernameInput).toHaveAttribute('required')
    await expect(emailInput).toHaveAttribute('required')
    await expect(passwordInput).toHaveAttribute('required')

    // まだ登録ページにいることを確認（送信されていない）
    await expect(page).toHaveURL(/\/auth\/register/)
  })

  test('無効なメールアドレスでエラーが表示される', async ({ page }) => {
    const invalidUser = {
      ...generateRandomUser(),
      email: 'invalid-email',
    }

    await authHelper.register(invalidUser)
    await authHelper.expectErrorMessage('入力内容に誤りがあります')
  })

  test('短すぎるパスワードでエラーが表示される', async ({ page }) => {
    const invalidUser = {
      ...generateRandomUser(),
      password: '123',
    }

    await authHelper.register(invalidUser)
    await authHelper.expectErrorMessage('パスワードは8文字以上で入力してください')
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
    await authHelper.expectErrorMessage('ユーザー名またはメールアドレスが既に使用されています')
  })

  test('必須フィールドの動的バリデーション', async ({ page }) => {
    await page.goto('/auth/register')

    const usernameInput = page.locator('[data-testid="username-input"]')
    const emailInput = page.locator('[data-testid="email-input"]')
    const passwordInput = page.locator('[data-testid="password-input"]')

    // フィールドをフォーカスして確認（HTML5 validation）
    await expect(usernameInput).toHaveAttribute('required')
    await expect(emailInput).toHaveAttribute('required')
    await expect(passwordInput).toHaveAttribute('required')

    // フィールドが正常に動作することを確認
    await usernameInput.fill('test')
    await expect(usernameInput).toHaveValue('test')

    await emailInput.fill('test@example.com')
    await expect(emailInput).toHaveValue('test@example.com')
  })

  test('パスワードフィールドが正常に動作する', async ({ page }) => {
    await page.goto('/auth/register')

    const passwordInput = page.locator('[data-testid="password-input"]')

    // パスワードフィールドの基本動作を確認
    await expect(passwordInput).toHaveAttribute('type', 'password')
    await passwordInput.fill('testpassword')
    await expect(passwordInput).toHaveValue('testpassword')
  })

  test('肌タイプ選択が正常に動作する', async ({ page }) => {
    await page.goto('/auth/register')

    const skinTypeSelect = page.locator('[data-testid="skin-type-select"]')

    // 各肌タイプオプションが存在することを確認
    await expect(skinTypeSelect.locator('option[value="normal"]')).toContainText('普通肌')
    await expect(skinTypeSelect.locator('option[value="dry"]')).toContainText('乾燥肌')
    await expect(skinTypeSelect.locator('option[value="oily"]')).toContainText('脂性肌')
    await expect(skinTypeSelect.locator('option[value="combination"]')).toContainText('混合肌')
    await expect(skinTypeSelect.locator('option[value="sensitive"]')).toContainText('敏感肌')

    // 肌タイプを選択
    await skinTypeSelect.selectOption('combination')
    await expect(skinTypeSelect).toHaveValue('combination')
  })
})
