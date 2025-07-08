import { test, expect } from '@playwright/test'
import { registerAndLoginTestUser } from '@e2e/helpers/auth-helpers'
import { generateRandomUser } from '@e2e/helpers/test-data'

test.describe('認証デバッグ', () => {
  test('認証フローの詳細確認', async ({ page }) => {
    // テスト用ユーザーで登録してログイン
    const user = generateRandomUser()
    console.log('テストユーザー:', user.email)

    // ネットワークリクエストを監視
    page.on('request', request => {
      if (request.url().includes('/api/auth')) {
        console.log('>> Request:', request.method(), request.url())
        console.log('>> Headers:', request.headers())
      }
    })

    page.on('response', response => {
      if (response.url().includes('/api/auth')) {
        console.log('<< Response:', response.status(), response.url())
      }
    })

    // 登録とログイン
    await registerAndLoginTestUser(page, {
      email: user.email,
      password: user.password,
      userName: user.username,
      skinType: user.skinType,
    })

    // 認証状態の確認
    console.log('現在のURL:', page.url())

    // クッキーの確認
    const cookies = await page.context().cookies()
    const authCookie = cookies.find(c => c.name === 'auth-token')
    console.log('Auth Cookie:', authCookie ? 'あり' : 'なし')
    if (authCookie) {
      console.log('Cookie詳細:', {
        name: authCookie.name,
        value: authCookie.value.substring(0, 20) + '...',
        domain: authCookie.domain,
        path: authCookie.path,
        httpOnly: authCookie.httpOnly,
        secure: authCookie.secure,
        sameSite: authCookie.sameSite,
      })
    }

    // /api/auth/meエンドポイントをテスト
    const meResponse = await page.evaluate(async () => {
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
    console.log('/api/auth/me レスポンス:', meResponse)

    // 投稿作成ページにアクセス
    await page.goto('/posts/new')
    await page.waitForTimeout(3000)

    const finalUrl = page.url()
    console.log('投稿作成ページURL:', finalUrl)

    // ログインページにリダイレクトされたかチェック
    if (finalUrl.includes('/auth/login')) {
      throw new Error('認証が保持されていません - ログインページにリダイレクトされました')
    }

    // フォームが表示されているか確認
    const titleInput = page.locator('input[name="title"]')
    await expect(titleInput).toBeVisible({ timeout: 5000 })
    console.log('投稿作成フォームが正しく表示されています')
  })
})
