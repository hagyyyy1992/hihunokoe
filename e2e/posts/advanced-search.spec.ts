import { test, expect } from '@playwright/test'
import { AuthHelper } from '../helpers/auth-helpers'
import { PostHelper } from '../helpers/post-helpers'
import { COSMETIC_CATEGORIES, SKIN_TYPES, MOOD_TAGS } from '../helpers/test-data'

test.describe('検索・フィルタリング機能', () => {
  let authHelper: AuthHelper
  let postHelper: PostHelper

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)
    postHelper = new PostHelper(page)
  })

  test('テキスト検索機能', async ({ page }) => {
    // ログインして複数の投稿を作成
    await authHelper.registerAndLogin()

    const posts = [
      {
        title: '乾燥肌におすすめの化粧水',
        content: '乾燥肌に効果的な化粧水です',
        cosmeticName: 'うるおい化粧水',
        cosmeticCategory: COSMETIC_CATEGORIES.toner,
        skinType: 'dry',
        moodTag: 'good',
      },
      {
        title: '敏感肌向けクレンジング',
        content: '敏感肌でも安心して使えるクレンジングです',
        cosmeticName: 'やさしいクレンジング',
        cosmeticCategory: COSMETIC_CATEGORIES.cleanser,
        skinType: 'sensitive',
        moodTag: 'love',
      },
      {
        title: 'オイリー肌のファンデーション',
        content: 'オイリー肌に最適なファンデーションです',
        cosmeticName: 'マット仕上げファンデ',
        cosmeticCategory: COSMETIC_CATEGORIES.foundation,
        skinType: 'oily',
        moodTag: 'okay',
      },
    ]

    for (const post of posts) {
      await postHelper.createPost(post)
    }

    // 投稿一覧ページに移動
    await page.goto('/posts')

    // 検索フィールドが表示されることを確認
    await expect(page.locator('input[placeholder="コスメ名や体験談で検索"]')).toBeVisible()

    // タイトルで検索
    await page.locator('input[placeholder="コスメ名や体験談で検索"]').fill('乾燥肌')
    // onChange イベントで自動的にフィルターが適用されるため、少し待機
    await page.waitForTimeout(1000)

    // 検索結果が表示されることを確認（複数の同じタイトルがある場合を考慮）
    await expect(page.getByText('乾燥肌におすすめの化粧水').first()).toBeVisible()
    await expect(page.getByText('敏感肌向けクレンジング')).not.toBeVisible()
    await expect(page.getByText('オイリー肌のファンデーション')).not.toBeVisible()

    // 検索フィールドをクリア
    await page.locator('input[placeholder="コスメ名や体験談で検索"]').fill('')
    await page.waitForTimeout(1000)

    // 全ての投稿が再表示されることを確認
    await expect(page.getByText('乾燥肌におすすめの化粧水').first()).toBeVisible()
    await expect(page.getByText('敏感肌向けクレンジング').first()).toBeVisible()
    await expect(page.getByText('オイリー肌のファンデーション').first()).toBeVisible()

    // 内容で検索
    await page.locator('input[placeholder="コスメ名や体験談で検索"]').fill('クレンジング')
    await page.waitForTimeout(1000)

    // 検索結果が表示されることを確認
    await expect(page.getByText('敏感肌向けクレンジング').first()).toBeVisible()
    await expect(page.getByText('やさしいクレンジング').first()).toBeVisible()
    await expect(page.getByText('乾燥肌におすすめの化粧水')).not.toBeVisible()

    // 化粧品名で検索
    await page.locator('input[placeholder="コスメ名や体験談で検索"]').fill('ファンデ')
    await page.waitForTimeout(1000)

    // 検索結果が表示されることを確認
    await expect(page.getByText('オイリー肌のファンデーション').first()).toBeVisible()
    await expect(page.getByText('マット仕上げファンデ').first()).toBeVisible()
    await expect(page.getByText('敏感肌向けクレンジング')).not.toBeVisible()
  })

  test('カテゴリフィルタ機能', async ({ page }) => {
    // ログインして複数の投稿を作成
    await authHelper.registerAndLogin()

    const posts = [
      {
        title: '化粧水レビュー',
        content: '化粧水のレビューです',
        cosmeticName: 'テスト化粧水',
        cosmeticCategory: COSMETIC_CATEGORIES.toner,
        skinType: 'normal',
        moodTag: 'good',
      },
      {
        title: 'ファンデーションレビュー',
        content: 'ファンデーションのレビューです',
        cosmeticName: 'テストファンデ',
        cosmeticCategory: COSMETIC_CATEGORIES.foundation,
        skinType: 'dry',
        moodTag: 'love',
      },
      {
        title: '美容液レビュー',
        content: '美容液のレビューです',
        cosmeticName: 'テスト美容液',
        cosmeticCategory: COSMETIC_CATEGORIES.serum,
        skinType: 'combination',
        moodTag: 'okay',
      },
    ]

    for (const post of posts) {
      await postHelper.createPost(post)
    }

    // 投稿一覧ページに移動
    await page.goto('/posts')

    // カテゴリフィルタが表示されることを確認
    await expect(page.locator('[data-testid="category-filter"]')).toBeVisible()

    // 化粧水でフィルタ
    await page.locator('[data-testid="category-filter"]').selectOption('toner')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // フィルタ結果が表示されることを確認
    await expect(page.getByText('化粧水レビュー').first()).toBeVisible()
    await expect(page.getByText('ファンデーションレビュー')).not.toBeVisible()
    await expect(page.getByText('美容液レビュー')).not.toBeVisible()

    // ファンデーションでフィルタ
    await page.locator('[data-testid="category-filter"]').selectOption('foundation')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // フィルタ結果が表示されることを確認
    await expect(page.getByText('ファンデーションレビュー').first()).toBeVisible()
    await expect(page.getByText('化粧水レビュー')).not.toBeVisible()
    await expect(page.getByText('美容液レビュー')).not.toBeVisible()

    // 全てのカテゴリを選択
    await page.locator('[data-testid="category-filter"]').selectOption('')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // 全ての投稿が表示されることを確認
    await expect(page.getByText('化粧水レビュー').first()).toBeVisible()
    await expect(page.getByText('ファンデーションレビュー').first()).toBeVisible()
    await expect(page.getByText('美容液レビュー').first()).toBeVisible()
  })

  test('肌タイプフィルタ機能', async ({ page }) => {
    // ログインして複数の投稿を作成
    await authHelper.registerAndLogin()

    const posts = [
      {
        title: '乾燥肌向けアイテム',
        content: '乾燥肌におすすめです',
        cosmeticName: 'テスト化粧品A',
        cosmeticCategory: COSMETIC_CATEGORIES.toner,
        skinType: 'dry',
        moodTag: 'good',
      },
      {
        title: 'オイリー肌向けアイテム',
        content: 'オイリー肌におすすめです',
        cosmeticName: 'テスト化粧品B',
        cosmeticCategory: COSMETIC_CATEGORIES.cleanser,
        skinType: 'oily',
        moodTag: 'love',
      },
      {
        title: '敏感肌向けアイテム',
        content: '敏感肌におすすめです',
        cosmeticName: 'テスト化粧品C',
        cosmeticCategory: COSMETIC_CATEGORIES.cream,
        skinType: 'sensitive',
        moodTag: 'okay',
      },
    ]

    for (const post of posts) {
      await postHelper.createPost(post)
    }

    // 投稿一覧ページに移動
    await page.goto('/posts')

    // 肌タイプフィルタが表示されることを確認
    const skinTypeSelect = page
      .locator('select')
      .filter({ has: page.locator('option', { hasText: '普通肌' }) })
      .first()
    await expect(skinTypeSelect).toBeVisible()

    // 乾燥肌でフィルタ
    await skinTypeSelect.selectOption('dry')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // フィルタ結果が表示されることを確認
    await expect(page.getByText('乾燥肌向けアイテム').first()).toBeVisible()

    // オイリー肌でフィルタ
    await skinTypeSelect.selectOption('oily')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // フィルタ結果が表示されることを確認
    await expect(page.getByText('オイリー肌向けアイテム').first()).toBeVisible()

    // 全ての肌タイプを選択
    await skinTypeSelect.selectOption('')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // 全ての投稿が表示されることを確認
    await expect(page.getByText('乾燥肌向けアイテム').first()).toBeVisible()
    await expect(page.getByText('オイリー肌向けアイテム').first()).toBeVisible()
    await expect(page.getByText('敏感肌向けアイテム').first()).toBeVisible()
  })

  test('ムードタグフィルタ機能', async ({ page }) => {
    // ログインして複数の投稿を作成
    await authHelper.registerAndLogin()

    const posts = [
      {
        title: '満足度の高い商品',
        content: '満足度の高い商品です',
        cosmeticName: 'テスト化粧品A',
        cosmeticCategory: COSMETIC_CATEGORIES.toner,
        skinType: 'normal',
        moodTag: 'love',
      },
      {
        title: '良い商品',
        content: '良い商品です',
        cosmeticName: 'テスト化粧品B',
        cosmeticCategory: COSMETIC_CATEGORIES.foundation,
        skinType: 'dry',
        moodTag: 'good',
      },
      {
        title: '普通の商品',
        content: '普通の商品です',
        cosmeticName: 'テスト化粧品C',
        cosmeticCategory: COSMETIC_CATEGORIES.cleanser,
        skinType: 'combination',
        moodTag: 'okay',
      },
    ]

    for (const post of posts) {
      await postHelper.createPost(post)
    }

    // 投稿一覧ページに移動
    await page.goto('/posts')

    // ムードタグフィルタが表示されることを確認
    const moodSelect = page
      .locator('select')
      .filter({ has: page.locator('option', { hasText: 'ちょっと残念' }) })
      .first()
    await expect(moodSelect).toBeVisible()

    // また使いたいでフィルタ
    await moodSelect.selectOption('love')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // フィルタ結果が表示されることを確認
    await expect(page.getByText('満足度の高い商品').first()).toBeVisible()

    // 良かったでフィルタ
    await moodSelect.selectOption('good')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // フィルタ結果が表示されることを確認
    await expect(page.getByText('良い商品').first()).toBeVisible()

    // 全てのムードを選択
    await moodSelect.selectOption('')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // 全ての投稿が表示されることを確認
    await expect(page.getByText('満足度の高い商品').first()).toBeVisible()
    await expect(page.getByText('良い商品').first()).toBeVisible()
    await expect(page.getByText('普通の商品').first()).toBeVisible()
  })

  test('複合フィルタ機能', async ({ page }) => {
    // ログインして複数の投稿を作成
    await authHelper.registerAndLogin()

    const posts = [
      {
        title: '乾燥肌向け化粧水（良い）',
        content: '乾燥肌向けの化粧水です',
        cosmeticName: '乾燥肌用化粧水',
        cosmeticCategory: COSMETIC_CATEGORIES.toner,
        skinType: 'dry',
        moodTag: 'good',
      },
      {
        title: '乾燥肌向け化粧水（大満足）',
        content: '乾燥肌向けの化粧水です',
        cosmeticName: '優秀な化粧水',
        cosmeticCategory: COSMETIC_CATEGORIES.toner,
        skinType: 'dry',
        moodTag: 'love',
      },
      {
        title: '乾燥肌向けファンデ（良い）',
        content: '乾燥肌向けのファンデです',
        cosmeticName: '乾燥肌用ファンデ',
        cosmeticCategory: COSMETIC_CATEGORIES.foundation,
        skinType: 'dry',
        moodTag: 'good',
      },
      {
        title: 'オイリー肌向け化粧水（良い）',
        content: 'オイリー肌向けの化粧水です',
        cosmeticName: 'オイリー肌用化粧水',
        cosmeticCategory: COSMETIC_CATEGORIES.toner,
        skinType: 'oily',
        moodTag: 'good',
      },
    ]

    for (const post of posts) {
      await postHelper.createPost(post)
    }

    // 投稿一覧ページに移動
    await page.goto('/posts')

    // 複合フィルタ: 乾燥肌 + 化粧水 + 良い
    const skinTypeSelect = page
      .locator('select')
      .filter({ has: page.locator('option', { hasText: '普通肌' }) })
      .first()
    const moodSelect = page
      .locator('select')
      .filter({ has: page.locator('option', { hasText: 'ちょっと残念' }) })
      .first()

    await skinTypeSelect.selectOption('dry')
    await page.locator('[data-testid="category-filter"]').selectOption('toner')
    await moodSelect.selectOption('good')
    await page.waitForTimeout(500)

    // フィルタ結果が表示されることを確認
    await expect(page.getByText('乾燥肌向け化粧水（良い）').first()).toBeVisible()
    await expect(page.getByText('乾燥肌向け化粧水（大満足）')).not.toBeVisible()
    await expect(page.getByText('乾燥肌向けファンデ（良い）')).not.toBeVisible()
    await expect(page.getByText('オイリー肌向け化粧水（良い）')).not.toBeVisible()

    // 検索テキストと組み合わせ
    await page.locator('input[placeholder="コスメ名や体験談で検索"]').fill('優秀')
    await page.waitForTimeout(1000)

    // 検索結果が表示されないことを確認（フィルタと検索が両方適用）
    await expect(page.getByText('乾燥肌向け化粧水（良い）')).not.toBeVisible()
    await expect(page.getByText('乾燥肌向け化粧水（大満足）')).not.toBeVisible()

    // ムードフィルタを変更
    await moodSelect.selectOption('love')
    await page.waitForTimeout(500)

    // 検索結果が表示されることを確認
    await expect(page.getByText('乾燥肌向け化粧水（大満足）').first()).toBeVisible()
    await expect(page.getByText('乾燥肌向け化粧水（良い）')).not.toBeVisible()
  })

  test('検索結果が見つからない場合の表示', async ({ page }) => {
    // ログインして投稿を作成
    await authHelper.registerAndLogin()
    await postHelper.createPost({
      title: '存在する投稿',
      content: '存在する投稿です',
      cosmeticName: '存在する化粧品',
      cosmeticCategory: 'toner',
      skinType: 'normal',
      moodTag: 'good',
    })

    // 投稿一覧ページに移動
    await page.goto('/posts')

    // 存在しない検索語で検索
    const searchInput = page.locator('input[placeholder="コスメ名や体験談で検索"]')
    await searchInput.fill('存在しない商品')
    await page.waitForTimeout(1000)

    // 検索結果なしのメッセージが表示されることを確認
    await expect(
      page
        .getByText('検索結果が見つかりませんでした')
        .or(page.getByText('該当する投稿が見つかりませんでした'))
        .or(page.getByText('投稿が見つかりませんでした'))
    ).toBeVisible()
  })
})
