import { test, expect } from '@playwright/test'
import { AuthHelper, createTestUser, cleanupTestUser } from '@e2e/helpers/auth-helpers'

test.describe('アカウント削除機能', () => {
  let authHelper: AuthHelper
  let testUser: ReturnType<typeof createTestUser>

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)
    testUser = createTestUser()

    // テストユーザーを登録してログイン
    await authHelper.register({
      username: testUser.userName,
      email: testUser.email,
      password: testUser.password,
      skinType: testUser.skinType,
    })

    // メール認証をスキップ（テスト環境用）
    const port = process.env.PORT || '3000'
    await fetch(`http://localhost:${port}/api/test/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email }),
    })

    // 利用規約・プライバシーポリシー同意をスキップ（テスト環境用）
    await fetch(`http://localhost:${port}/api/test/accept-terms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email }),
    })

    await authHelper.login(testUser.email, testUser.password)
  })

  test.afterEach(async () => {
    // テストユーザーをクリーンアップ（アカウント削除テストでは既に削除されている可能性があるため、エラーを無視）
    try {
      await cleanupTestUser(testUser.email)
    } catch {
      // エラーを無視
    }
  })

  test('アカウント削除ページにアクセスできる', async ({ page }) => {
    // プロフィールページから削除ページに遷移
    await page.goto('/profile')
    await page.getByTestId('delete-account-button').click()

    // 削除ページが表示されることを確認
    await expect(page).toHaveURL('/account/delete')
    await expect(page.getByRole('heading', { name: 'アカウント削除' })).toBeVisible()
    await expect(page.getByText('この操作は取り消すことができません')).toBeVisible()
  })

  test('アンケートをスキップしてアカウントを削除できる', async ({ page }) => {
    await page.goto('/account/delete')

    // 続行ボタンをクリック
    await page.getByRole('button', { name: 'アカウント削除を続行' }).click()

    // アンケートフォームが表示されることを確認
    await expect(page.getByText('退会理由をお聞かせください（任意）')).toBeVisible()

    // スキップボタンをクリック
    await page.getByRole('button', { name: 'スキップ' }).click()

    // パスワード入力画面が表示されることを確認
    await expect(page.getByText('最終確認:')).toBeVisible()
    await expect(page.getByLabel('パスワードを入力して削除を確認')).toBeVisible()

    // パスワードを入力
    await page.getByLabel('パスワードを入力して削除を確認').fill(testUser.password)

    // 削除ボタンをクリック
    await page.getByRole('button', { name: 'アカウントを削除' }).click()

    // トップページにリダイレクトされることを確認
    await page.waitForURL('/')

    // ログアウト状態になっていることを確認
    // モバイルビューの場合はハンバーガーメニューを開く
    const mobileMenuButton = page.getByTestId('mobile-menu-button')
    const isMobile = await mobileMenuButton.isVisible()

    if (isMobile) {
      await mobileMenuButton.click()
      // モバイルメニュー内のログインリンクを確認
      const mobileMenu = page.locator('.md\\:hidden').filter({ has: page.getByText('ログイン') })
      await expect(mobileMenu.getByRole('link', { name: 'ログイン' })).toBeVisible()
    } else {
      await expect(page.getByRole('link', { name: 'ログイン' })).toBeVisible()
    }
  })

  test('アンケートに回答してアカウントを削除できる', async ({ page }) => {
    await page.goto('/account/delete')

    // 続行ボタンをクリック
    await page.getByRole('button', { name: 'アカウント削除を続行' }).click()

    // アンケートフォームに回答
    // 複数の理由を選択
    await page.getByLabel('サービスが自分に合わなかった').check()
    await page.getByLabel('一時的に利用を休止したい').check()
    await page.getByLabel('その他').check()

    // その他の理由を入力
    await page.getByPlaceholder('理由を入力してください').fill('特定の機能が使いづらかった')

    // フィードバックを入力
    await page.getByLabel('ご意見・ご要望（任意）').fill('UIがもう少しシンプルだと良いと思います')

    // 推奨度を選択
    await page.getByLabel('はい').check()

    // 送信ボタンをクリック
    await page.getByRole('button', { name: 'アンケートを送信して次へ' }).click()

    // パスワード入力画面が表示されることを確認
    await expect(page.getByText('最終確認:')).toBeVisible()

    // パスワードを入力して削除
    await page.getByLabel('パスワードを入力して削除を確認').fill(testUser.password)
    await page.getByRole('button', { name: 'アカウントを削除' }).click()

    // トップページにリダイレクトされることを確認
    await page.waitForURL('/')
  })

  test('誤ったパスワードではアカウントを削除できない', async ({ page }) => {
    await page.goto('/account/delete')

    // 続行ボタンをクリック → アンケートをスキップ
    await page.getByRole('button', { name: 'アカウント削除を続行' }).click()
    await page.getByRole('button', { name: 'スキップ' }).click()

    // 誤ったパスワードを入力
    await page.getByLabel('パスワードを入力して削除を確認').fill('wrong-password')
    await page.getByRole('button', { name: 'アカウントを削除' }).click()

    // エラーメッセージが表示されることを確認
    await expect(page.getByTestId('error-message')).toBeVisible()
    await expect(page.getByTestId('error-message')).toContainText(
      'アカウント削除中にエラーが発生しました'
    )

    // まだ削除ページにいることを確認
    await expect(page).toHaveURL('/account/delete')
  })

  test('キャンセルボタンで初期状態に戻れる', async ({ page }) => {
    await page.goto('/account/delete')

    // 続行ボタンをクリック → アンケートをスキップ
    await page.getByRole('button', { name: 'アカウント削除を続行' }).click()
    await page.getByRole('button', { name: 'スキップ' }).click()

    // パスワードを入力
    await page.getByLabel('パスワードを入力して削除を確認').fill(testUser.password)

    // キャンセルボタンをクリック
    await page.getByRole('button', { name: 'キャンセル' }).click()

    // 初期状態に戻ることを確認
    await expect(page.getByRole('button', { name: 'アカウント削除を続行' })).toBeVisible()
    await expect(page.getByLabel('パスワードを入力して削除を確認')).not.toBeVisible()
  })

  test('削除後に同じアカウントでログインできない', async ({ page }) => {
    await page.goto('/account/delete')

    // アカウントを削除
    await page.getByRole('button', { name: 'アカウント削除を続行' }).click()
    await page.getByRole('button', { name: 'スキップ' }).click()
    await page.getByLabel('パスワードを入力して削除を確認').fill(testUser.password)
    await page.getByRole('button', { name: 'アカウントを削除' }).click()

    // トップページにリダイレクトされるのを待つ
    await page.waitForURL('/')

    // ログインページに移動
    await page.goto('/auth/login')

    // 削除したアカウントでログインを試みる
    await page.getByLabel('メールアドレス').fill(testUser.email)
    await page.getByTestId('password-input').fill(testUser.password)
    await page.getByRole('button', { name: 'ログイン' }).click()

    // エラーメッセージが表示されることを確認
    await expect(
      page.getByText(
        /メールアドレスまたはパスワードが正しくありません|アカウントが見つかりません|アカウントが無効です/
      )
    ).toBeVisible()
  })

  test('アンケートフォームが正しく動作する', async ({ page }) => {
    await page.goto('/account/delete')

    // 続行ボタンをクリック
    await page.getByRole('button', { name: 'アカウント削除を続行' }).click()

    // アンケートフォームが表示されることを確認
    await expect(page.getByText('退会理由をお聞かせください（任意）')).toBeVisible()

    // その他を選択すると、詳細入力フィールドが表示される
    await page.getByLabel('その他').check()
    await expect(page.getByLabel('その他の理由を詳しくお聞かせください')).toBeVisible()

    // その他の理由を入力
    await page.getByPlaceholder('理由を入力してください').fill('テスト理由')

    // 送信ボタンをクリック
    await page.getByRole('button', { name: 'アンケートを送信して次へ' }).click()

    // パスワード入力画面に進むことを確認
    await expect(page.getByText('最終確認:')).toBeVisible()
  })

  test('削除処理中はローディング状態が表示される', async ({ page }) => {
    await page.goto('/account/delete')

    // APIレスポンスを遅延させる
    await page.route('**/api/auth/delete-account', async route => {
      await page.waitForTimeout(1000) // 1秒待つ
      await route.continue()
    })

    // 続行ボタンをクリック → アンケートをスキップ
    await page.getByRole('button', { name: 'アカウント削除を続行' }).click()
    await page.getByRole('button', { name: 'スキップ' }).click()

    // パスワードを入力して削除
    await page.getByLabel('パスワードを入力して削除を確認').fill(testUser.password)
    await page.getByRole('button', { name: 'アカウントを削除' }).click()

    // ローディング状態が表示されることを確認
    await expect(page.getByRole('button', { name: '削除中...' })).toBeVisible()
    await expect(page.getByRole('button', { name: '削除中...' })).toBeDisabled()

    // 最終的にトップページにリダイレクトされることを確認
    await page.waitForURL('/', { timeout: 5000 })
  })
})
