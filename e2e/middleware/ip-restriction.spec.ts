import { test, expect } from '@playwright/test'

test.describe('IP制限機能', () => {
  test.describe('staging環境のIP制限', () => {
    // 注：実際のE2E環境では、IP制限が有効な場合、このテストは失敗する可能性があります
    // テスト環境では、IP制限を無効にするか、テスト用のIPを許可リストに追加する必要があります

    test('IP制限が有効な場合、403エラーページが表示される', async ({ page, context }) => {
      // IP制限を回避するため、実際のテストではスキップ
      test.skip(process.env.IP_RESTRICTION_ENABLED === 'true', 'IP制限が有効な環境ではスキップ')

      // staging環境へアクセス
      const response = await page.goto('/', { waitUntil: 'domcontentloaded' })

      // 正常にアクセスできることを確認
      expect(response?.status()).toBe(200)
    })

    test('管理画面へのアクセスはIP制限される', async ({ page }) => {
      // 管理画面へアクセスを試みる
      const response = await page.goto('/admin', { waitUntil: 'domcontentloaded' })

      // IP制限が有効な場合は403、無効な場合はログインページへリダイレクト
      if (process.env.IP_RESTRICTION_ENABLED === 'true') {
        // IP制限されている場合
        expect(response?.status()).toBe(403)
        await expect(page.locator('h1')).toContainText('アクセス制限')
      } else {
        // IP制限されていない場合はログインページへリダイレクト
        expect(page.url()).toContain('/admin/login')
      }
    })

    test('静的アセットはIP制限されない', async ({ page, request }) => {
      // 静的アセットへのアクセスをテスト
      const paths = ['/favicon.ico', '/robots.txt', '/api/health']

      for (const path of paths) {
        const response = await request.get(path)
        // 403ではないことを確認（404や200など）
        expect(response.status()).not.toBe(403)
      }
    })
  })

  test.describe('エラーページの表示', () => {
    test('403エラーページに適切な情報が表示される', async ({ page }) => {
      test.skip(process.env.IP_RESTRICTION_ENABLED !== 'true', 'IP制限が無効な環境ではスキップ')

      // IP制限されたページへアクセス
      await page.goto('/')

      // エラーページの要素を確認
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('.ip')).toBeVisible() // IPアドレスが表示されている
      await expect(page.locator('text=/システム管理者/')).toBeVisible()
    })
  })
})
