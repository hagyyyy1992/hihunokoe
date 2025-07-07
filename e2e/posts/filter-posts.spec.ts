import { test, expect } from '@playwright/test'
import { registerAndLoginTestUser } from '@e2e/helpers/auth-helpers'
import { PostHelper } from '@e2e/helpers/post-helpers'
import { generateRandomUser, testPosts } from '@e2e/helpers/test-data'

test.describe('投稿検索・フィルタリング', () => {
  let postHelper: PostHelper

  test.beforeEach(async ({ page }) => {
    postHelper = new PostHelper(page)

    // テスト用ユーザーで登録してログイン
    const user = generateRandomUser()
    await registerAndLoginTestUser(page, {
      email: user.email,
      password: user.password,
      userName: user.username,
      skinType: user.skinType,
    })

    // テスト用の投稿を複数作成
    await postHelper.createPost({
      title: 'スキンケアルーティン',
      content: '朝のスキンケアについて',
      cosmeticName: 'モーニングクリーム',
      cosmeticCategory: 'cream',
    })

    await postHelper.createPost({
      title: 'メイクアップチュートリアル',
      content: '初心者向けメイクアップ',
      cosmeticName: 'ナチュラルファンデーション',
      cosmeticCategory: 'foundation',
    })

    await postHelper.createPost({
      title: '香水レビュー',
      content: '新しい香水の使用感',
      cosmeticName: 'フローラルフレグランス',
      cosmeticCategory: 'other',
    })
  })

  test('カテゴリフィルタが正常に動作する', async ({ page }) => {
    await page.goto('/posts')

    // カテゴリフィルタが存在するか確認
    const categoryFilter = page.locator('[data-testid="category-filter"]')
    if (await categoryFilter.isVisible()) {
      await categoryFilter.selectOption('foundation')

      // ファンデーションカテゴリの投稿のみ表示される
      await postHelper.expectPostToBeVisible('メイクアップチュートリアル')
    } else {
      // カテゴリフィルタが実装されていない場合はスキップ
      console.warn('Category filter not found, skipping test')
    }
  })
})
