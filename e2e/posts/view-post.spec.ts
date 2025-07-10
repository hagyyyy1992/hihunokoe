import { test, expect } from '@playwright/test'
import { AuthHelper, registerAndLoginTestUser } from '@e2e/helpers/auth-helpers'
import { PostHelper } from '@e2e/helpers/post-helpers'
import { generateRandomUser, testPosts } from '@e2e/helpers/test-data'

test.describe('投稿閲覧', () => {
  let authHelper: AuthHelper
  let postHelper: PostHelper
  let postId: string

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)
    postHelper = new PostHelper(page)

    // テスト用ユーザーで登録してログイン
    const user = generateRandomUser()
    await registerAndLoginTestUser(page, {
      email: user.email,
      password: user.password,
      userName: user.username,
      skinType: user.skinType,
    })
    postId = await postHelper.createPost(testPosts.samplePost)
  })

  test('投稿詳細が正しく表示される', async ({ page }) => {
    await postHelper.viewPost(postId)

    // 投稿の基本情報を確認
    await postHelper.expectPostToBeVisible(testPosts.samplePost.title)
    await postHelper.expectPostContent(testPosts.samplePost.content)

    // メタ情報を確認
    await expect(page.locator('[data-testid="post-category"]')).toContainText('クリーム')
    await expect(page.locator('[data-testid="post-author"]')).toBeVisible()
    await expect(page.locator('[data-testid="post-date"]')).toBeVisible()

    // カテゴリを確認（タグは削除されたため、スキップ）
  })

  test('投稿編集権限のテスト', async ({ page }) => {
    await postHelper.viewPost(postId)

    // 投稿者は編集ボタンが表示される
    await expect(page.locator('[data-testid="edit-post-button"]')).toBeVisible()

    // 別のユーザーでログインして編集ボタンが表示されないことを確認
    await authHelper.logout()
    const anotherUser = generateRandomUser()
    await authHelper.register(anotherUser)

    await postHelper.viewPost(postId)
    await expect(page.locator('[data-testid="edit-post-button"]')).not.toBeVisible()
  })

  test('投稿削除機能', async ({ page }) => {
    await postHelper.viewPost(postId)

    // 削除ボタンをクリック（post-menu-buttonはすでに削除ボタンそのもの）
    await page.click('[data-testid="post-menu-button"]')

    // 確認ダイアログが表示される
    await expect(page.locator('[data-testid="delete-confirmation"]')).toBeVisible()

    // 削除を実行
    await page.click('[data-testid="confirm-delete-button"]')

    // 投稿一覧ページにリダイレクトされる
    await expect(page).toHaveURL('/posts')
  })
})
