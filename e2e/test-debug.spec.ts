import { test, expect } from '@playwright/test'
import { AuthHelper } from './helpers/auth-helpers'
import { PostHelper } from './helpers/post-helpers'

test.describe('デバッグテスト', () => {
  let authHelper: AuthHelper
  let postHelper: PostHelper

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)
    postHelper = new PostHelper(page)
  })

  test('検索フィールドの確認', async ({ page }) => {
    await page.goto('/posts')

    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle')

    // 検索フィールドを探す
    const searchInput = page.locator('input[placeholder="コスメ名や体験談で検索"]')
    console.log('検索フィールドが存在するか:', await searchInput.count())

    if ((await searchInput.count()) > 0) {
      await searchInput.fill('テスト')
      await page.waitForTimeout(1000)
      console.log('検索フィールドに入力完了')
    } else {
      console.log('検索フィールドが見つかりません')
    }
  })

  test('投稿作成テスト', async ({ page }) => {
    // ログイン
    await authHelper.registerAndLogin()
    console.log('ログイン完了')

    // 投稿作成
    const postData = {
      title: 'デバッグテスト投稿',
      content: 'デバッグ用の投稿です',
      cosmeticName: 'テスト化粧品',
      cosmeticCategory: 'toner',
      skinType: 'normal',
      moodTag: 'good',
    }

    try {
      const postId = await postHelper.createPost(postData)
      console.log('投稿作成成功:', postId)
    } catch (error) {
      console.error('投稿作成エラー:', error)
    }
  })
})
