import { test, expect } from '@playwright/test'

test.describe('基本的な認証フロー', () => {
  test('登録ページが正しく表示される', async ({ page }) => {
    await page.goto('/auth/register')

    // ページタイトルを確認
    await expect(page).toHaveTitle(/ひふのこえ|会員登録/)

    // フォーム要素が表示されることを確認
    await expect(page.locator('[data-testid="register-form"]')).toBeVisible()
    await expect(page.locator('[data-testid="username-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="skin-type-select"]')).toBeVisible()
    await expect(page.locator('[data-testid="register-button"]')).toBeVisible()
  })

  test('ログインページが正しく表示される', async ({ page }) => {
    await page.goto('/auth/login')

    // ページタイトルを確認
    await expect(page).toHaveTitle(/ひふのこえ|ログイン/)

    // フォーム要素が表示されることを確認
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible()
  })

  test('フォーム入力が正常に動作する', async ({ page }) => {
    await page.goto('/auth/register')

    // フォームに入力（webkitに対応）
    await page.click('[data-testid="username-input"]')
    await page.fill('[data-testid="username-input"]', 'testuser')
    await page.waitForTimeout(100)

    await page.click('[data-testid="email-input"]')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.waitForTimeout(100)

    await page.click('[data-testid="password-input"]')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.waitForTimeout(100)

    await page.selectOption('[data-testid="skin-type-select"]', 'normal')
    await page.waitForTimeout(100)

    // 入力値が正しく設定されることを確認
    await expect(page.locator('[data-testid="username-input"]')).toHaveValue('testuser')
    await expect(page.locator('[data-testid="email-input"]')).toHaveValue('test@example.com')
    await expect(page.locator('[data-testid="password-input"]')).toHaveValue('password123')
    await expect(page.locator('[data-testid="skin-type-select"]')).toHaveValue('normal')
  })

  test('バリデーションエラーが表示される', async ({ page }) => {
    await page.goto('/auth/register')

    // 空のフォームで送信
    await page.click('[data-testid="register-button"]')

    // エラーメッセージまたはブラウザのバリデーションが動作することを確認
    // HTMLのrequired属性により、ブラウザが送信を阻止する
    await expect(page.locator('[data-testid="username-input"]:invalid')).toBeVisible()
  })

  test('ナビゲーションリンクが機能する', async ({ page }) => {
    const viewport = page.viewportSize()
    const isMobile = viewport && viewport.width < 768

    await page.goto('/auth/login')

    // 登録ページへのリンクをクリック（ページ内のリンク）
    await page.click('[data-testid="register-link"]')
    await expect(page).toHaveURL(/\/auth\/register/)

    // ログインページへのリンクをクリック（ページ内のリンク）
    if (isMobile) {
      // Mobile view - open menu first and check if already open
      const mobileMenu = page.locator('.md\\:hidden .px-2')
      const isMenuVisible = await mobileMenu.isVisible()

      if (!isMenuVisible) {
        await page.click('[data-testid="mobile-menu-button"]')
        await page.waitForTimeout(500)
      }

      // Find visible login link in mobile menu
      const mobileLoginLink = page.locator('.md\\:hidden [data-testid="login-link"]')
      await expect(mobileLoginLink).toBeVisible({ timeout: 5000 })
      await mobileLoginLink.click()
    } else {
      await page.click('text=ログイン')
    }
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})
