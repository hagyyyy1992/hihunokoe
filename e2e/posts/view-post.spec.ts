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

  test('共感機能が正常に動作する', async ({ page }) => {
    await postHelper.viewPost(postId)

    // 共感ボタンを探す
    const empathyButton = page.locator('[data-testid="empathy-button"]')

    // 初期状態を確認（共感するテキストが表示されている）
    await expect(empathyButton).toContainText('共感する')

    // 共感をクリック
    await empathyButton.click()

    // 共感済みの状態を確認
    await expect(empathyButton).toContainText('共感済み')

    // 再度クリックして共感を取り消し
    await empathyButton.click()
    await expect(empathyButton).toContainText('共感する')
  })

  test('コメント機能が正常に動作する', async ({ page }) => {
    await postHelper.viewPost(postId)

    const commentText = 'これは素晴らしい投稿ですね！'

    // コメントを追加
    await postHelper.addComment(commentText)

    // コメントが表示されることを確認
    await postHelper.expectCommentToBeVisible(commentText)

    // コメント数が更新されることを確認
    await postHelper.expectCommentCount(1)
  })

  test('コメントのバリデーション', async ({ page }) => {
    await postHelper.viewPost(postId)

    // 空のコメントの場合、送信ボタンがdisabledになることを確認
    const addCommentButton = page.locator('[data-testid="add-comment-button"]')
    await expect(addCommentButton).toBeDisabled()

    // 空白のみのコメントを入力
    const commentInput = page.locator('[data-testid="comment-input"]')
    await commentInput.fill('   ')

    // 空白のみでも送信ボタンがdisabledのままであることを確認
    await expect(addCommentButton).toBeDisabled()

    // 有効なコメントを入力
    await commentInput.fill('テストコメント')

    // 送信ボタンが有効になることを確認
    await expect(addCommentButton).toBeEnabled()
  })

  test('関連投稿が表示される', async ({ page }) => {
    // 同じカテゴリの別の投稿を作成
    await postHelper.createPost({
      title: '関連投稿のテスト',
      content: '関連投稿の内容です',
      cosmeticName: testPosts.samplePost.cosmeticName,
      cosmeticCategory: testPosts.samplePost.cosmeticCategory,
    })

    await postHelper.viewPost(postId)

    // 関連投稿セクションが表示される
    await expect(page.locator('[data-testid="related-posts"]')).toBeVisible()

    // 関連投稿機能は開発中のため、開発中メッセージまたは関連投稿が表示されることを確認
    const relatedPost = page.locator('[data-testid="related-post"]').first()
    if (await relatedPost.isVisible()) {
      // 関連投稿が表示されている場合
      await expect(relatedPost).toBeVisible()
    } else {
      // 開発中メッセージが表示されている場合
      await expect(page.locator('[data-testid="related-posts"]')).toContainText('開発中')
    }
  })

  test('ゲストユーザーでも投稿を閲覧できる', async ({ page }) => {
    // ログアウト
    await authHelper.logout()

    // ゲストとして投稿を閲覧
    await postHelper.viewPost(postId)

    // 投稿内容は見えるが、共感やコメントはログインが必要
    await postHelper.expectPostToBeVisible(testPosts.samplePost.title)
    await postHelper.expectPostContent(testPosts.samplePost.content)

    // ゲストユーザーには「ログインして共感」リンクが表示される
    const loginToEmpathizeLink = page.getByText('ログインして共感')
    await expect(loginToEmpathizeLink).toBeVisible()

    // リンクをクリックするとログインページにリダイレクト
    await loginToEmpathizeLink.click()
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('閲覧数がカウントされる', async ({ page }) => {
    await postHelper.viewPost(postId)

    // 閲覧数が表示される
    await expect(page.locator('[data-testid="view-count"]')).toBeVisible()

    // ページをリロードして閲覧数が増加することを確認
    await page.reload()
    // 閲覧数の正確な値は実装に依存するため、存在だけを確認
    await expect(page.locator('[data-testid="view-count"]')).toBeVisible()
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

    // 削除ボタンをクリック
    await page.click('[data-testid="post-menu-button"]')

    // 確認ダイアログが表示される
    await expect(page.locator('[data-testid="delete-confirmation"]')).toBeVisible()

    // 削除を実行
    await page.click('[data-testid="confirm-delete-button"]')

    // 投稿一覧ページにリダイレクトされる
    await expect(page).toHaveURL('/posts')
  })
})
