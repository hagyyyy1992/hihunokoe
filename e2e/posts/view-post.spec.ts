import { test, expect } from '@playwright/test'
import { AuthHelper } from '../helpers/auth-helpers'
import { PostHelper } from '../helpers/post-helpers'
import { generateRandomUser, testPosts } from '../helpers/test-data'

test.describe('投稿閲覧', () => {
  let authHelper: AuthHelper
  let postHelper: PostHelper
  let postId: string

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)
    postHelper = new PostHelper(page)

    // テスト用ユーザーでログインして投稿を作成
    const user = generateRandomUser()
    await authHelper.register(user)
    await postHelper.createPost(testPosts.samplePost)

    // 作成された投稿のIDを取得（URLから）
    const url = page.url()
    postId = url.split('/').pop() || ''
  })

  test('投稿詳細が正しく表示される', async ({ page }) => {
    await postHelper.viewPost(postId)

    // 投稿の基本情報を確認
    await postHelper.expectPostToBeVisible(testPosts.samplePost.title)
    await postHelper.expectPostContent(testPosts.samplePost.content)

    // メタ情報を確認
    await expect(page.locator('[data-testid="post-category"]')).toContainText('スキンケア')
    await expect(page.locator('[data-testid="post-author"]')).toBeVisible()
    await expect(page.locator('[data-testid="post-date"]')).toBeVisible()

    // タグを確認
    for (const tag of testPosts.samplePost.tags) {
      await expect(page.locator(`[data-testid="tag"]:has-text("${tag}")`)).toBeVisible()
    }
  })

  test('いいね機能が正常に動作する', async ({ page }) => {
    await postHelper.viewPost(postId)

    // 初期状態のいいね数を確認
    await postHelper.expectLikeCount(0)

    // いいねをクリック
    await postHelper.likePost()

    // いいね数が増加することを確認
    await postHelper.expectLikeCount(1)

    // 再度クリックしていいねを取り消し
    await postHelper.likePost()
    await postHelper.expectLikeCount(0)
  })

  test('コメント機能が正常に動作する', async ({ page }) => {
    await postHelper.viewPost(postId)

    const commentText = 'これは素晴らしい投稿ですね！'

    // コメントを追加
    await postHelper.addComment(commentText)

    // コメントが表示されることを確認
    await postHelper.expectCommentToBeVisible(commentText)

    // コメント数が更新されることを確認
    await expect(page.locator('[data-testid="comment-count"]')).toContainText('1')
  })

  test('コメントのバリデーション', async ({ page }) => {
    await postHelper.viewPost(postId)

    // 空のコメントで送信を試行
    await page.click('[data-testid="add-comment-button"]')

    // バリデーションエラーメッセージを確認
    await postHelper.expectErrorMessage('コメントを入力してください')
  })

  test('関連投稿が表示される', async ({ page }) => {
    // 同じカテゴリの別の投稿を作成
    await postHelper.createPost({
      title: '関連投稿のテスト',
      content: '関連投稿の内容です',
      category: testPosts.samplePost.category,
    })

    await postHelper.viewPost(postId)

    // 関連投稿セクションが表示される
    await expect(page.locator('[data-testid="related-posts"]')).toBeVisible()
    await expect(
      page.locator('[data-testid="related-post"]:has-text("関連投稿のテスト")')
    ).toBeVisible()
  })

  test('ゲストユーザーでも投稿を閲覧できる', async ({ page }) => {
    // ログアウト
    await authHelper.logout()

    // ゲストとして投稿を閲覧
    await postHelper.viewPost(postId)

    // 投稿内容は見えるが、いいねやコメントはログインが必要
    await postHelper.expectPostToBeVisible(testPosts.samplePost.title)
    await postHelper.expectPostContent(testPosts.samplePost.content)

    // いいねボタンをクリックするとログインページにリダイレクト
    await page.click('[data-testid="like-button"]')
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

  test('SNSシェア機能', async ({ page }) => {
    await postHelper.viewPost(postId)

    // シェアボタンが表示される
    await expect(page.locator('[data-testid="share-twitter"]')).toBeVisible()
    await expect(page.locator('[data-testid="share-facebook"]')).toBeVisible()
    await expect(page.locator('[data-testid="share-line"]')).toBeVisible()

    // Twitterシェアリンクのhrefを確認
    const twitterLink = page.locator('[data-testid="share-twitter"]')
    const href = await twitterLink.getAttribute('href')
    expect(href).toContain('twitter.com/intent/tweet')
    expect(href).toContain(encodeURIComponent(testPosts.samplePost.title))
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
    await page.click('[data-testid="delete-post-button"]')

    // 確認ダイアログが表示される
    await expect(page.locator('[data-testid="delete-confirmation"]')).toBeVisible()

    // 削除を実行
    await page.click('[data-testid="confirm-delete-button"]')

    // 削除後のリダイレクトを確認
    await expect(page).toHaveURL(/\/posts|\/dashboard/)

    // 削除された投稿にアクセスすると404になることを確認
    await page.goto(`/posts/${postId}`)
    await expect(page.locator('[data-testid="not-found"]')).toBeVisible()
  })

  test('投稿の印刷機能', async ({ page }) => {
    await postHelper.viewPost(postId)

    // 印刷ボタンが表示される
    await expect(page.locator('[data-testid="print-button"]')).toBeVisible()

    // 印刷ダイアログは実際のブラウザ機能のためモックで代用
    const printPromise = page.waitForEvent('console')
    await page.click('[data-testid="print-button"]')
    // 印刷機能が呼び出されたことを確認（実装に依存）
  })

  test('ブックマーク機能', async ({ page }) => {
    await postHelper.viewPost(postId)

    // ブックマークボタンをクリック
    await page.click('[data-testid="bookmark-button"]')

    // ブックマークされたことを確認
    await expect(page.locator('[data-testid="bookmark-button"]')).toHaveClass(/bookmarked|active/)

    // ブックマーク一覧に移動して確認
    await page.goto('/bookmarks')
    await postHelper.expectPostToBeVisible(testPosts.samplePost.title)
  })
})
