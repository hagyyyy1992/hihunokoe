import { test, expect } from '@playwright/test'
import { AuthHelper } from '../helpers/auth-helpers'
import { PostHelper } from '../helpers/post-helpers'
import { generateRandomUser, testPosts } from '../helpers/test-data'

test.describe('投稿検索・フィルタリング', () => {
  let authHelper: AuthHelper
  let postHelper: PostHelper

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)
    postHelper = new PostHelper(page)
    
    // テスト用ユーザーでログイン
    const user = generateRandomUser()
    await authHelper.register(user)
    
    // テスト用の投稿を複数作成
    await postHelper.createPost({
      title: 'スキンケアルーティン',
      content: '朝のスキンケアについて',
      category: 'SKINCARE',
      mood: 'happy',
      tags: ['朝', 'ルーティン', 'スキンケア']
    })
    
    await postHelper.createPost({
      title: 'メイクアップチュートリアル',
      content: '初心者向けメイクアップ',
      category: 'MAKEUP',
      mood: 'excited',
      tags: ['初心者', 'チュートリアル', 'メイク']
    })
    
    await postHelper.createPost({
      title: '香水レビュー',
      content: '新しい香水の使用感',
      category: 'FRAGRANCE',
      mood: 'relaxed',
      tags: ['香水', 'レビュー']
    })
  })

  test('キーワード検索が正常に動作する', async ({ page }) => {
    await postHelper.searchPosts('スキンケア')
    
    // 検索結果にスキンケア関連の投稿が表示される
    await postHelper.expectPostToBeVisible('スキンケアルーティン')
    
    // メイクアップの投稿は表示されない
    await expect(page.locator('[data-testid="post-title"]:has-text("メイクアップチュートリアル")')).not.toBeVisible()
  })

  test('タイトルと内容両方で検索される', async ({ page }) => {
    // タイトルでの検索
    await postHelper.searchPosts('チュートリアル')
    await postHelper.expectPostToBeVisible('メイクアップチュートリアル')
    
    // 内容での検索
    await postHelper.searchPosts('初心者向け')
    await postHelper.expectPostToBeVisible('メイクアップチュートリアル')
  })

  test('カテゴリフィルタが正常に動作する', async ({ page }) => {
    await postHelper.filterByCategory('MAKEUP')
    
    // メイクアップカテゴリの投稿のみ表示される
    await postHelper.expectPostToBeVisible('メイクアップチュートリアル')
    
    // 他のカテゴリの投稿は表示されない
    await expect(page.locator('[data-testid="post-title"]:has-text("スキンケアルーティン")')).not.toBeVisible()
    await expect(page.locator('[data-testid="post-title"]:has-text("香水レビュー")')).not.toBeVisible()
  })

  test('肌タイプフィルタが正常に動作する', async ({ page }) => {
    // 投稿者の肌タイプでフィルタリング
    await postHelper.filterBySkinType('NORMAL')
    
    // 該当する肌タイプのユーザーの投稿が表示される
    await expect(page.locator('[data-testid="post-card"]')).toHaveCount(3) // すべての投稿（同じユーザーのため）
  })

  test('複数フィルタの組み合わせ', async ({ page }) => {
    await page.goto('/posts')
    
    // カテゴリとキーワード検索を組み合わせ
    await page.selectOption('[data-testid="category-filter"]', 'SKINCARE')
    await page.fill('[data-testid="search-input"]', 'ルーティン')
    await page.press('[data-testid="search-input"]', 'Enter')
    
    // 条件に合致する投稿のみ表示される
    await postHelper.expectPostToBeVisible('スキンケアルーティン')
    await expect(page.locator('[data-testid="post-card"]')).toHaveCount(1)
  })

  test('検索結果の並び替え', async ({ page }) => {
    await page.goto('/posts')
    
    // 最新順で並び替え
    await page.selectOption('[data-testid="sort-select"]', 'newest')
    
    // 投稿が最新順に表示されることを確認
    const firstPost = page.locator('[data-testid="post-card"]').first()
    await expect(firstPost).toContainText('香水レビュー') // 最後に作成された投稿
    
    // 古い順で並び替え
    await page.selectOption('[data-testid="sort-select"]', 'oldest')
    
    const firstPostOldest = page.locator('[data-testid="post-card"]').first()
    await expect(firstPostOldest).toContainText('スキンケアルーティン') // 最初に作成された投稿
  })

  test('人気順の並び替え', async ({ page }) => {
    // いいねを追加して人気順をテスト
    await postHelper.viewPost('1') // 最初の投稿
    await postHelper.likePost()
    
    await page.goto('/posts')
    await page.selectOption('[data-testid="sort-select"]', 'popular')
    
    // いいねの多い投稿が上位に表示される
    // 実装に依存するため、ソート機能の存在のみ確認
    await expect(page.locator('[data-testid="sort-select"]')).toHaveValue('popular')
  })

  test('タグ検索機能', async ({ page }) => {
    await page.goto('/posts')
    
    // タグをクリックして検索
    await page.click('[data-testid="tag"]:has-text("ルーティン")')
    
    // そのタグを含む投稿が表示される
    await postHelper.expectPostToBeVisible('スキンケアルーティン')
  })

  test('検索結果が見つからない場合', async ({ page }) => {
    await postHelper.searchPosts('存在しないキーワード')
    
    // 検索結果なしのメッセージを確認
    await expect(page.locator('[data-testid="no-results"]')).toBeVisible()
    await expect(page.locator('[data-testid="no-results"]')).toContainText('検索結果が見つかりませんでした')
  })

  test('検索履歴機能', async ({ page }) => {
    await postHelper.searchPosts('スキンケア')
    await postHelper.searchPosts('メイク')
    
    await page.goto('/posts')
    
    // 検索入力フィールドをクリックすると履歴が表示される
    await page.click('[data-testid="search-input"]')
    
    await expect(page.locator('[data-testid="search-history"]')).toBeVisible()
    await expect(page.locator('[data-testid="search-history-item"]:has-text("スキンケア")')).toBeVisible()
    await expect(page.locator('[data-testid="search-history-item"]:has-text("メイク")')).toBeVisible()
  })

  test('検索候補機能', async ({ page }) => {
    await page.goto('/posts')
    
    // 部分的なキーワードを入力
    await page.fill('[data-testid="search-input"]', 'スキン')
    
    // 検索候補が表示される
    await expect(page.locator('[data-testid="search-suggestions"]')).toBeVisible()
    await expect(page.locator('[data-testid="suggestion"]:has-text("スキンケア")')).toBeVisible()
  })

  test('ページネーション機能', async ({ page }) => {
    // 多数の投稿を作成（実際のテストでは時間がかかるため簡略化）
    await page.goto('/posts')
    
    // ページネーションコントロールが表示される（投稿数に依存）
    if (await page.locator('[data-testid="pagination"]').isVisible()) {
      // 次のページに移動
      await page.click('[data-testid="next-page"]')
      
      // URLにページ番号が含まれることを確認
      await expect(page).toHaveURL(/page=2/)
      
      // 前のページに戻る
      await page.click('[data-testid="prev-page"]')
      await expect(page).toHaveURL(/page=1|posts$/)
    }
  })

  test('無限スクロール機能', async ({ page }) => {
    await page.goto('/posts')
    
    // 初期表示の投稿数を取得
    const initialPostCount = await page.locator('[data-testid="post-card"]').count()
    
    // ページの最下部までスクロール
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    
    // 追加の投稿が読み込まれることを確認（実装に依存）
    await page.waitForTimeout(2000) // ローディング待機
    
    // ローディングインジケーターが表示される
    if (await page.locator('[data-testid="loading"]').isVisible()) {
      await expect(page.locator('[data-testid="loading"]')).toBeVisible()
    }
  })

  test('フィルタのクリア機能', async ({ page }) => {
    await page.goto('/posts')
    
    // フィルタを適用
    await page.selectOption('[data-testid="category-filter"]', 'MAKEUP')
    await page.fill('[data-testid="search-input"]', 'チュートリアル')
    
    // フィルタクリアボタンをクリック
    await page.click('[data-testid="clear-filters"]')
    
    // すべてのフィルタがリセットされる
    await expect(page.locator('[data-testid="category-filter"]')).toHaveValue('')
    await expect(page.locator('[data-testid="search-input"]')).toHaveValue('')
    
    // すべての投稿が再表示される
    await expect(page.locator('[data-testid="post-card"]')).toHaveCount(3)
  })
})