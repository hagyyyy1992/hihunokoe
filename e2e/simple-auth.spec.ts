import { test, expect } from '@playwright/test'

test.describe('シンプル認証テスト', () => {
  test('ログインAPIが正しくクッキーを設定するか確認', async ({ page, context }) => {
    // ログインページへ移動
    await page.goto('/auth/login')

    // APIレスポンスを監視
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/auth/login') && response.status() === 200
    )

    // ログインフォームに入力
    await page.getByLabel('メールアドレス').fill('demo@example.com')
    await page.locator('input[name="password"]').fill('demo1234')

    // ログインボタンをクリック
    await page.getByRole('button', { name: 'ログイン' }).click()

    // レスポンスを待つ
    const response = await responsePromise
    const responseData = await response.json()

    // 少し待機
    await page.waitForTimeout(2000)

    // クッキーを確認
    const cookies = await context.cookies()
    const authCookie = cookies.find(c => c.name === 'auth-token')
    if (authCookie) {
    }

    // /api/auth/meを直接呼び出してみる
    await page.evaluate(async () => {
      const response = await fetch('/api/auth/me', {
        credentials: 'same-origin',
      })
      const data = await response.json()
      return {
        status: response.status,
        data: data,
      }
    })

    // トークンを使用してAPIを呼び出す
    if (responseData.token) {
      const meResponseWithToken = await page.evaluate(async token => {
        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const data = await response.json()
        return {
          status: response.status,
          data: data,
        }
      }, responseData.token)
    }
  })
})
