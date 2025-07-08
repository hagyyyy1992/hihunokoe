import { test, expect } from '@playwright/test'
import { registerAndLoginTestUser } from '@e2e/helpers/auth-helpers'
import { generateRandomUser } from '@e2e/helpers/test-data'

test.describe('認証デバッグ', () => {
  test('認証フローの詳細確認', async ({ page }) => {
    // テスト用ユーザーで登録してログイン
    const user = generateRandomUser()

    // 登録とログイン
    await registerAndLoginTestUser(page, {
      email: user.email,
      password: user.password,
      userName: user.username,
      skinType: user.skinType,
    })

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
