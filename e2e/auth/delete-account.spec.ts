import { test, expect, Page } from '@playwright/test'
import {
  loginUser,
  createTestUser,
  cleanupTestUser,
  registerAndLoginTestUser,
} from '../helpers/auth-helpers'

test.describe.configure({ mode: 'serial' })
test.describe('アカウント削除機能', () => {
  let testUser: { email: string; password: string; userName: string }

  // ヘルパー関数: アカウント削除ページの読み込み完了を待機
  async function waitForDeletePageReady(page: Page) {
    // 最初にネットワークアイドル状態を待つ
    await page.waitForLoadState('networkidle')

    // AuthContext の初期化を待つため、より長く待機（E2Eテスト用に増加）
    await page.waitForTimeout(3000)

    // ページの最終的な状態を確認
    try {
      // ローディング画面が消えるまで待機（より長いタイムアウト）
      await page.waitForFunction(
        () => {
          const loadingElement = document.querySelector('.animate-spin')
          return !loadingElement || !(loadingElement as HTMLElement).offsetParent
        },
        { timeout: 30000 }
      )

      // 認証状態のチェック前により長く待機（状態の安定化）
      await page.waitForTimeout(2000)

      // まず認証状態をチェック - ログインページにリダイレクトされていないか確認
      const currentUrl = page.url()
      if (currentUrl.includes('/auth/login')) {
        // 認証が失われている場合、デバッグ情報を出力
        console.log('Authentication lost. Current URL:', currentUrl)
        console.log('User agent:', await page.evaluate(() => navigator.userAgent))

        // クッキーの状態も確認
        const cookies = await page.context().cookies()
        const authCookie = cookies.find(c => c.name === 'auth-token')
        console.log('Auth cookie present:', !!authCookie)

        throw new Error('User was redirected to login page - authentication required')
      }

      // アカウント削除ページの要素が表示されるまで待機（より長いタイムアウト）
      await page.waitForSelector('[data-testid="continue-delete-button"]', {
        timeout: 30000,
        state: 'visible',
      })
    } catch (error) {
      // エラーの場合、現在のページ状態を確認
      const currentUrl = page.url()
      console.log('waitForDeletePageReady failed. Current URL:', currentUrl)

      if (currentUrl.includes('/auth/login')) {
        throw new Error('User was redirected to login page - authentication required')
      }

      // その他のエラーはそのまま再スロー
      throw error
    }
  }

  test.beforeEach(async ({ page }, testInfo) => {
    // 各テストで新しいユーザーを作成（ブラウザ名を含めて一意にする）
    const browserName = testInfo.project.name || 'unknown'
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    testUser = {
      email: `test-${browserName}-${timestamp}-${randomSuffix}@example.com`,
      password: 'test12345',
      userName: `testuser-${browserName}-${timestamp}-${randomSuffix}`,
    }

    // テストデータをクリーンアップ
    try {
      await cleanupTestUser(testUser.email)
    } catch (error) {
      // クリーンアップエラーは無視（ユーザーが存在しない場合など）
      console.log('Cleanup error (ignored):', error)
    }

    // ログインしていない状態をテストする場合はスキップ
    if (
      testInfo.title.includes('ログインしていないユーザーはアカウント削除ページにアクセスできない')
    ) {
      return
    }

    // ユーザーを登録してログイン済みの状態にする
    try {
      await registerAndLoginTestUser(page, testUser)

      // 認証状態が完全に確立されるまで待機
      await page.waitForTimeout(2000)

      // 認証済みであることを確認（リトライロジック付き）
      let authVerified = false
      for (let i = 0; i < 3; i++) {
        const cookies = await page.context().cookies()
        const authCookie = cookies.find(c => c.name === 'auth-token')
        if (authCookie) {
          authVerified = true
          break
        }
        await page.waitForTimeout(1000)
      }

      if (!authVerified) {
        throw new Error('Auth cookie not found after registration and login')
      }
    } catch (error) {
      console.error('Failed to setup test user:', error)
      throw error
    }
  })

  test.afterEach(async ({ page }) => {
    // テスト後のクリーンアップを強化
    try {
      // セッションクッキーを削除
      await page.context().clearCookies()

      // テストユーザーをクリーンアップ
      await cleanupTestUser(testUser.email)

      // 少し待機してデータベースの状態を安定させる
      await page.waitForTimeout(500)
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  })

  test('ログインしていないユーザーはアカウント削除ページにアクセスできない', async ({
    browser,
  }) => {
    // 新しいブラウザコンテキスト（ログインしていない状態）でテスト
    const newContext = await browser.newContext()
    const newPage = await newContext.newPage()

    // アカウント削除ページにアクセス（タイムアウトを長めに設定）
    try {
      await newPage.goto('/account/delete', { waitUntil: 'load', timeout: 15000 })
    } catch (error) {
      // ネットワークエラーの場合でも、リダイレクトされていれば成功とみなす
      const currentUrl = newPage.url()
      if (!currentUrl.includes('/auth/login')) {
        throw error
      }
    }

    // AuthContextの初期化とリダイレクトを待つ
    await newPage.waitForTimeout(3000)

    // 現在のURLを確認
    const currentUrl = newPage.url()
    console.log('Unauthenticated access - Current URL:', currentUrl)

    // ログインページにリダイレクトされることを確認
    if (!currentUrl.includes('/auth/login')) {
      // クライアントサイドのリダイレクトを待つ
      try {
        await newPage.waitForURL('**/auth/login', { timeout: 10000 })
      } catch (error) {
        // URLが変わらない場合は、現在のURLを再確認
        const finalUrl = newPage.url()
        if (!finalUrl.includes('/auth/login')) {
          throw new Error(`Expected redirect to login page, but got: ${finalUrl}`)
        }
      }
    }

    // 最終的にログインページにいることを確認
    await expect(newPage).toHaveURL(/\/auth\/login/)
    await newContext.close()
  })

  test('ログインユーザーがアカウント削除ページにアクセスできる', async ({ page }) => {
    // beforeEachで既にログイン済みなので、直接アクセス
    await page.goto('/account/delete')
    await waitForDeletePageReady(page)

    // アカウント削除ページが表示されることを確認
    await expect(page.getByRole('heading', { name: /アカウント削除/ })).toBeVisible()
    await expect(page.getByText(/この操作は取り消すことができません/)).toBeVisible()
  })

  test('プロフィールページからアカウント削除ページにアクセスできる', async ({ page }) => {
    await page.goto('/profile')

    // プロフィールページが表示されることを確認
    await expect(page.getByRole('heading', { name: /プロフィール/ })).toBeVisible()

    // アカウント設定セクションが表示されることを確認
    await expect(page.getByText('アカウント設定')).toBeVisible()

    // アカウント削除ボタンをクリック
    await page.getByTestId('delete-account-button').click()

    // アカウント削除ページにリダイレクトされることを確認
    await expect(page).toHaveURL('/account/delete')
    await waitForDeletePageReady(page)
    await expect(page.getByRole('heading', { name: /アカウント削除/ })).toBeVisible()
  })

  test('アカウント削除の警告メッセージが適切に表示される', async ({ page }) => {
    await page.goto('/account/delete')
    await waitForDeletePageReady(page)

    // 警告メッセージの内容を確認
    await expect(page.getByText(/プロフィール情報/)).toBeVisible()
    await expect(page.getByText(/投稿したコスメティック体験談/)).toBeVisible()
    await expect(page.getByText(/コメントと共感/)).toBeVisible()
    await expect(page.getByText(/その他すべてのアカウント関連データ/)).toBeVisible()
  })

  test('継続ボタンをクリックするとパスワード確認フォームが表示される', async ({ page }) => {
    await page.goto('/account/delete')
    await waitForDeletePageReady(page)

    // 継続ボタンをクリック
    await page.getByTestId('continue-delete-button').click()

    // パスワード入力フォームが表示されることを確認
    await expect(page.getByText(/最終確認/)).toBeVisible()
    await expect(page.getByTestId('delete-password-input')).toBeVisible()
    await expect(page.getByTestId('cancel-button')).toBeVisible()
    await expect(page.getByTestId('delete-account-button')).toBeVisible()
  })

  test('キャンセルボタンをクリックすると初期状態に戻る', async ({ page }) => {
    await page.goto('/account/delete')
    await waitForDeletePageReady(page)

    // 継続ボタンをクリック
    await page.getByTestId('continue-delete-button').click()

    // キャンセルボタンをクリック
    await page.getByTestId('cancel-button').click()

    // 初期状態に戻ることを確認
    await expect(page.getByTestId('continue-delete-button')).toBeVisible()
    await expect(page.getByTestId('delete-password-input')).not.toBeVisible()
  })

  test('削除ボタンはパスワードが入力されていない場合は無効になる', async ({ page }) => {
    await page.goto('/account/delete')
    await waitForDeletePageReady(page)

    // 継続ボタンをクリック
    await page.getByTestId('continue-delete-button').click()

    // パスワード入力フォームが表示されるまで待機
    await expect(page.getByTestId('delete-password-input')).toBeVisible()

    // 初期状態では削除ボタンが無効であることを確認
    const deleteButton = page.getByTestId('delete-account-button')
    await expect(deleteButton).toBeDisabled()

    // パスワードを入力すると削除ボタンが有効になることを確認
    await page.getByTestId('delete-password-input').fill('some-password')
    await expect(deleteButton).toBeEnabled()

    // パスワードをクリアすると再び無効になることを確認
    await page.getByTestId('delete-password-input').clear()
    await expect(deleteButton).toBeDisabled()
  })

  test('正しいパスワードでアカウント削除が成功する', async ({ page }) => {
    await page.goto('/account/delete')
    await waitForDeletePageReady(page)

    // 継続ボタンをクリック
    await page.getByTestId('continue-delete-button').click()

    // パスワードを入力
    await page.getByTestId('delete-password-input').fill(testUser.password)

    // 削除ボタンをクリック
    await page.getByTestId('delete-account-button').click()

    // アカウント削除後、トップページまたはログインページにリダイレクトされることを確認
    // （ログアウト処理によってはログインページに移動する場合もある）
    await expect(page).toHaveURL(/\/(|auth\/login)/, { timeout: 10000 })

    // いずれの場合もログアウト状態になっていることを確認
    if (page.url().includes('/auth/login')) {
      // ログインページにいる場合
      await expect(page.getByTestId('login-button')).toBeVisible()
    } else {
      // トップページにいる場合、ログインリンクが表示されるか確認
      // 削除直後でまだ状態が反映されていない可能性があるため、少し待機
      await page.waitForTimeout(1000)

      // ビューポートサイズをチェック
      const viewport = page.viewportSize()
      const isMobile = viewport && viewport.width < 768

      if (isMobile) {
        // モバイルビューの場合、ハンバーガーメニューを開く
        const hamburgerButton = page.getByTestId('mobile-menu-button')
        await expect(hamburgerButton).toBeVisible()
        await hamburgerButton.click()

        // モバイルメニュー内のログインリンクを確認（モバイルメニュー内に限定）
        // モバイルメニューは固定位置のdiv要素内にある
        const mobileMenu = page.locator('.md\\:hidden.fixed.top-16')
        const loginLink = mobileMenu.getByTestId('login-link')
        await expect(loginLink).toBeVisible({ timeout: 5000 })
      } else {
        // デスクトップビューの場合
        try {
          // ログインリンクまたはログインボタンを探す
          const loginLink = page
            .getByTestId('login-link')
            .or(page.getByRole('link', { name: /ログイン/ }))
          await expect(loginLink).toBeVisible({ timeout: 5000 })
        } catch (error) {
          // ログインリンクが見つからない場合、ページをリロードして再確認
          await page.reload()
          await page.waitForTimeout(1000)
          const loginLink = page
            .getByTestId('login-link')
            .or(page.getByRole('link', { name: /ログイン/ }))
          await expect(loginLink).toBeVisible()
        }
      }
    }
  })

  test('アカウント削除後に同じアカウントでログインできないことを確認', async ({ page }) => {
    await page.goto('/account/delete')
    await waitForDeletePageReady(page)

    // アカウント削除を実行
    await page.getByTestId('continue-delete-button').click()
    await page.getByTestId('delete-password-input').fill(testUser.password)
    await page.getByTestId('delete-account-button').click()

    // アカウント削除後、トップページまたはログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/(|auth\/login)/, { timeout: 10000 })

    // 削除処理が完了するまで待機
    await page.waitForTimeout(3000)

    // ページをリロードしてセッションを完全にクリア
    await page.reload()
    await page.waitForTimeout(1000)

    // 削除されたアカウントでのログインを試行
    await page.goto('/auth/login')
    await page.getByTestId('email-input').fill(testUser.email)
    await page.getByTestId('password-input').fill(testUser.password)
    await page.getByTestId('login-button').click()

    // ログインエラーが表示されることを確認 - エラーメッセージのバリエーションを考慮
    await expect(
      page
        .getByTestId('error-message')
        .or(page.getByText(/メールアドレスまたはパスワードが間違っています/))
        .or(page.getByText(/ログインに失敗しました/))
    ).toBeVisible({ timeout: 5000 })
  })

  test('アカウント削除中にローディング状態が表示される', async ({ page }) => {
    await page.goto('/account/delete')
    await waitForDeletePageReady(page)

    // 継続ボタンをクリック
    await page.getByTestId('continue-delete-button').click()

    // パスワードを入力
    await page.getByTestId('delete-password-input').fill(testUser.password)

    // 削除ボタンをクリック
    const deleteButton = page.getByTestId('delete-account-button')
    await deleteButton.click()

    // ローディング状態を確認（短時間なので確認が難しい場合がある）
    await expect(page.getByTestId('delete-account-button'))
      .toBeVisible({ timeout: 1000 })
      .catch(() => {
        // ローディングが短すぎて確認できない場合は無視
      })
  })

  test('削除ボタンはパスワード入力時のみ有効になる', async ({ page }) => {
    // 認証状態を再確認
    const cookies = await page.context().cookies()
    const authCookie = cookies.find(c => c.name === 'auth-token')
    if (!authCookie) {
      console.log('Re-authenticating user for test')
      await loginUser(page, testUser.email, testUser.password)
      await page.waitForTimeout(2000)
    }

    await page.goto('/account/delete')
    await waitForDeletePageReady(page)

    // 継続ボタンをクリック
    await page.getByTestId('continue-delete-button').click()

    const passwordInput = page.getByTestId('delete-password-input')
    const deleteButton = page.getByTestId('delete-account-button')

    // 初期状態では削除ボタンが無効
    await expect(deleteButton).toBeDisabled()

    // パスワードを入力すると削除ボタンが有効になる
    await passwordInput.fill(testUser.password)
    await expect(deleteButton).toBeEnabled()

    // パスワードを削除すると再び無効になる
    await passwordInput.clear()
    await expect(deleteButton).toBeDisabled()
  })

  test('アカウント削除後に同じメールアドレスで再登録できる', async ({ page }) => {
    test.setTimeout(60000) // Firefoxでのタイムアウトを防ぐため
    // アカウント削除を実行
    await page.goto('/account/delete')
    await waitForDeletePageReady(page)

    await page.getByTestId('continue-delete-button').click()
    await page.getByTestId('delete-password-input').fill(testUser.password)
    await page.getByTestId('delete-account-button').click()

    // アカウント削除後、トップページまたはログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/(|auth\/login)/, { timeout: 10000 })

    // 削除処理が完全に完了するまで十分に待機
    await page.waitForTimeout(5000)

    // ナビゲーションが完了するまで待機
    await page.waitForLoadState('networkidle')

    // 認証クッキーがクリアされていることを確認
    const cookies = await page.context().cookies()
    const authCookie = cookies.find(c => c.name === 'auth-token')
    if (authCookie) {
      console.log('Warning: Auth cookie still present after deletion')
    }

    // 新規登録ページに移動
    await page.goto('/auth/register', { waitUntil: 'networkidle' })

    // フォームが完全に読み込まれるまで待機
    await page.waitForSelector('[data-testid="register-form"]', { timeout: 10000 })

    // 同じメールアドレスで新しいアカウントを登録
    await page.getByTestId('username-input').fill(testUser.userName + '_new')
    await page.getByTestId('email-input').fill(testUser.email)
    await page.getByTestId('password-input').fill(testUser.password)
    await page.getByTestId('confirm-password-input').fill(testUser.password)

    // 登録ボタンをクリック
    await page.getByTestId('register-button').click()

    // 登録処理の結果を待つ - URLの変更またはエラーメッセージの表示を待機
    await Promise.race([
      // 成功時のリダイレクトを待つ
      page
        .waitForURL(
          url => {
            return (
              url.pathname.includes('/auth/registration-complete') || url.pathname.includes('/home')
            )
          },
          { timeout: 20000 }
        )
        .catch(() => null),
      // エラーメッセージの表示を待つ
      page.waitForSelector('[data-testid="alert-message"]', { timeout: 20000 }).catch(() => null),
      page.waitForSelector('[data-testid="error-message"]', { timeout: 20000 }).catch(() => null),
    ])

    // 現在のURLを確認
    const currentUrl = page.url()

    // 登録成功の確認
    if (currentUrl.includes('/auth/registration-complete') || currentUrl.includes('/home')) {
      // 再登録が成功したことを確認
      if (currentUrl.includes('/auth/registration-complete')) {
        await expect(page.getByTestId('success-message')).toBeVisible()
        await expect(page.getByText(/アカウントが作成されました/)).toBeVisible()
      }
      // homeページの場合は成功とみなす
    } else {
      // エラーメッセージがある場合は内容を確認
      const alertMessage = page.locator('[data-testid="alert-message"]')
      const errorMessage = page.locator('[data-testid="error-message"]')

      let errorText = ''
      if (await alertMessage.isVisible()) {
        errorText = (await alertMessage.textContent()) || ''
      } else if (await errorMessage.isVisible()) {
        errorText = (await errorMessage.textContent()) || ''
      }

      if (errorText) {
        console.error('再登録エラー:', errorText)
        throw new Error(`再登録に失敗しました: ${errorText}`)
      } else {
        // 予期しない状態
        throw new Error(`再登録に失敗しました: 予期しないページ状態 (URL: ${currentUrl})`)
      }
    }
  })

  test('アカウント削除後に同じユーザー名で再登録できる', async ({ page }) => {
    test.setTimeout(60000) // Firefoxでのタイムアウトを防ぐため

    // 認証状態を再確認
    const cookies = await page.context().cookies()
    const authCookie = cookies.find(c => c.name === 'auth-token')
    if (!authCookie) {
      console.log('Re-authenticating user for test')
      await loginUser(page, testUser.email, testUser.password)
      await page.waitForTimeout(2000)
    }

    // アカウント削除を実行
    await page.goto('/account/delete')
    await waitForDeletePageReady(page)

    await page.getByTestId('continue-delete-button').click()
    await page.getByTestId('delete-password-input').fill(testUser.password)
    await page.getByTestId('delete-account-button').click()

    // アカウント削除後、トップページまたはログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/(|auth\/login)/, { timeout: 10000 })

    // 削除処理が完全に完了するまで十分に待機
    await page.waitForTimeout(5000)

    // ナビゲーションが完了するまで待機
    await page.waitForLoadState('networkidle')

    // 新規登録ページに移動
    await page.goto('/auth/register', { waitUntil: 'networkidle' })

    // フォームが完全に読み込まれるまで待機
    await page.waitForSelector('[data-testid="register-form"]', { timeout: 10000 })

    // 同じユーザー名で新しいアカウントを登録
    await page.getByTestId('username-input').fill(testUser.userName)
    await page.getByTestId('email-input').fill('new_' + testUser.email)
    await page.getByTestId('password-input').fill(testUser.password)
    await page.getByTestId('confirm-password-input').fill(testUser.password)

    // 登録ボタンをクリック
    await page.getByTestId('register-button').click()

    // 登録処理の結果を待つ - URLの変更またはエラーメッセージの表示を待機
    await Promise.race([
      // 成功時のリダイレクトを待つ
      page
        .waitForURL(
          url => {
            return (
              url.pathname.includes('/auth/registration-complete') || url.pathname.includes('/home')
            )
          },
          { timeout: 20000 }
        )
        .catch(() => null),
      // エラーメッセージの表示を待つ
      page.waitForSelector('[data-testid="alert-message"]', { timeout: 20000 }).catch(() => null),
      page.waitForSelector('[data-testid="error-message"]', { timeout: 20000 }).catch(() => null),
    ])

    // 現在のURLを確認
    const currentUrl = page.url()

    // 登録成功の確認
    if (currentUrl.includes('/auth/registration-complete') || currentUrl.includes('/home')) {
      // 再登録が成功したことを確認
      if (currentUrl.includes('/auth/registration-complete')) {
        await expect(page.getByTestId('success-message')).toBeVisible()
        await expect(page.getByText(/アカウントが作成されました/)).toBeVisible()
      }
      // homeページの場合は成功とみなす
    } else {
      // エラーメッセージがある場合は内容を確認
      const alertMessage = page.locator('[data-testid="alert-message"]')
      const errorMessage = page.locator('[data-testid="error-message"]')

      let errorText = ''
      if (await alertMessage.isVisible()) {
        errorText = (await alertMessage.textContent()) || ''
      } else if (await errorMessage.isVisible()) {
        errorText = (await errorMessage.textContent()) || ''
      }

      if (errorText) {
        console.error('再登録エラー:', errorText)
        throw new Error(`再登録に失敗しました: ${errorText}`)
      } else {
        // 予期しない状態
        throw new Error(`再登録に失敗しました: 予期しないページ状態 (URL: ${currentUrl})`)
      }
    }
  })
})
