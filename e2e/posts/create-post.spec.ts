import { test, expect } from '@playwright/test'
import { registerAndLoginTestUser } from '@e2e/helpers/auth-helpers'
import { PostHelper } from '@e2e/helpers/post-helpers'
import { generateRandomUser, testPosts } from '@e2e/helpers/test-data'

test.describe('投稿作成', () => {
  test.setTimeout(120000) // 2分に延長
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
    // 認証状態が完全に確立されるまで追加待機
    await page.waitForTimeout(2000)

    await postHelper.createPost(testPosts.samplePost)

    // 投稿作成成功を確認 - URLが投稿詳細ページに遷移したことを確認
    await expect(page).toHaveURL(/\/posts\/[a-zA-Z0-9_-]+/)

    // 投稿のタイトルが表示されていることを確認
    await postHelper.expectPostToBeVisible(testPosts.samplePost.title)

    // 投稿内容を確認
    await postHelper.expectPostToBeVisible(testPosts.samplePost.title)
    await postHelper.expectPostContent(testPosts.samplePost.content)
  })

  test('必須フィールドのバリデーション', async ({ page, browserName }) => {
    // WebKit (Safari) およびMobile Chrome環境では投稿フォームのバリデーションが不安定なため、スキップ
    const viewport = page.viewportSize()
    if (
      browserName === 'webkit' ||
      (browserName === 'chromium' && viewport?.width && viewport.width <= 768)
    ) {
      test.skip()
      return
    }

    // 認証状態の確立を待つ（簡略化）
    await page.waitForTimeout(2000)

    await page.goto('/posts/new')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000) // ページの初期化を待機

    // リダイレクトされていないことを確認
    const currentUrl = page.url()
    if (currentUrl.includes('/auth/login')) {
      throw new Error('Redirected to login page during test')
    }

    // フォームが表示されるまで待機
    await page.waitForSelector('input[name="title"]', { state: 'visible' })

    // 空のフォームで次へボタンをクリックしてバリデーションを確認
    const nextButton = page.getByRole('button', { name: '次へ' })

    // 必須フィールドが空の場合、次へボタンが無効化されていることを確認
    await expect(nextButton).toBeDisabled()

    // タイトルだけ入力した場合
    await page.locator('input[name="title"]').fill('テストタイトル')
    await expect(nextButton).toBeDisabled()

    // コスメ名も入力した場合
    await page.locator('input[name="cosmeticName"]').fill('テストコスメ')
    await expect(nextButton).toBeDisabled()

    // 内容も入力した場合、まだ無効
    await page.locator('textarea[name="content"]').fill('テスト内容')
    await expect(nextButton).toBeDisabled()

    // カテゴリを選択して全ての必須項目を入力
    await page.locator('select[name="cosmeticCategory"]').selectOption('toner')

    // 少し待機してからボタンの状態を確認
    await page.waitForTimeout(1000)
    await expect(nextButton).toBeEnabled()
  })

  test('カテゴリ選択が正常に動作する', async ({ page }) => {
    // 認証状態の確立を待つ（簡略化）
    await page.waitForTimeout(2000)

    await page.goto('/posts/new')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000) // ページの初期化を待機

    // リダイレクトされていないことを確認
    const currentUrl = page.url()
    if (currentUrl.includes('/auth/login')) {
      throw new Error('Redirected to login page during test')
    }

    // フォームが表示されるまで待機
    await page.waitForSelector('select[name="cosmeticCategory"]', { state: 'visible' })

    const categorySelect = page.locator('select[name="cosmeticCategory"]')

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

  test('ムード選択が正常に動作する', async ({ page, browserName }) => {
    // WebKit (Safari) およびMobile Chrome環境ではステップフォームナビゲーションが不安定なため、スキップ
    const viewport = page.viewportSize()
    if (
      browserName === 'webkit' ||
      browserName === 'firefox' ||
      (browserName === 'chromium' && viewport?.width && viewport.width <= 768)
    ) {
      test.skip()
      return
    }

    // 認証状態の確立を待つ（簡略化）
    await page.waitForTimeout(2000)

    await page.goto('/posts/new')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000) // ページの初期化を待機

    // リダイレクトされていないことを確認
    const currentUrl = page.url()
    if (currentUrl.includes('/auth/login')) {
      throw new Error('Redirected to login page during test')
    }

    // フォームが表示されるまで待機
    await page.waitForSelector('input[name="title"]', { state: 'visible' })

    // 必須フィールドを入力
    await page.locator('input[name="title"]').fill('テストタイトル')
    await page.locator('input[name="cosmeticName"]').fill('テストコスメ')
    await page.locator('textarea[name="content"]').fill('テスト内容')
    await page.locator('select[name="cosmeticCategory"]').selectOption('toner')

    // ステップ1のバリデーションが通るまで待機
    const nextButton = page.getByRole('button', { name: '次へ' })
    await nextButton.waitFor({ state: 'visible' })

    // バリデーションが通るまで待機（文字数制限チェックがある）
    await expect(nextButton).toBeEnabled({ timeout: 5000 })

    // ステップ4まで進む
    for (let i = 1; i < 4; i++) {
      await nextButton.click()
      await page.waitForTimeout(1000)

      // 次のステップの「次へ」ボタンを取得（ステップ2、3、4で変わる可能性がある）
      const currentStepButton = page.getByRole('button', { name: '次へ' })
      if (i < 3) {
        // ステップ4では「次へ」ボタンはない
        await currentStepButton.waitFor({ state: 'visible' })
        await expect(currentStepButton).toBeEnabled({ timeout: 5000 })
      }
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
})
