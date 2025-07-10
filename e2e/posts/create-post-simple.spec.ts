import { test, expect } from '@playwright/test'
import { AuthHelper } from '@e2e/helpers/auth-helpers'
import { PostHelper } from '@e2e/helpers/post-helpers'
import { wait } from '@e2e/helpers/wait-helper'

test.describe('簡易投稿作成テスト', () => {
  test.setTimeout(120000)

  test('既存デモユーザーで投稿作成', async ({ page }) => {
    const authHelper = new AuthHelper(page)
    const postHelper = new PostHelper(page)

    // レート制限をリセット
    try {
      await page.request.post('http://localhost:3000/api/test/reset-rate-limiters')
    } catch (error) {}

    // まずトップページに移動
    await page.goto('/')

    // ログアウト状態にする（既にログアウト状態の場合はエラーを無視）
    try {
      await authHelper.logout()
    } catch (error) {}

    // デモユーザーでログイン
    await authHelper.login('demo@example.com', 'demo1234')

    // ログイン後の処理が完了するまで待機
    await wait(5000) // 待機時間を増やす

    // ログイン成功を確認
    const currentUrl = page.url()
    if (currentUrl.includes('/auth/login')) {
      throw new Error('Login failed - still on login page')
    }

    // ホームページに一度アクセスして認証状態を確立
    await page.goto('/home')
    await page.waitForTimeout(2000)

    // 再度URLを確認
    const homeUrl = page.url()
    if (homeUrl.includes('/auth/login')) {
      // デバッグ情報
      const cookies = await page.context().cookies()
      console.error(
        'Auth cookies:',
        cookies.filter(c => c.name.includes('auth'))
      )
      throw new Error('Authentication lost after navigating to home')
    }

    // 投稿作成
    const postId = await postHelper.createPost({
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
