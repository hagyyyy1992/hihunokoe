import { test, expect } from '@playwright/test'
import { AuthHelper, createTestUser, cleanupTestUser } from '@e2e/helpers/auth-helpers'
import { ProfileHelper } from '@e2e/helpers/profile-helpers'

test.describe('プロフィール編集機能', () => {
  let authHelper: AuthHelper
  let profileHelper: ProfileHelper
  let testUser: ReturnType<typeof createTestUser>

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)
    profileHelper = new ProfileHelper(page)
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

    await authHelper.login(testUser.email, testUser.password)
  })

  test.afterEach(async () => {
    // テストユーザーをクリーンアップ
    await cleanupTestUser(testUser.email)
  })

  test('プロフィール画面を表示できる', async ({ page }) => {
    await profileHelper.navigateToProfile()

    // プロフィール画面の要素が表示されていることを確認
    await expect(page.locator('h1').filter({ hasText: 'プロフィール' })).toBeVisible()
    await expect(page.getByTestId('edit-profile-button')).toBeVisible()

    // ユーザー情報が表示されていることを確認
    await profileHelper.expectProfileData({
      userName: testUser.userName,
      email: testUser.email,
    })
  })

  test('プロフィールを編集できる', async ({ page }) => {
    await profileHelper.navigateToProfile()
    await profileHelper.clickEditButton()

    // フォームに新しい値を入力
    const updatedData = {
      userName: `${testUser.userName}-updated`,
      skinType: 'dry',
      birthDate: '1990-01-01',
      gender: 'female',
      allergies: ['fragrance', 'alcohol'],
    }

    await profileHelper.fillProfileForm(updatedData)
    await profileHelper.saveProfile()

    // 成功メッセージが表示されることを確認
    await profileHelper.expectSuccessMessage()

    // ページをリロードして更新されたデータが保存されていることを確認
    await page.reload()
    await page.waitForLoadState('networkidle')

    // 更新されたデータが表示されることを確認
    await profileHelper.expectProfileData(updatedData)
  })

  test('ユーザー名のバリデーションが機能する', async ({ page }) => {
    await profileHelper.navigateToProfile()
    await profileHelper.clickEditButton()

    // 短すぎるユーザー名
    await profileHelper.fillProfileForm({ userName: 'ab' })
    await profileHelper.saveProfile()

    // エラーメッセージが表示されることを確認
    await expect(page.getByText('ユーザー名は3文字以上で入力してください')).toBeVisible()

    // 長すぎるユーザー名
    await profileHelper.fillProfileForm({ userName: 'a'.repeat(51) })
    await profileHelper.saveProfile()

    // エラーメッセージが表示されることを確認
    await expect(page.getByText('ユーザー名は50文字以内で入力してください')).toBeVisible()
  })

  test('編集をキャンセルできる', async ({ page }) => {
    await profileHelper.navigateToProfile()

    // 現在の値を記憶
    const originalUserName = testUser.userName

    await profileHelper.clickEditButton()

    // フォームに新しい値を入力
    await profileHelper.fillProfileForm({
      userName: 'changed-name',
      skinType: 'oily',
    })

    // キャンセルボタンをクリック
    await profileHelper.cancelEdit()

    // 元の値が表示されていることを確認
    await profileHelper.expectProfileData({
      userName: originalUserName,
    })
  })

  test('アレルギー情報を複数選択できる', async ({ page }) => {
    await profileHelper.navigateToProfile()
    await profileHelper.clickEditButton()

    // 複数のアレルギーを選択
    const allergies = ['fragrance', 'paraben', 'sulfate']
    await profileHelper.fillProfileForm({ allergies })
    await profileHelper.saveProfile()

    // 成功メッセージが表示されることを確認
    await profileHelper.expectSuccessMessage()

    // ページをリロードして更新されたデータが保存されていることを確認
    await page.reload()
    await page.waitForLoadState('networkidle')

    // 選択したアレルギーが表示されることを確認
    await profileHelper.expectProfileData({ allergies })
  })

  test('その他のアレルギーを入力できる', async ({ page }) => {
    await profileHelper.navigateToProfile()
    await profileHelper.clickEditButton()

    // その他を選択してテキストを入力
    await profileHelper.fillProfileForm({
      allergies: ['other'],
      allergiesOther: 'ビタミンC誘導体',
    })
    await profileHelper.saveProfile()

    // 成功メッセージが表示されることを確認
    await profileHelper.expectSuccessMessage()

    // ページをリロードして更新されたデータが保存されていることを確認
    await page.reload()
    await page.waitForLoadState('networkidle')

    // その他のアレルギーが表示されることを確認
    await expect(page.getByText('ビタミンC誘導体')).toBeVisible()
  })

  test('アカウント削除ボタンが機能する', async ({ page }) => {
    await profileHelper.navigateToProfile()

    // アカウント削除ボタンをクリック
    await profileHelper.clickDeleteAccountButton()

    // アカウント削除ページに遷移することを確認
    await expect(page).toHaveURL('/account/delete')

    // 新しいアカウント削除フローが表示されることを確認
    await expect(page.getByRole('heading', { name: 'アカウント削除' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'アカウント削除を続行' })).toBeVisible()
  })

  test('編集中にエラーが発生した場合のエラーメッセージ表示', async ({ page }) => {
    await profileHelper.navigateToProfile()
    await profileHelper.clickEditButton()

    // APIエラーをシミュレートするため、非常に長いユーザー名を設定
    // （実際のAPIエラーシミュレーションは、APIモックやインターセプトを使用）
    await profileHelper.fillProfileForm({ userName: 'valid-name' })

    // ネットワークエラーをインターセプト
    await page.route('**/api/profile', route => {
      route.abort('failed')
    })

    await profileHelper.saveProfile()

    // エラーメッセージが表示されることを確認
    await expect(page.locator('.bg-red-50')).toBeVisible()
  })

  test('空の値を送信した場合はnullとして保存される', async ({ page }) => {
    await profileHelper.navigateToProfile()
    await profileHelper.clickEditButton()

    // 初期値を設定
    await profileHelper.fillProfileForm({
      skinType: 'normal',
      birthDate: '1990-01-01',
      gender: 'male',
    })
    await profileHelper.saveProfile()
    await profileHelper.expectSuccessMessage()

    // ページをリロードして値が保存されていることを確認
    await page.reload()
    await page.waitForLoadState('networkidle')

    // 編集モードに戻る
    await profileHelper.clickEditButton()

    // 空の値に変更
    await profileHelper.fillProfileForm({
      skinType: '',
      birthDate: '',
      gender: '',
    })
    await profileHelper.saveProfile()

    // 成功メッセージが表示されることを確認
    await profileHelper.expectSuccessMessage()

    // ページをリロードして値が空になっていることを確認
    await page.reload()
    await page.waitForLoadState('networkidle')

    // 値が空になっていることを確認（表示されない）
    await expect(page.getByText('普通肌')).not.toBeVisible()
    await expect(page.getByText('1990/1/1')).not.toBeVisible()
    await expect(page.getByText('男性')).not.toBeVisible()
  })
})
