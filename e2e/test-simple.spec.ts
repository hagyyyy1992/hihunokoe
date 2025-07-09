import { test, expect } from '@playwright/test'

test.describe('シンプルなテスト', () => {
  test('投稿一覧ページが表示される', async ({ page }) => {
    await page.goto('/posts')

    // ページタイトルが表示されることを確認
    await expect(page.getByRole('heading', { name: '体験談を見る' })).toBeVisible()
  })
})
