import { test, expect } from '@playwright/test'
import { registerAndLoginTestUser } from '@e2e/helpers/auth-helpers'
import { PostHelper } from '@e2e/helpers/post-helpers'
import { generateRandomUser, testPosts } from '@e2e/helpers/test-data'

test.describe('投稿作成', () => {
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
  })

  test('正常な投稿作成ができる', async ({ page }) => {
    await postHelper.createPost(testPosts.samplePost)

    // 投稿作成成功を確認 - URLが投稿詳細ページに遷移したことを確認
    await expect(page).toHaveURL(/\/posts\/[a-zA-Z0-9_-]+/)

    // 投稿のタイトルが表示されていることを確認
    await postHelper.expectPostToBeVisible(testPosts.samplePost.title)

    // 投稿内容を確認
    await postHelper.expectPostToBeVisible(testPosts.samplePost.title)
    await postHelper.expectPostContent(testPosts.samplePost.content)
  })

  test('必須フィールドのバリデーション', async ({ page }) => {
    await page.goto('/posts/new')

    // 空のフォームで次へボタンをクリックしてバリデーションを確認
    const nextButton = page.getByRole('button', { name: '次へ' })

    // 必須フィールドが空の場合、次へボタンが無効化されていることを確認
    await expect(nextButton).toBeDisabled()

    // タイトルだけ入力した場合
    await page.fill('[data-testid="post-title-input"]', 'テストタイトル')
    await expect(nextButton).toBeDisabled()

    // コスメ名も入力した場合
    await page.fill('[name="cosmeticName"]', 'テストコスメ')
    await expect(nextButton).toBeDisabled()

    // 内容も入力した場合、次へボタンが有効になる
    await page.fill('[data-testid="post-content-textarea"]', 'テスト内容')
    await expect(nextButton).toBeEnabled()
  })

  test.skip('タイトルの文字数制限', async ({ page }) => {
    await page.goto('/posts/new')

    const longTitle = 'あ'.repeat(101) // 100文字を超える

    // 長いタイトルを入力
    await page.fill('[data-testid="post-title-input"]', longTitle)
    await page.fill('[name="cosmeticName"]', 'テストコスメ')
    await page.fill('[data-testid="post-content-textarea"]', testPosts.samplePost.content)

    // 最後のステップまで進む
    for (let i = 1; i < 4; i++) {
      const nextButton = page.getByRole('button', { name: '次へ' })
      await nextButton.click()
      await page.waitForTimeout(500)
    }

    // 投稿を試行
    await page.click('[data-testid="publish-button"]')

    // エラーメッセージを確認（実装に応じて調整が必要）
    await expect(page.locator('.alert-error')).toBeVisible()
  })

  test.skip('下書き保存機能', async ({ page }) => {
    // ステップ形式のフォームでは下書き保存機能が異なるため、一旦スキップ
    await postHelper.saveDraft({
      title: 'ドラフトのテスト',
      content: 'これは下書きの内容です',
      cosmeticName: 'テストセラム',
      cosmeticCategory: 'serum',
    })

    await postHelper.expectSuccessMessage('下書きが保存されました')

    // 下書き一覧に移動
    await page.goto('/posts/drafts')
    await postHelper.expectPostToBeVisible('ドラフトのテスト')
  })

  test('カテゴリ選択が正常に動作する', async ({ page }) => {
    await page.goto('/posts/new')

    const categorySelect = page.locator('[data-testid="category-select"]')

    // 各カテゴリオプションが存在することを確認
    await expect(categorySelect.locator('option[value="toner"]')).toContainText('化粧水')
    await expect(categorySelect.locator('option[value="serum"]')).toContainText('美容液')
    await expect(categorySelect.locator('option[value="cream"]')).toContainText('クリーム')
    await expect(categorySelect.locator('option[value="foundation"]')).toContainText(
      'ファンデーション'
    )
    await expect(categorySelect.locator('option[value="lipstick"]')).toContainText('リップ')

    // カテゴリを選択
    await categorySelect.selectOption('foundation')
    await expect(categorySelect).toHaveValue('foundation')
  })

  test('ムード選択が正常に動作する', async ({ page }) => {
    await page.goto('/posts/new')

    // 必須フィールドを入力
    await page.fill('[data-testid="post-title-input"]', 'テストタイトル')
    await page.fill('[name="cosmeticName"]', 'テストコスメ')
    await page.fill('[data-testid="post-content-textarea"]', 'テスト内容')

    // ステップ4まで進む
    for (let i = 1; i < 4; i++) {
      const nextButton = page.getByRole('button', { name: '次へ' })
      await nextButton.click()
      await page.waitForTimeout(500)
    }

    const moodSelect = page.locator('[name="moodTag"]')

    // 各ムードオプションが存在することを確認
    await expect(moodSelect.locator('option[value="disappointed"]')).toContainText('ちょっと残念')
    await expect(moodSelect.locator('option[value="okay"]')).toContainText('まあまあ')
    await expect(moodSelect.locator('option[value="good"]')).toContainText('良かった')
    await expect(moodSelect.locator('option[value="love"]')).toContainText('また使いたい')
    await expect(moodSelect.locator('option[value="perfect"]')).toContainText('完璧')

    // ムードを選択
    await moodSelect.selectOption('good')
    await expect(moodSelect).toHaveValue('good')
  })

  test.skip('タグ追加機能', async ({ page }) => {
    // 現在のUIにはタグ機能が実装されていないため、スキップ
    await page.goto('/posts/new')

    const tagsInput = page.locator('[data-testid="tags-input"]')

    // タグを追加
    await tagsInput.fill('スキンケア')
    await tagsInput.press('Enter')

    await tagsInput.fill('保湿')
    await tagsInput.press('Enter')

    // 追加されたタグを確認
    await expect(page.locator('[data-testid="tag"]:has-text("スキンケア")')).toBeVisible()
    await expect(page.locator('[data-testid="tag"]:has-text("保湿")')).toBeVisible()
  })

  test.skip('タグ削除機能', async ({ page }) => {
    // 現在のUIにはタグ機能が実装されていないため、スキップ
    await page.goto('/posts/new')

    const tagsInput = page.locator('[data-testid="tags-input"]')

    // タグを追加
    await tagsInput.fill('テストタグ')
    await tagsInput.press('Enter')

    // タグが追加されたことを確認
    await expect(page.locator('[data-testid="tag"]:has-text("テストタグ")')).toBeVisible()

    // タグを削除
    await page.click('[data-testid="tag"]:has-text("テストタグ") [data-testid="remove-tag"]')

    // タグが削除されたことを確認
    await expect(page.locator('[data-testid="tag"]:has-text("テストタグ")')).not.toBeVisible()
  })

  test.skip('プレビュー機能', async ({ page }) => {
    // ステップ形式のフォームではプレビュー機能が異なるため、スキップ
    await page.goto('/posts/new')

    await page.fill('[data-testid="post-title-input"]', testPosts.samplePost.title)
    await page.fill('[data-testid="post-content-textarea"]', testPosts.samplePost.content)

    // プレビューボタンをクリック
    await page.click('[data-testid="preview-button"]')

    // プレビューモードでの表示を確認
    await expect(page.locator('[data-testid="preview-title"]')).toContainText(
      testPosts.samplePost.title
    )
    await expect(page.locator('[data-testid="preview-content"]')).toContainText(
      testPosts.samplePost.content
    )

    // 編集モードに戻る
    await page.click('[data-testid="edit-button"]')
    await expect(page.locator('[data-testid="post-title-input"]')).toBeVisible()
  })

  test.skip('文字数カウンター', async ({ page }) => {
    // 現在のUIには文字数カウンターが実装されていないため、スキップ
    await page.goto('/posts/new')

    const titleInput = page.locator('[data-testid="post-title-input"]')
    const contentTextarea = page.locator('[data-testid="post-content-textarea"]')

    // タイトルの文字数カウンター
    await titleInput.fill('テストタイトル')
    await expect(page.locator('[data-testid="title-counter"]')).toContainText('7/100')

    // 内容の文字数カウンター
    await contentTextarea.fill('テスト内容です')
    await expect(page.locator('[data-testid="content-counter"]')).toContainText('7/10000')
  })

  test.skip('自動保存機能', async ({ page }) => {
    // 現在のUIには自動保存機能が実装されていないため、スキップ
    await page.goto('/posts/new')

    await page.fill('[data-testid="post-title-input"]', 'テスト自動保存')
    await page.fill('[data-testid="post-content-textarea"]', 'これは自動保存のテストです')

    // 少し待機して自動保存をトリガー
    await page.waitForTimeout(3000)

    // 自動保存のメッセージを確認
    await expect(page.locator('[data-testid="autosave-status"]')).toContainText('自動保存済み')

    // ページをリロードして内容が復元されることを確認
    await page.reload()
    await expect(page.locator('[data-testid="post-title-input"]')).toHaveValue('テスト自動保存')
    await expect(page.locator('[data-testid="post-content-textarea"]')).toHaveValue(
      'これは自動保存のテストです'
    )
  })
})
