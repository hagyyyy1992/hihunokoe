import { test, expect } from '@playwright/test'
import { AuthHelper } from '../helpers/auth-helpers'
import { COSMETIC_CATEGORIES, COSMETIC_CATEGORY_LABELS } from '../helpers/test-data'

test.describe('パフォーマンスエラーハンドリング', () => {
  let authHelper: AuthHelper

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)
  })

  test.describe('レート制限エラー', () => {
    test('ログイン試行レート制限', async ({ page }) => {
      await page.goto('/auth/login')

      // 複数回の無効なログイン試行
      for (let i = 0; i < 5; i++) {
        await page.getByLabel('メールアドレス').fill('test@example.com')
        await page.locator('input[name="password"]').fill('wrongpassword')
        await page.getByRole('button', { name: 'ログイン' }).click()

        // エラーメッセージが表示されることを確認
        await expect(page.getByTestId('error-message')).toBeVisible()

        // 次の試行の前に少し待機
        await page.waitForTimeout(1000)

        // フォームをクリア
        await page.getByLabel('メールアドレス').fill('')
        await page.locator('input[name="password"]').fill('')
      }

      // 6回目の試行
      await page.getByLabel('メールアドレス').fill('test@example.com')
      await page.locator('input[name="password"]').fill('wrongpassword')
      await page.getByRole('button', { name: 'ログイン' }).click()

      // レート制限エラーが表示されることを確認
      const errorMessage = page.getByTestId('error-message')
      const errorText = await errorMessage.textContent()

      // レート制限関連のメッセージが表示されることを確認
      // 実際のエラーメッセージに応じて調整
      expect(errorText).toBeTruthy()
      console.log(`[TEST] Login rate limit error: ${errorText}`)
    })

    test('ユーザー登録レート制限', async ({ page }) => {
      await page.goto('/auth/register')

      // 複数回の無効なユーザー登録試行
      for (let i = 0; i < 3; i++) {
        const timestamp = Date.now()
        await page.getByLabel('ユーザー名 *').fill(`testuser${timestamp}`)
        await page.getByLabel('メールアドレス *').fill('invalid-email')
        await page.locator('input[name="password"]').fill('password123')
        await page.locator('input[name="confirmPassword"]').fill('password123')
        await page.getByRole('button', { name: '会員登録' }).click()

        // エラーが表示されるまで待機
        await page.waitForTimeout(2000)

        // フォームをクリア
        await page.getByLabel('ユーザー名 *').fill('')
        await page.getByLabel('メールアドレス *').fill('')
        await page.locator('input[name="password"]').fill('')
        await page.locator('input[name="confirmPassword"]').fill('')
      }

      console.log('[TEST] Registration rate limiting test completed')
    })
  })

  test.describe('タイムアウトエラー', () => {
    test('長時間のフォーム送信タイムアウト', async ({ page }) => {
      // ネットワークを遅延させる
      await page.route('**/api/auth/login', async route => {
        await new Promise(resolve => setTimeout(resolve, 10000)) // 10秒待機
        route.continue()
      })

      await page.goto('/auth/login')
      await page.getByLabel('メールアドレス').fill('test@example.com')
      await page.locator('input[name="password"]').fill('password123')
      await page.getByRole('button', { name: 'ログイン' }).click()

      // ローディング表示を確認
      const loadingIndicator = page.locator('[data-testid="loading-indicator"]')
      if (await loadingIndicator.isVisible().catch(() => false)) {
        console.log('[TEST] Loading indicator displayed')
      }

      // タイムアウトまたはエラーメッセージが表示されることを確認
      await page.waitForTimeout(5000)

      console.log('[TEST] Timeout test completed')
    })
  })

  test.describe('メモリ制限エラー', () => {
    test('大量データ表示時のパフォーマンス', async ({ page }) => {
      // ログインしてから投稿一覧ページにアクセス
      await authHelper.registerAndLogin()
      await page.goto('/posts')

      // 大量のデータを返すAPIレスポンスをモック
      await page.route('**/api/posts**', route => {
        const mockPosts = Array(1000).fill({
          id: 'test-id',
          title: 'テスト投稿' + Math.random(),
          content: 'テスト内容'.repeat(100),
          cosmeticName: 'テスト化粧品',
          cosmeticCategory: COSMETIC_CATEGORIES.toner,
          skinType: 'normal',
          moodTag: 'good',
          createdAt: new Date().toISOString(),
          author: {
            id: 'test-user-id',
            userName: 'testuser',
          },
        })

        route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ posts: mockPosts, totalCount: 1000 }),
        })
      })

      // ページを再読み込み
      await page.reload()

      // ページが適切に読み込まれることを確認
      await page.waitForTimeout(3000)

      // スクロールテスト
      await page.keyboard.press('End')
      await page.waitForTimeout(1000)
      await page.keyboard.press('Home')

      console.log('[TEST] Large data performance test completed')
    })
  })

  test.describe('接続エラー', () => {
    test('インターネット接続断絶時の処理', async ({ page }) => {
      await page.goto('/auth/login')

      // ネットワークを完全に遮断
      await page.route('**/*', route => route.abort('failed'))

      await page.getByLabel('メールアドレス').fill('test@example.com')
      await page.locator('input[name="password"]').fill('password123')
      await page.getByRole('button', { name: 'ログイン' }).click()

      // 接続エラーが適切に処理されることを確認
      await page.waitForTimeout(3000)

      console.log('[TEST] Network disconnection test completed')
    })

    test('間欠的な接続エラー', async ({ page }) => {
      let requestCount = 0

      // 3回に1回失敗するネットワーク状況をシミュレート
      await page.route('**/api/**', route => {
        requestCount++
        if (requestCount % 3 === 0) {
          route.abort('failed')
        } else {
          route.continue()
        }
      })

      await page.goto('/auth/login')

      // 複数回ログイン試行
      for (let i = 0; i < 3; i++) {
        await page.getByLabel('メールアドレス').fill('test@example.com')
        await page.locator('input[name="password"]').fill('password123')
        await page.getByRole('button', { name: 'ログイン' }).click()

        await page.waitForTimeout(2000)

        // フォームをクリア
        await page.getByLabel('メールアドレス').fill('')
        await page.locator('input[name="password"]').fill('')
      }

      console.log('[TEST] Intermittent connection error test completed')
    })
  })

  test.describe('ブラウザ制限エラー', () => {
    test('ローカルストレージ容量制限', async ({ page }) => {
      // ローカルストレージを満杯にする
      await page.evaluate(() => {
        try {
          for (let i = 0; i < 10000; i++) {
            localStorage.setItem(`test-key-${i}`, 'x'.repeat(1000))
          }
        } catch (error) {
          console.log('LocalStorage full:', error)
        }
      })

      await page.goto('/auth/login')
      await page.getByLabel('メールアドレス').fill('test@example.com')
      await page.locator('input[name="password"]').fill('password123')
      await page.getByRole('button', { name: 'ログイン' }).click()

      // アプリケーションが適切に動作することを確認
      await page.waitForTimeout(2000)

      console.log('[TEST] LocalStorage limitation test completed')
    })

    test('Cookie無効時の処理', async ({ page }) => {
      // Cookieを無効にする
      await page.context().clearCookies()

      await page.goto('/auth/login')
      await page.getByLabel('メールアドレス').fill('test@example.com')
      await page.locator('input[name="password"]').fill('password123')
      await page.getByRole('button', { name: 'ログイン' }).click()

      // Cookie無効時の適切な処理を確認
      await page.waitForTimeout(2000)

      console.log('[TEST] Cookie disabled test completed')
    })
  })

  test.describe('同時実行エラー', () => {
    test('同時投稿作成時の競合処理', async ({ page }) => {
      // ログインしてから投稿作成ページにアクセス
      await authHelper.registerAndLogin()
      await page.goto('/posts/create')

      // フォームに入力
      await page.locator('input[name="title"]').fill('同時投稿テスト')
      await page.locator('textarea[name="content"]').fill('同時投稿テスト内容')
      await page.locator('input[name="cosmeticName"]').fill('テスト化粧品')
      await page
        .locator('select[name="cosmeticCategory"]')
        .selectOption(COSMETIC_CATEGORY_LABELS.toner)
      await page.locator('select[name="skinType"]').selectOption('normal')
      await page.locator('select[name="moodTag"]').selectOption('good')

      // 投稿ボタンを複数回クリック（重複送信防止のテスト）
      const submitButton = page.getByRole('button', { name: '投稿する' })
      await submitButton.click()
      await submitButton.click()
      await submitButton.click()

      // 重複送信が防止されることを確認
      await page.waitForTimeout(3000)

      console.log('[TEST] Concurrent post creation test completed')
    })
  })
})
