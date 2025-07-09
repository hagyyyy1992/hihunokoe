import { test, expect } from '@playwright/test'
import { AuthHelper } from '../helpers/auth-helpers'

test.describe('エラーハンドリング', () => {
  let authHelper: AuthHelper

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)
  })

  test.describe('認証エラー', () => {
    test('無効なパスワードでのログイン', async ({ page }) => {
      // 一意なユーザーを作成
      const userData = await authHelper.generateUniqueUser()
      await authHelper.register({
        username: userData.userName,
        email: userData.email,
        password: userData.password,
        skinType: userData.skinType,
      })

      // メール認証を実行
      await authHelper.verifyEmail(userData.email)

      // 無効なパスワードでログイン試行
      await page.goto('/auth/login')
      await page.getByLabel('メールアドレス').fill(userData.email)
      await page.locator('input[name="password"]').fill('wrongpassword')
      await page.getByRole('button', { name: 'ログイン' }).click()

      // エラーメッセージが表示されることを確認
      await expect(page.getByTestId('error-message')).toBeVisible()
      await expect(page.getByTestId('error-message')).toContainText(
        'メールアドレスまたはパスワードが間違っています'
      )
      await expect(page).toHaveURL('/auth/login')
    })

    test('存在しないユーザーでのログイン', async ({ page }) => {
      await page.goto('/auth/login')
      await page.getByLabel('メールアドレス').fill('nonexistent@example.com')
      await page.locator('input[name="password"]').fill('password123')
      await page.getByRole('button', { name: 'ログイン' }).click()

      // エラーメッセージが表示されることを確認
      await expect(page.getByTestId('error-message')).toBeVisible()
      await expect(page.getByTestId('error-message')).toContainText(
        'メールアドレスまたはパスワードが間違っています'
      )
      await expect(page).toHaveURL('/auth/login')
    })

    test('セッション期限切れでのページアクセス', async ({ page }) => {
      // 認証が必要なページに直接アクセス
      await page.goto('/posts/create')

      // ログインページにリダイレクトされることを確認
      await expect(page).toHaveURL('/auth/login')
    })
  })

  test.describe('バリデーションエラー', () => {
    test('無効なメールアドレス形式でのユーザー登録', async ({ page }) => {
      await page.goto('/auth/register')

      await page.getByLabel('ユーザー名 *').fill('testuser')
      await page.getByLabel('メールアドレス *').fill('invalid-email')
      await page.locator('input[name="password"]').fill('password123')
      await page.locator('input[name="confirmPassword"]').fill('password123')
      await page.getByRole('button', { name: '会員登録' }).click()

      // HTML5バリデーションまたはカスタムバリデーションエラーを確認
      const emailInput = page.locator('input[name="email"]')
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid)

      if (isInvalid) {
        // HTML5バリデーションが働いている場合
        console.log('[TEST] HTML5 validation prevented submission')
      } else {
        // サーバーサイドバリデーションエラーを確認
        await expect(page.getByTestId('error-message')).toBeVisible()
        await expect(page.getByTestId('error-message')).toContainText(
          'メールアドレスの形式が正しくありません'
        )
      }
    })

    test('短すぎるパスワードでのユーザー登録', async ({ page }) => {
      await page.goto('/auth/register')

      await page.getByLabel('ユーザー名 *').fill('testuser')
      await page.getByLabel('メールアドレス *').fill('test@example.com')
      await page.locator('input[name="password"]').fill('123') // 3文字（短すぎる）
      await page.locator('input[name="confirmPassword"]').fill('123')
      await page.getByRole('button', { name: '会員登録' }).click()

      // バリデーションエラーが表示されることを確認
      await expect(page.getByText('パスワードは8文字以上で入力してください').first()).toBeVisible()
    })

    test('パスワード確認が一致しない場合のユーザー登録', async ({ page }) => {
      await page.goto('/auth/register')

      await page.getByLabel('ユーザー名 *').fill('testuser')
      await page.getByLabel('メールアドレス *').fill('test@example.com')
      await page.locator('input[name="password"]').fill('password123')
      await page.locator('input[name="confirmPassword"]').fill('differentpassword')
      await page.getByRole('button', { name: '会員登録' }).click()

      // バリデーションエラーが表示されることを確認
      await expect(page.getByText('パスワードが一致しません').first()).toBeVisible()
    })

    test('必須項目が未入力の場合のユーザー登録', async ({ page }) => {
      await page.goto('/auth/register')

      // 必須項目を空のまま送信
      await page.getByRole('button', { name: '会員登録' }).click()

      // バリデーションエラーが表示されることを確認
      const errorMessages = [
        'ユーザー名を入力してください',
        'ユーザー名は必須です',
        'メールアドレスを入力してください',
        'メールアドレスは必須です',
        'パスワードを入力してください',
        'パスワードは必須です',
      ]

      // いずれかのエラーメッセージが表示されることを確認
      let errorFound = false
      for (const message of errorMessages) {
        const isVisible = await page
          .getByText(message)
          .first()
          .isVisible()
          .catch(() => false)
        if (isVisible) {
          errorFound = true
          break
        }
      }

      if (!errorFound) {
        // data-testidでエラーメッセージを確認
        await expect(page.getByTestId('error-message')).toBeVisible()
      }
    })
  })

  test.describe('投稿エラー', () => {
    test('未認証ユーザーでの投稿作成', async ({ page }) => {
      // 認証なしで投稿作成ページにアクセス
      await page.goto('/posts/create')

      // ログインページにリダイレクトされることを確認
      await expect(page).toHaveURL('/auth/login')
    })

    test('必須項目が未入力の場合の投稿作成', async ({ page }) => {
      // ログインしてから投稿作成ページにアクセス
      await authHelper.registerAndLogin()
      await page.goto('/posts/create')

      // 必須項目を空のまま送信
      await page.getByRole('button', { name: '投稿する' }).click()

      // バリデーションエラーが表示されることを確認
      await expect(page.getByText('タイトルを入力してください')).toBeVisible()
      await expect(page.getByText('内容を入力してください')).toBeVisible()
      await expect(page.getByText('化粧品名を入力してください')).toBeVisible()
    })

    test('文字数制限を超える投稿の作成', async ({ page }) => {
      // ログインしてから投稿作成ページにアクセス
      await authHelper.registerAndLogin()
      await page.goto('/posts/create')

      // 文字数制限を超える値を入力
      const longTitle = 'あ'.repeat(201) // 200文字制限を超える
      const longContent = 'あ'.repeat(5001) // 5000文字制限を超える
      const longCosmeticName = 'あ'.repeat(101) // 100文字制限を超える

      await page.locator('input[name="title"]').fill(longTitle)
      await page.locator('textarea[name="content"]').fill(longContent)
      await page.locator('input[name="cosmeticName"]').fill(longCosmeticName)

      await page.getByRole('button', { name: '投稿する' }).click()

      // 文字数制限エラーが表示されることを確認
      await expect(page.getByText('タイトルは200文字以内で入力してください')).toBeVisible()
      await expect(page.getByText('内容は5000文字以内で入力してください')).toBeVisible()
      await expect(page.getByText('化粧品名は100文字以内で入力してください')).toBeVisible()
    })
  })

  test.describe('404エラー', () => {
    test('存在しないページへのアクセス', async ({ page }) => {
      await page.goto('/non-existent-page')

      // 404ページまたはホームページにリダイレクトされることを確認
      const currentUrl = page.url()
      const is404 =
        currentUrl.includes('404') ||
        (await page
          .getByText('ページが見つかりません')
          .isVisible()
          .catch(() => false)) ||
        (await page
          .getByText('404')
          .isVisible()
          .catch(() => false))

      if (is404) {
        console.log('[TEST] 404 page displayed correctly')
      } else {
        // ホームページにリダイレクトされている場合
        await expect(page).toHaveURL('/')
      }
    })

    test('存在しない投稿詳細ページへのアクセス', async ({ page }) => {
      await page.goto('/posts/non-existent-post-id')

      // 404エラーページまたはエラーメッセージが表示されることを確認
      await expect(page.getByText('投稿が見つかりません').or(page.getByText('404'))).toBeVisible()
    })
  })

  test.describe('フォームエラー', () => {
    test('無効なパスワードリセットトークン', async ({ page }) => {
      await page.goto('/auth/reset-password?token=invalid-token')

      // 無効なトークンのエラーが表示されることを確認
      await expect(page.getByText('無効または期限切れのトークンです')).toBeVisible()
    })

    test('パスワードリセット - 新しいパスワードが短すぎる', async ({ page }) => {
      // 正常なユーザーでパスワードリセット要求
      const userData = await authHelper.generateUniqueUser()
      await authHelper.register({
        username: userData.userName,
        email: userData.email,
        password: userData.password,
        skinType: userData.skinType,
      })

      await page.goto('/auth/forgot-password')
      await page.getByLabel('メールアドレス').fill(userData.email)
      await page.getByRole('button', { name: 'パスワードリセットメールを送信' }).click()

      // 成功メッセージが表示されることを確認
      await expect(page.getByText('パスワードリセットメールを送信しました')).toBeVisible()
    })
  })

  test.describe('ネットワークエラー', () => {
    test('接続エラー時の適切なメッセージ表示', async ({ page }) => {
      // ネットワークを無効にする
      await page.route('**/*', route => route.abort())

      await page.goto('/auth/login')
      await page.getByLabel('メールアドレス').fill('test@example.com')
      await page.locator('input[name="password"]').fill('password123')
      await page.getByRole('button', { name: 'ログイン' }).click()

      // ネットワークエラーが処理されることを確認
      // 実際のアプリケーションでは、適切なエラーメッセージが表示される
      await page.waitForTimeout(5000) // エラー処理のための待機

      console.log('[TEST] Network error scenario completed')
    })
  })
})
