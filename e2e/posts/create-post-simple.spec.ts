import { test, expect } from '@playwright/test'
import { AuthHelper } from '@e2e/helpers/auth-helpers'
import { PostHelper } from '@e2e/helpers/post-helpers'

test.describe('簡易投稿作成テスト', () => {
  test.setTimeout(120000)

  test('既存デモユーザーで投稿作成', async ({ page }) => {
    const authHelper = new AuthHelper(page)
    const postHelper = new PostHelper(page)

    // デモユーザーでログイン（既存ユーザーを使用）
    await authHelper.login('demo@example.com', 'demo1234')

    // 認証状態が安定するまで待機
    await page.waitForTimeout(3000)

    // 投稿作成
    await postHelper.createPost({
      title: 'テスト投稿',
      content: 'これはテスト投稿です',
      cosmeticName: 'テストコスメ',
      cosmeticCategory: 'cream',
      moodTag: 'good',
    })

    // 投稿作成成功を確認
    await expect(page).toHaveURL(/\/posts\/[a-zA-Z0-9_-]+/)
    await postHelper.expectPostToBeVisible('テスト投稿')
  })
})
