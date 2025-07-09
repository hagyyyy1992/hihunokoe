import { test, expect } from '@playwright/test'
import { AuthHelper } from '../helpers/auth-helpers'
import { PostHelper } from '../helpers/post-helpers'

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
        cosmeticCategory: 'toner',
        skinType: 'dry',
        moodTag: 'good',
      },
      {
        title: '敏感肌向けクレンジング',
        content: '敏感肌でも安心して使えるクレンジングです',
        cosmeticName: 'やさしいクレンジング',
        cosmeticCategory: 'cleansing',
        skinType: 'sensitive',
        moodTag: 'love',
      },
      {
        title: 'オイリー肌のファンデーション',
        content: 'オイリー肌に最適なファンデーションです',
        cosmeticName: 'マット仕上げファンデ',
        cosmeticCategory: 'foundation',
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
    await expect(page.locator('input[name="search"]')).toBeVisible()

    // タイトルで検索
    await page.locator('input[name="search"]').fill('乾燥肌')
    await page.getByRole('button', { name: '検索' }).click()

    // 検索結果が表示されることを確認
    await expect(page.getByText('乾燥肌におすすめの化粧水')).toBeVisible()
    await expect(page.getByText('敏感肌向けクレンジング')).not.toBeVisible()
    await expect(page.getByText('オイリー肌のファンデーション')).not.toBeVisible()

    // 検索フィールドをクリア
    await page.locator('input[name="search"]').fill('')
    await page.getByRole('button', { name: '検索' }).click()

    // 全ての投稿が再表示されることを確認
    await expect(page.getByText('乾燥肌におすすめの化粧水')).toBeVisible()
    await expect(page.getByText('敏感肌向けクレンジング')).toBeVisible()
    await expect(page.getByText('オイリー肌のファンデーション')).toBeVisible()

    // 内容で検索
    await page.locator('input[name="search"]').fill('クレンジング')
    await page.getByRole('button', { name: '検索' }).click()

    // 検索結果が表示されることを確認
    await expect(page.getByText('敏感肌向けクレンジング')).toBeVisible()
    await expect(page.getByText('やさしいクレンジング')).toBeVisible()
    await expect(page.getByText('乾燥肌におすすめの化粧水')).not.toBeVisible()

    // 化粧品名で検索
    await page.locator('input[name="search"]').fill('ファンデ')
    await page.getByRole('button', { name: '検索' }).click()

    // 検索結果が表示されることを確認
    await expect(page.getByText('オイリー肌のファンデーション')).toBeVisible()
    await expect(page.getByText('マット仕上げファンデ')).toBeVisible()
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
        cosmeticCategory: 'toner',
        skinType: 'normal',
        moodTag: 'good',
      },
      {
        title: 'ファンデーションレビュー',
        content: 'ファンデーションのレビューです',
        cosmeticName: 'テストファンデ',
        cosmeticCategory: 'foundation',
        skinType: 'dry',
        moodTag: 'love',
      },
      {
        title: '美容液レビュー',
        content: '美容液のレビューです',
        cosmeticName: 'テスト美容液',
        cosmeticCategory: 'serum',
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
    await expect(page.locator('select[name="category"]')).toBeVisible()

    // 化粧水でフィルタ
    await page.locator('select[name="category"]').selectOption('toner')

    // フィルタ結果が表示されることを確認
    await expect(page.getByText('化粧水レビュー')).toBeVisible()
    await expect(page.getByText('ファンデーションレビュー')).not.toBeVisible()
    await expect(page.getByText('美容液レビュー')).not.toBeVisible()

    // ファンデーションでフィルタ
    await page.locator('select[name="category"]').selectOption('foundation')

    // フィルタ結果が表示されることを確認
    await expect(page.getByText('ファンデーションレビュー')).toBeVisible()
    await expect(page.getByText('化粧水レビュー')).not.toBeVisible()
    await expect(page.getByText('美容液レビュー')).not.toBeVisible()

    // 全てのカテゴリを選択
    await page.locator('select[name="category"]').selectOption('all')

    // 全ての投稿が表示されることを確認
    await expect(page.getByText('化粧水レビュー')).toBeVisible()
    await expect(page.getByText('ファンデーションレビュー')).toBeVisible()
    await expect(page.getByText('美容液レビュー')).toBeVisible()
  })

  test('肌タイプフィルタ機能', async ({ page }) => {
    // ログインして複数の投稿を作成
    await authHelper.registerAndLogin()

    const posts = [
      {
        title: '乾燥肌向けアイテム',
        content: '乾燥肌におすすめです',
        cosmeticName: 'テスト化粧品A',
        cosmeticCategory: 'toner',
        skinType: 'dry',
        moodTag: 'good',
      },
      {
        title: 'オイリー肌向けアイテム',
        content: 'オイリー肌におすすめです',
        cosmeticName: 'テスト化粧品B',
        cosmeticCategory: 'cleansing',
        skinType: 'oily',
        moodTag: 'love',
      },
      {
        title: '敏感肌向けアイテム',
        content: '敏感肌におすすめです',
        cosmeticName: 'テスト化粧品C',
        cosmeticCategory: 'moisturizer',
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
    await expect(page.locator('select[name="skinType"]')).toBeVisible()

    // 乾燥肌でフィルタ
    await page.locator('select[name="skinType"]').selectOption('dry')

    // フィルタ結果が表示されることを確認
    await expect(page.getByText('乾燥肌向けアイテム')).toBeVisible()
    await expect(page.getByText('オイリー肌向けアイテム')).not.toBeVisible()
    await expect(page.getByText('敏感肌向けアイテム')).not.toBeVisible()

    // オイリー肌でフィルタ
    await page.locator('select[name="skinType"]').selectOption('oily')

    // フィルタ結果が表示されることを確認
    await expect(page.getByText('オイリー肌向けアイテム')).toBeVisible()
    await expect(page.getByText('乾燥肌向けアイテム')).not.toBeVisible()
    await expect(page.getByText('敏感肌向けアイテム')).not.toBeVisible()

    // 全ての肌タイプを選択
    await page.locator('select[name="skinType"]').selectOption('all')

    // 全ての投稿が表示されることを確認
    await expect(page.getByText('乾燥肌向けアイテム')).toBeVisible()
    await expect(page.getByText('オイリー肌向けアイテム')).toBeVisible()
    await expect(page.getByText('敏感肌向けアイテム')).toBeVisible()
  })

  test('ムードタグフィルタ機能', async ({ page }) => {
    // ログインして複数の投稿を作成
    await authHelper.registerAndLogin()

    const posts = [
      {
        title: '満足度の高い商品',
        content: '満足度の高い商品です',
        cosmeticName: 'テスト化粧品A',
        cosmeticCategory: 'toner',
        skinType: 'normal',
        moodTag: 'love',
      },
      {
        title: '良い商品',
        content: '良い商品です',
        cosmeticName: 'テスト化粧品B',
        cosmeticCategory: 'foundation',
        skinType: 'dry',
        moodTag: 'good',
      },
      {
        title: '普通の商品',
        content: '普通の商品です',
        cosmeticName: 'テスト化粧品C',
        cosmeticCategory: 'cleansing',
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
    await expect(page.locator('select[name="mood"]')).toBeVisible()

    // 大満足でフィルタ
    await page.locator('select[name="mood"]').selectOption('love')

    // フィルタ結果が表示されることを確認
    await expect(page.getByText('満足度の高い商品')).toBeVisible()
    await expect(page.getByText('良い商品')).not.toBeVisible()
    await expect(page.getByText('普通の商品')).not.toBeVisible()

    // 良いでフィルタ
    await page.locator('select[name="mood"]').selectOption('good')

    // フィルタ結果が表示されることを確認
    await expect(page.getByText('良い商品')).toBeVisible()
    await expect(page.getByText('満足度の高い商品')).not.toBeVisible()
    await expect(page.getByText('普通の商品')).not.toBeVisible()

    // 全てのムードを選択
    await page.locator('select[name="mood"]').selectOption('all')

    // 全ての投稿が表示されることを確認
    await expect(page.getByText('満足度の高い商品')).toBeVisible()
    await expect(page.getByText('良い商品')).toBeVisible()
    await expect(page.getByText('普通の商品')).toBeVisible()
  })

  test('複合フィルタ機能', async ({ page }) => {
    // ログインして複数の投稿を作成
    await authHelper.registerAndLogin()

    const posts = [
      {
        title: '乾燥肌向け化粧水（良い）',
        content: '乾燥肌向けの化粧水です',
        cosmeticName: '乾燥肌用化粧水',
        cosmeticCategory: 'toner',
        skinType: 'dry',
        moodTag: 'good',
      },
      {
        title: '乾燥肌向け化粧水（大満足）',
        content: '乾燥肌向けの化粧水です',
        cosmeticName: '優秀な化粧水',
        cosmeticCategory: 'toner',
        skinType: 'dry',
        moodTag: 'love',
      },
      {
        title: '乾燥肌向けファンデ（良い）',
        content: '乾燥肌向けのファンデです',
        cosmeticName: '乾燥肌用ファンデ',
        cosmeticCategory: 'foundation',
        skinType: 'dry',
        moodTag: 'good',
      },
      {
        title: 'オイリー肌向け化粧水（良い）',
        content: 'オイリー肌向けの化粧水です',
        cosmeticName: 'オイリー肌用化粧水',
        cosmeticCategory: 'toner',
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
    await page.locator('select[name="skinType"]').selectOption('dry')
    await page.locator('select[name="category"]').selectOption('toner')
    await page.locator('select[name="mood"]').selectOption('good')

    // フィルタ結果が表示されることを確認
    await expect(page.getByText('乾燥肌向け化粧水（良い）')).toBeVisible()
    await expect(page.getByText('乾燥肌向け化粧水（大満足）')).not.toBeVisible()
    await expect(page.getByText('乾燥肌向けファンデ（良い）')).not.toBeVisible()
    await expect(page.getByText('オイリー肌向け化粧水（良い）')).not.toBeVisible()

    // 検索テキストと組み合わせ
    await page.locator('input[name="search"]').fill('優秀')
    await page.getByRole('button', { name: '検索' }).click()

    // 検索結果が表示されないことを確認（フィルタと検索が両方適用）
    await expect(page.getByText('乾燥肌向け化粧水（良い）')).not.toBeVisible()
    await expect(page.getByText('乾燥肌向け化粧水（大満足）')).not.toBeVisible()

    // ムードフィルタを変更
    await page.locator('select[name="mood"]').selectOption('love')

    // 検索結果が表示されることを確認
    await expect(page.getByText('乾燥肌向け化粧水（大満足）')).toBeVisible()
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

    // 存在しない検索語で検索（実装されている場合のみ）
    const searchInput = page.locator('input[name="search"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('存在しない商品')
      await page.getByRole('button', { name: '検索' }).click()

      // 検索結果なしのメッセージが表示されることを確認
      await expect(
        page
          .getByText('検索結果が見つかりませんでした')
          .or(page.getByText('該当する投稿が見つかりませんでした'))
      ).toBeVisible()
    }
  })
})
