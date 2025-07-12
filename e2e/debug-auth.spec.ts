import { test, expect } from '@playwright/test'
import { loginTestUser } from '@e2e/helpers/auth-helpers'

test.describe('認証デバッグ', () => {
  test('認証フローの詳細確認', async ({ page }) => {
    // Mock userでログイン（問題の単純化）
    await loginTestUser(page, 'demo@example.com', 'demo1234')

    // /api/auth/meエンドポイントをテスト
    await page.evaluate(async () => {
      try {
        const response = await fetch('/api/auth/me')
        const data = await response.json()
        return {
          ok: response.ok,
          status: response.status,
          data: data,
        }
      } catch (error) {
        return {
          ok: false,
          status: 0,
          error: error instanceof Error ? error.message : String(error),
        }
      }
    })

    // 投稿作成ページにアクセス
    await page.goto('/posts/new')
    await page.waitForTimeout(3000)

    const finalUrl = page.url()

    // ログインページにリダイレクトされたかチェック
    if (finalUrl.includes('/auth/login')) {
      throw new Error('認証が保持されていません - ログインページにリダイレクトされました')
    }

    // フォームが表示されているか確認
    const titleInput = page.locator('input[name="title"]')
    await expect(titleInput).toBeVisible({ timeout: 5000 })
  })
})
