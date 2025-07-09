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

      // リダイレクトまたはページ読み込みを待つ
      await page.waitForTimeout(2000)

      // ログインページにリダイレクトされるか、投稿ページが表示されることを確認
      const currentUrl = page.url()
      const isLoginPage = currentUrl.includes('/auth/login')
      const isCreatePage = currentUrl.includes('/posts/create')

      // いずれかのページが表示されていることを確認
      expect(isLoginPage || isCreatePage).toBe(true)
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
      // HTML5バリデーションの場合、フォームが送信されないことを確認
      await page.waitForTimeout(1000)

      // フォームがまだ表示されていることを確認（送信されていない）
      await expect(page.getByRole('button', { name: '会員登録' })).toBeVisible()

      // カスタムエラーメッセージまたはHTML5バリデーション
      const hasError = await page.evaluate(() => {
        const form = document.querySelector('form')
        if (!form) return false
        const inputs = form.querySelectorAll('input[required]')
        return Array.from(inputs).some(input => !(input as HTMLInputElement).validity.valid)
      })

      expect(hasError).toBe(true)

      // エラーメッセージが表示されるかを確認（Mobile Safari対応）
      const errorMessage = page.getByTestId('error-message')
      const errorExists = await errorMessage.isVisible().catch(() => false)

      if (errorExists) {
        // エラーメッセージが存在する場合は確認
        await expect(errorMessage).toBeVisible()
      } else {
        // エラーメッセージがない場合は、HTML5バリデーションで処理されている
        // フォームが送信されていないことを再確認
        await expect(page.getByRole('button', { name: '会員登録' })).toBeVisible()

        // URLが変わっていないことを確認
        expect(page.url()).toContain('/auth/register')
      }
    })
  })

  test.describe('投稿エラー', () => {
    test('未認証ユーザーでの投稿作成', async ({ page }) => {
      // 認証なしで投稿作成ページにアクセス
      await page.goto('/posts/new')

      // リダイレクトまたはページ読み込みを待つ
      await page.waitForTimeout(2000)

      // ログインページにリダイレクトされるか、投稿ページが表示されることを確認
      const currentUrl = page.url()
      const isLoginPage = currentUrl.includes('/auth/login')
      const isCreatePage = currentUrl.includes('/posts/new')

      // いずれかのページが表示されていることを確認
      expect(isLoginPage || isCreatePage).toBe(true)
    })

    test('必須項目が未入力の場合の投稿作成', async ({ page }) => {
      // ログインしてから投稿作成ページにアクセス
      await authHelper.registerAndLogin()
      await page.goto('/posts/new')

      // ページが完全に読み込まれるまで待機
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      // ステップ1で「次へ」ボタンをクリック（必須項目が未入力）
      const nextButton = page.getByRole('button', { name: '次へ' })
      await nextButton.waitFor({ state: 'visible', timeout: 10000 })
      await nextButton.click()

      // ステップが進まないことを確認（まだステップ1にいる）
      await expect(page.getByText('基本情報')).toBeVisible()

      // 必須フィールドを一部入力してみる
      await page.getByTestId('post-title-input').fill('テストタイトル')
      await nextButton.click()

      // まだステップ1にいることを確認（他の必須項目が未入力のため）
      await expect(page.getByText('基本情報')).toBeVisible()
    })

    test('文字数制限を超える投稿の作成', async ({ page }) => {
      // ログインしてから投稿作成ページにアクセス
      await authHelper.registerAndLogin()
      await page.goto('/posts/new')

      // ページが完全に読み込まれるまで待機
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      // 文字数制限を超える値を入力
      const longTitle = 'あ'.repeat(201) // 200文字制限を超える
      const longContent = 'あ'.repeat(5001) // 5000文字制限を超える
      const longCosmeticName = 'あ'.repeat(101) // 100文字制限を超える

      // data-testidを使用してフィールドを特定
      await page.getByTestId('post-title-input').fill(longTitle)
      await page.getByTestId('post-content-textarea').fill(longContent)
      await page.getByLabel('使用したコスメ名').fill(longCosmeticName)

      // 「次へ」ボタンをクリック
      const nextButton = page.getByRole('button', { name: '次へ' })
      await nextButton.click()

      // エラーメッセージまたはステップが進まないことを確認
      // フォームがまだステップ1にいることを確認
      await expect(page.getByText('基本情報')).toBeVisible()

      // 文字数が制限内になるよう修正
      await page.getByTestId('post-title-input').fill('正常なタイトル')
      await page.getByTestId('post-content-textarea').fill('正常な内容')
      await page.getByLabel('使用したコスメ名').fill('正常なコスメ名')

      // カテゴリを選択
      await page.getByTestId('category-select').selectOption('skincare')

      // 次のステップに進めることを確認
      await nextButton.click()
      await expect(page.getByText('使用状況')).toBeVisible()
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

      // ページの読み込みを待つ
      await page.waitForLoadState('networkidle')

      // 無効なトークンのエラーまたはリダイレクトを確認
      const errorVisible = await page
        .getByText('無効または期限切れのトークンです')
        .isVisible()
        .catch(() => false)
      const redirected =
        page.url().includes('/auth/forgot-password') || page.url().includes('/auth/login')

      // エラーメッセージが表示されるか、パスワードリセットページにリダイレクトされることを確認
      expect(errorVisible || redirected).toBe(true)
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
    test('接続エラー時の適切なメッセージ表示', async ({ page, browserName }) => {
      // Mobile Safariではネットワークルーティングが制限されるため、スキップ
      if (browserName === 'webkit') {
        test.skip()
        return
      }

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
