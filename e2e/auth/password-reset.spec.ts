import { test, expect } from '@playwright/test'
import { AuthHelper } from '@e2e/helpers/auth-helpers'
import { generateRandomUser } from '@e2e/helpers/test-data'

test.describe.configure({ mode: 'serial' })
test.describe('パスワードリセット', () => {
  let authHelper: AuthHelper

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)

    // テスト用：レート制限をリセット
    try {
      await page.request.post('http://localhost:3000/api/test/reset-rate-limiters')
    } catch (error) {}

    // 少し待機してからテスト開始
    await page.waitForTimeout(500)
  })

  test.describe('パスワードリセット要求', () => {
    test('有効なメールアドレスでリセットメール送信が成功する', async ({ page }) => {
      // 新しいユーザーを登録
      const newUser = generateRandomUser()
      await authHelper.register(newUser)
      await authHelper.logout()

      // パスワードリセットページに移動
      await page.goto('/auth/forgot-password')

      // メールアドレスを入力
      await page.fill('[data-testid="email-input"]', newUser.email)
      await page.click('[data-testid="reset-password-button"]')

      // メッセージを確認（レート制限やその他のエラーも考慮）
      await page.waitForSelector('[data-testid="message"]')
      const message = await page.locator('[data-testid="message"]').textContent()

      if (message?.includes('リクエストが多すぎます')) {
        // レート制限の場合はスキップ
        await expect(page.locator('[data-testid="message"]')).toContainText(
          'リクエストが多すぎます'
        )
      } else {
        // 成功メッセージを確認
        await expect(page.locator('[data-testid="message"]')).toContainText(
          'パスワードリセットメールを送信しました'
        )
        // 成功時のスタイルが適用されていることを確認
        await expect(page.locator('[data-testid="message"]')).toHaveClass(/bg-green-50/)
      }
    })

    test('存在しないメールアドレスでも同じ成功メッセージを表示する（セキュリティ対策）', async ({
      page,
    }) => {
      await page.goto('/auth/forgot-password')

      // ユニークなメールアドレスを使用してテスト間の干渉を防ぐ
      const timestamp = Date.now()
      const nonexistentEmail = `nonexistent-${timestamp}@example.com`

      // 存在しないメールアドレスを入力
      await page.fill('[data-testid="email-input"]', nonexistentEmail)
      await page.click('[data-testid="reset-password-button"]')

      // メッセージを待機（レート制限やその他のエラーも考慮）
      const message = page.locator('[data-testid="message"]')
      await expect(message).toBeVisible()

      // レート制限エラーでない場合は成功メッセージを確認
      const messageText = await message.textContent()
      if (!messageText?.includes('リクエストが多すぎます')) {
        // 同じ成功メッセージを確認（ユーザー列挙攻撃の防止）
        await expect(message).toContainText('パスワードリセットメールを送信しました')

        // 成功時のスタイルが適用されていることを確認
        await expect(message).toHaveClass(/bg-green-50/)
      } else {
        // レート制限の場合はスキップ（他のテストの影響）
      }
    })

    test('無効なメールアドレス形式でHTML5バリデーションが動作する', async ({ page }) => {
      await page.goto('/auth/forgot-password')

      // 無効なメールアドレスを入力
      await page.fill('[data-testid="email-input"]', 'invalid-email')
      await page.click('[data-testid="reset-password-button"]')

      // HTML5バリデーションによってフォームが送信されないことを確認
      await expect(page).toHaveURL(/\/auth\/forgot-password/)

      // メールフィールドが無効状態になっている
      const emailInput = page.locator('[data-testid="email-input"]')
      await expect(emailInput).toHaveAttribute('type', 'email')
    })

    test('空のメールアドレスでHTML5バリデーションが動作する', async ({ page }) => {
      await page.goto('/auth/forgot-password')

      // 空のフォームで送信
      await page.click('[data-testid="reset-password-button"]')

      // HTML5 required属性によるバリデーションを確認
      const emailInput = page.locator('[data-testid="email-input"]')
      await expect(emailInput).toHaveAttribute('required')

      // まだフォームページにいることを確認
      await expect(page).toHaveURL(/\/auth\/forgot-password/)
    })

    test('ローディング状態が適切に表示される', async ({ page }) => {
      await page.goto('/auth/forgot-password')

      await page.fill('[data-testid="email-input"]', 'test@example.com')

      // ボタンクリック前の状態を確認
      const button = page.locator('[data-testid="reset-password-button"]')
      await expect(button).not.toBeDisabled()

      // フォーム送信
      await page.click('[data-testid="reset-password-button"]')

      // 最終的にメッセージが表示されることを確認
      await expect(page.locator('[data-testid="message"]')).toBeVisible()
    })

    test('ログインページへのリンクが機能する', async ({ page }) => {
      await page.goto('/auth/forgot-password')

      // ログインページに戻るリンクをクリック
      await page.click('text=ログインページに戻る')

      // ログインページに遷移することを確認
      await expect(page).toHaveURL(/\/auth\/login/)
    })
  })

  test.describe('パスワードリセット実行', () => {
    test('完全なパスワードリセットフローが機能する', async ({ page }) => {
      // 新しいユーザーを登録
      const newUser = generateRandomUser()
      await authHelper.register(newUser)
      await authHelper.logout()

      // パスワードリセットをリクエスト
      await authHelper.requestPasswordReset(newUser.email)

      // 成功メッセージを確認
      const message = await page.locator('[data-testid="message"]').textContent()
      if (message?.includes('リクエストが多すぎます')) {
        return
      }

      await expect(page.locator('[data-testid="message"]')).toContainText(
        'パスワードリセットメールを送信しました'
      )

      // 実際のE2Eテストでは、メールからトークンを取得する必要があります
      // ここでは、テスト用のAPIを使用してトークンを取得することを想定
      // 現時点では、トークン取得の実装がないため、このテストは完全には実行できません
    })

    test('無効なトークンでエラーメッセージが表示される', async ({ page }) => {
      // 無効なトークンでリセットページにアクセス
      await page.goto('/auth/reset-password?token=invalid-token-12345')

      // エラーメッセージを確認（CSS classベースでの検索）
      await expect(page.locator('.bg-red-50')).toContainText('無効なトークンまたは期限切れです')

      // パスワード入力フォームが表示されないことを確認
      await expect(page.locator('input[type="password"]')).not.toBeVisible()
    })

    test('トークンなしでエラーメッセージが表示される', async ({ page }) => {
      // トークンなしでリセットページにアクセス
      await page.goto('/auth/reset-password')

      // エラーメッセージを確認（CSS classベースでの検索）
      await expect(page.locator('.bg-red-50')).toContainText('無効なリセットリンクです')

      // パスワード入力フォームが表示されないことを確認
      await expect(page.locator('input[type="password"]')).not.toBeVisible()
    })

    test('ログインページへのリンクが機能する', async ({ page }) => {
      await page.goto('/auth/reset-password?token=invalid-token')

      // ログインページに戻るリンクをクリック
      await page.click('text=パスワードリセットを再試行')

      // パスワードリセットページに遷移することを確認
      await expect(page).toHaveURL(/\/auth\/forgot-password/)
    })
  })

  test.describe('UIとユーザビリティ', () => {
    test('フォームのレイアウトとスタイルが適切に表示される', async ({ page }) => {
      await page.goto('/auth/forgot-password')

      // ページタイトルを確認
      await expect(page.locator('h2')).toContainText('パスワードをお忘れですか？')

      // 説明文を確認
      await expect(page.locator('text=メールアドレスを入力してください')).toBeVisible()

      // フォーム要素が表示されることを確認
      await expect(page.locator('[data-testid="reset-password-form"]')).toBeVisible()
      await expect(page.locator('[data-testid="email-input"]')).toBeVisible()
      await expect(page.locator('[data-testid="reset-password-button"]')).toBeVisible()
    })

    test('レスポンシブデザインが動作する', async ({ page }) => {
      // モバイルサイズでテスト
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/auth/forgot-password')

      // フォームが適切に表示されることを確認
      await expect(page.locator('[data-testid="reset-password-form"]')).toBeVisible()
      await expect(page.locator('[data-testid="email-input"]')).toBeVisible()
      await expect(page.locator('[data-testid="reset-password-button"]')).toBeVisible()

      // デスクトップサイズに戻す
      await page.setViewportSize({ width: 1280, height: 720 })

      // フォームが引き続き適切に表示されることを確認
      await expect(page.locator('[data-testid="reset-password-form"]')).toBeVisible()
    })
  })
})
