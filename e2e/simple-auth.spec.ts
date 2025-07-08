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

    console.log('Login response status:', response.status())
    console.log('Login response headers:', response.headers())
    console.log('Login response data:', {
      success: responseData.success,
      hasToken: !!responseData.token,
      hasUser: !!responseData.user,
    })

    // Set-Cookieヘッダーを確認
    const setCookieHeader = response.headers()['set-cookie']
    console.log('Set-Cookie header:', setCookieHeader)

    // 少し待機
    await page.waitForTimeout(2000)

    // クッキーを確認
    const cookies = await context.cookies()
    const authCookie = cookies.find(c => c.name === 'auth-token')
    console.log('Auth cookie after login:', authCookie ? 'Found' : 'Not found')
    if (authCookie) {
      console.log('Cookie details:', {
        name: authCookie.name,
        domain: authCookie.domain,
        path: authCookie.path,
        httpOnly: authCookie.httpOnly,
        secure: authCookie.secure,
        sameSite: authCookie.sameSite,
        expires: authCookie.expires,
      })
    }

    // JavaScriptでもクッキーを確認
    const jsCookies = await page.evaluate(() => document.cookie)
    console.log('JavaScript cookies:', jsCookies)

    // /api/auth/meを直接呼び出してみる
    const meResponse = await page.evaluate(async () => {
      const response = await fetch('/api/auth/me', {
        credentials: 'same-origin',
      })
      const data = await response.json()
      return {
        status: response.status,
        data: data,
      }
    })
    console.log('/api/auth/me response:', meResponse)

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
      console.log('/api/auth/me response with token:', meResponseWithToken)
    }
  })
})
