import { test, expect } from '@playwright/test'
import { registerAndLoginTestUser } from '../helpers/auth-helpers'
import { categoryLabels } from '../../src/lib/constants/categories'

test.describe('投稿カテゴリの検証', () => {
  test.beforeEach(async ({ page }) => {
    // 一意なテストユーザーを作成してログイン
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const testUser = {
      userName: `test-category-${timestamp}-${randomSuffix}`,
      email: `test-category-${timestamp}-${randomSuffix}@example.com`,
      password: 'Password123!',
    }
    await registerAndLoginTestUser(page, testUser)

    // 認証確認のため投稿一覧ページに移動してからテストを開始
    await page.goto('/posts')
    await page.waitForTimeout(1000)
  })

  // デバッグ用のテストを追加
  test('投稿作成フローのデバッグ', async ({ page }) => {
    console.log('Starting post creation debug test')

    await page.goto('/posts/new')
    console.log('Navigated to /posts/new')

    // ステップ1: 基本情報を入力
    await page.fill('[data-testid="post-title-input"]', 'デバッグテスト投稿')
    console.log('Filled title')

    await page.fill('[name="cosmeticName"]', 'デバッグコスメ')
    console.log('Filled cosmetic name')

    await page.selectOption('[data-testid="category-select"]', 'skincare')
    console.log('Selected category')

    await page.fill(
      '[name="content"]',
      'これはデバッグ用のテスト投稿です。投稿が正常に作成されるかを確認しています。とても詳しい体験談を書いています。長い文章でバリデーションを通過させます。'
    )
    console.log('Filled content')

    // ボタンの状態を確認
    const nextButton = page.locator('button:has-text("次へ")')
    const isDisabled = await nextButton.isDisabled()
    console.log('Next button disabled:', isDisabled)

    if (!isDisabled) {
      console.log('Clicking next button for step 2')
      await nextButton.click()
      await page.waitForTimeout(1000)

      console.log('Clicking next button for step 3')
      await page.click('button:has-text("次へ")')
      await page.waitForTimeout(1000)

      console.log('Clicking next button for step 4')
      await page.click('button:has-text("次へ")')
      await page.waitForTimeout(1000)

      // 投稿ボタンの状態を確認
      const publishButton = page.locator('[data-testid="publish-button"]')
      const publishDisabled = await publishButton.isDisabled()
      console.log('Publish button disabled:', publishDisabled)

      if (!publishDisabled) {
        console.log('Clicking publish button')
        await publishButton.click()

        // URLの変化を待つ
        await page.waitForTimeout(3000)
        const currentUrl = page.url()
        console.log('Current URL after publish:', currentUrl)

        // 投稿一覧に移動
        await page.goto('/posts')
        await page.waitForTimeout(2000)

        // 投稿カードが存在するかチェック
        const postCards = await page.locator('[data-testid="post-card"]').count()
        console.log('Number of post cards found:', postCards)

        if (postCards > 0) {
          const firstCardText = await page
            .locator('[data-testid="post-card"]')
            .first()
            .textContent()
          console.log('First post card text:', firstCardText)
        }

        // デバッグテスト投稿が見つかるかチェック
        const debugPost = page
          .locator('[data-testid="post-card"]')
          .filter({ hasText: 'デバッグテスト投稿' })
        const debugPostExists = (await debugPost.count()) > 0
        console.log('Debug post exists:', debugPostExists)

        if (debugPostExists) {
          console.log('Debug post found successfully!')
        } else {
          console.log('Debug post not found in the list')
        }
      } else {
        console.log('Publish button is disabled, cannot proceed')
      }
    } else {
      console.log('Next button is disabled, form validation failed')
    }
  })

  test('全てのカテゴリオプションが投稿フォームに存在する', async ({ page }) => {
    await page.goto('/posts/new')
    await page.waitForSelector('[data-testid="category-select"]')

    // カテゴリセレクトボックスのオプションを取得
    const options = await page.$$eval('[data-testid="category-select"] option', els =>
      els.map(el => ({
        value: (el as HTMLOptionElement).value,
        text: el.textContent?.trim() || '',
      }))
    )

    // 最初のオプションは「選択してください」
    expect(options[0]).toEqual({ value: '', text: '選択してください' })

    // 残りのオプションを確認（PostFormのハードコードされた順序）
    const expectedOptions = [
      { value: 'skincare', text: 'スキンケア' },
      { value: 'toner', text: '化粧水' },
      { value: 'serum', text: '美容液' },
      { value: 'emulsion', text: '乳液' },
      { value: 'cream', text: 'クリーム' },
      { value: 'cleanser', text: '洗顔' },
      { value: 'foundation', text: 'ファンデーション' },
      { value: 'concealer', text: 'コンシーラー' },
      { value: 'powder', text: 'フェイスパウダー' },
      { value: 'eyeshadow', text: 'アイシャドウ' },
      { value: 'lipstick', text: 'リップ' },
      { value: 'sunscreen', text: '日焼け止め' },
      { value: 'other', text: 'その他' },
    ]

    // オプションの数が一致することを確認
    expect(options.slice(1)).toHaveLength(expectedOptions.length)

    // 各オプションが存在することを確認
    expectedOptions.forEach(expected => {
      const found = options.find(opt => opt.value === expected.value)
      expect(found).toBeDefined()
      expect(found?.text).toBe(expected.text)
    })
  })

  test('スキンケアカテゴリが正しく表示される', async ({ page }) => {
    await page.goto('/posts/new')

    // ステップ1: 基本情報を入力
    await page.fill('[data-testid="post-title-input"]', 'スキンケアカテゴリテスト')
    await page.fill('[name="cosmeticName"]', 'テストコスメ')
    await page.selectOption('[data-testid="category-select"]', 'skincare')
    await page.fill('[name="content"]', 'スキンケアカテゴリのテスト投稿です')

    // ステップ2へ進む
    await page.click('button:has-text("次へ")')
    await page.waitForTimeout(500)

    // ステップ3へ進む
    await page.click('button:has-text("次へ")')
    await page.waitForTimeout(500)

    // ステップ4へ進む
    await page.click('button:has-text("次へ")')
    await page.waitForTimeout(500)

    // 投稿を作成
    await page.click('[data-testid="publish-button"]')
    await page.waitForURL('/posts/**')

    // 投稿が作成されたことを確認
    const postCard = page.locator('[data-testid="post-card"]').filter({
      hasText: 'スキンケアカテゴリテスト',
    })
    await expect(postCard).toBeVisible()

    // カテゴリタグが表示されることを確認
    const categoryTag = postCard.locator('text=スキンケア')
    await expect(categoryTag).toBeVisible()

    // スキンケアカテゴリは緑色で表示される
    await expect(categoryTag).toHaveClass(/bg-green-100/)
    await expect(categoryTag).toHaveClass(/text-green-800/)
  })

  test('各カテゴリで投稿を作成できる', async ({ page }) => {
    const categoriesToTest = [
      { value: 'toner', label: '化粧水', isSkincareCategory: true },
      { value: 'foundation', label: 'ファンデーション', isSkincareCategory: false },
      { value: 'lipstick', label: 'リップ', isSkincareCategory: false },
    ]

    for (const category of categoriesToTest) {
      await page.goto('/posts/new')

      const title = `${category.label}テスト投稿 ${Date.now()}`

      // ステップ1: 基本情報を入力
      await page.fill('[data-testid="post-title-input"]', title)
      await page.fill('[name="cosmeticName"]', `${category.label}製品`)
      await page.selectOption('[data-testid="category-select"]', category.value)
      await page.fill('[name="content"]', `${category.label}カテゴリのテスト投稿です`)

      // ステップ2へ進む
      await page.click('button:has-text("次へ")')
      await page.waitForTimeout(500)

      // ステップ3へ進む
      await page.click('button:has-text("次へ")')
      await page.waitForTimeout(500)

      // ステップ4へ進む
      await page.click('button:has-text("次へ")')
      await page.waitForTimeout(500)

      // 投稿を作成
      await page.click('[data-testid="publish-button"]')
      await page.waitForURL('/posts/**')

      // 投稿が作成されたことを確認
      const postCard = page
        .locator('[data-testid="post-card"]')
        .filter({
          hasText: title,
        })
        .first()
      await expect(postCard).toBeVisible()

      // カテゴリタグが表示されることを確認
      const categoryTag = postCard.locator(`text=${category.label}`)
      await expect(categoryTag).toBeVisible()

      // カテゴリによって色が異なることを確認
      if (category.isSkincareCategory) {
        await expect(categoryTag).toHaveClass(/bg-green-100/)
        await expect(categoryTag).toHaveClass(/text-green-800/)
      } else {
        await expect(categoryTag).toHaveClass(/bg-blue-100/)
        await expect(categoryTag).toHaveClass(/text-blue-800/)
      }
    }
  })

  test('投稿詳細ページでカテゴリが正しく表示される', async ({ page }) => {
    await page.goto('/posts/new')

    const title = `詳細ページカテゴリテスト ${Date.now()}`

    // ステップ1: 基本情報を入力
    await page.fill('[data-testid="post-title-input"]', title)
    await page.fill('[name="cosmeticName"]', 'テストコスメ')
    await page.selectOption('[data-testid="category-select"]', 'skincare')
    await page.fill('[name="content"]', 'カテゴリ表示テスト')

    // ステップ2へ進む
    await page.click('button:has-text("次へ")')
    await page.waitForTimeout(500)

    // ステップ3へ進む
    await page.click('button:has-text("次へ")')
    await page.waitForTimeout(500)

    // ステップ4へ進む
    await page.click('button:has-text("次へ")')
    await page.waitForTimeout(500)

    // 投稿を作成
    await page.click('[data-testid="publish-button"]')
    await page.waitForURL('/posts/**')

    // 作成した投稿をクリック
    await page.locator('[data-testid="post-card"]').filter({ hasText: title }).click()
    await page.waitForSelector('[data-testid="post-title"]')

    // 詳細ページでカテゴリが表示されることを確認
    const categoryTag = page
      .locator('[data-testid="post-category"]')
      .filter({ hasText: 'スキンケア' })
    await expect(categoryTag).toBeVisible()
    await expect(categoryTag).toHaveClass(/bg-green-100/)
    await expect(categoryTag).toHaveClass(/text-green-800/)
  })
})
