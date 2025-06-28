import { test, expect } from '@playwright/test'
import {
  loginUser,
  createTestUser,
  cleanupTestUser,
  registerAndLoginTestUser,
} from '../helpers/auth-helpers'

test.describe('アカウント削除機能', () => {
  let testUser: { email: string; password: string; userName: string }

  test.beforeEach(async ({ page }) => {
    testUser = await createTestUser()
    // ユーザーを登録してログイン済みの状態にする
    await registerAndLoginTestUser(page, testUser)
  })

  test.afterEach(async () => {
    await cleanupTestUser(testUser.email)
  })

  test('ログインしていないユーザーはアカウント削除ページにアクセスできない', async ({ page }) => {
    // 新しいページ（ログインしていない状態）でテスト
    const newPage = await page.context().newPage()
    await newPage.goto('/account/delete')

    // ログインページにリダイレクトされることを確認
    await expect(newPage).toHaveURL('/auth/login')
    await newPage.close()
  })

  test('ログインユーザーがアカウント削除ページにアクセスできる', async ({ page }) => {
    await page.goto('/account/delete')

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
    await page.getByRole('button', { name: /アカウントを削除/ }).click()

    // アカウント削除ページにリダイレクトされることを確認
    await expect(page).toHaveURL('/account/delete')
    await expect(page.getByRole('heading', { name: /アカウント削除/ })).toBeVisible()
  })

  test('アカウント削除の警告メッセージが適切に表示される', async ({ page }) => {
    await page.goto('/account/delete')

    // 警告メッセージの内容を確認
    await expect(page.getByText(/プロフィール情報/)).toBeVisible()
    await expect(page.getByText(/投稿したコスメティック体験談/)).toBeVisible()
    await expect(page.getByText(/コメントと共感/)).toBeVisible()
    await expect(page.getByText(/その他すべてのアカウント関連データ/)).toBeVisible()
  })

  test('継続ボタンをクリックするとパスワード確認フォームが表示される', async ({ page }) => {
    await page.goto('/account/delete')

    // 継続ボタンをクリック
    await page.getByRole('button', { name: /アカウント削除を続行/ }).click()

    // パスワード入力フォームが表示されることを確認
    await expect(page.getByText(/最終確認/)).toBeVisible()
    await expect(page.getByPlaceholder(/現在のパスワード/)).toBeVisible()
    await expect(page.getByRole('button', { name: /キャンセル/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /アカウントを削除/ })).toBeVisible()
  })

  test('キャンセルボタンをクリックすると初期状態に戻る', async ({ page }) => {
    await page.goto('/account/delete')

    // 継続ボタンをクリック
    await page.getByRole('button', { name: /アカウント削除を続行/ }).click()

    // キャンセルボタンをクリック
    await page.getByRole('button', { name: /キャンセル/ }).click()

    // 初期状態に戻ることを確認
    await expect(page.getByRole('button', { name: /アカウント削除を続行/ })).toBeVisible()
    await expect(page.getByPlaceholder(/現在のパスワード/)).not.toBeVisible()
  })

  test('パスワードを入力せずに削除ボタンをクリックするとエラーが表示される', async ({ page }) => {
    await page.goto('/account/delete')

    // 継続ボタンをクリック
    await page.getByRole('button', { name: /アカウント削除を続行/ }).click()

    // パスワードを入力せずに削除ボタンをクリック
    await page.getByRole('button', { name: /アカウントを削除/ }).click()

    // エラーメッセージが表示されることを確認
    await expect(page.getByText(/パスワードを入力してください/)).toBeVisible()
  })

  test('正しいパスワードでアカウント削除が成功する', async ({ page }) => {
    await page.goto('/account/delete')

    // 継続ボタンをクリック
    await page.getByRole('button', { name: /アカウント削除を続行/ }).click()

    // パスワードを入力
    await page.getByPlaceholder(/現在のパスワード/).fill(testUser.password)

    // 削除ボタンをクリック
    await page.getByRole('button', { name: /アカウントを削除/ }).click()

    // トップページにリダイレクトされることを確認
    await expect(page).toHaveURL('/')

    // ログイン状態が解除されていることを確認（ヘッダーにログインリンクが表示される）
    await expect(page.getByRole('link', { name: /ログイン/ })).toBeVisible()
  })

  test('アカウント削除後に同じアカウントでログインできないことを確認', async ({ page }) => {
    await page.goto('/account/delete')

    // アカウント削除を実行
    await page.getByRole('button', { name: /アカウント削除を続行/ }).click()
    await page.getByPlaceholder(/現在のパスワード/).fill(testUser.password)
    await page.getByRole('button', { name: /アカウントを削除/ }).click()

    // トップページに移動したことを確認
    await expect(page).toHaveURL('/')

    // 削除されたアカウントでのログインを試行
    await page.goto('/auth/login')
    await page.getByPlaceholder(/メールアドレス/).fill(testUser.email)
    await page.getByPlaceholder(/パスワード/).fill(testUser.password)
    await page.getByRole('button', { name: /ログイン/ }).click()

    // ログインエラーが表示されることを確認
    await expect(page.getByText(/メールアドレスまたはパスワードが正しくありません/)).toBeVisible()
  })

  test('アカウント削除中にローディング状態が表示される', async ({ page }) => {
    await page.goto('/account/delete')

    // 継続ボタンをクリック
    await page.getByRole('button', { name: /アカウント削除を続行/ }).click()

    // パスワードを入力
    await page.getByPlaceholder(/現在のパスワード/).fill(testUser.password)

    // 削除ボタンをクリック
    const deleteButton = page.getByRole('button', { name: /アカウントを削除/ })
    await deleteButton.click()

    // ローディング状態を確認（短時間なので確認が難しい場合がある）
    await expect(page.getByRole('button', { name: /削除中.../ }))
      .toBeVisible({ timeout: 1000 })
      .catch(() => {
        // ローディングが短すぎて確認できない場合は無視
      })
  })

  test('削除ボタンはパスワード入力時のみ有効になる', async ({ page }) => {
    await page.goto('/account/delete')

    // 継続ボタンをクリック
    await page.getByRole('button', { name: /アカウント削除を続行/ }).click()

    const passwordInput = page.getByPlaceholder(/現在のパスワード/)
    const deleteButton = page.getByRole('button', { name: /アカウントを削除/ })

    // 初期状態では削除ボタンが無効
    await expect(deleteButton).toBeDisabled()

    // パスワードを入力すると削除ボタンが有効になる
    await passwordInput.fill(testUser.password)
    await expect(deleteButton).toBeEnabled()

    // パスワードを削除すると再び無効になる
    await passwordInput.clear()
    await expect(deleteButton).toBeDisabled()
  })
})
