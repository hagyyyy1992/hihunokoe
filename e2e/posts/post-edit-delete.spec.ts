import { test, expect } from '@playwright/test'
import { AuthHelper } from '../helpers/auth-helpers'
import { PostHelper } from '../helpers/post-helpers'

test.describe('投稿編集・削除機能', () => {
  let authHelper: AuthHelper
  let postHelper: PostHelper

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)
    postHelper = new PostHelper(page)
  })

  test('投稿編集機能', async ({ page }) => {
    // ログインして投稿を作成
    await authHelper.registerAndLogin()
    const timestamp = Date.now()
    const originalPost = {
      title: `編集テスト用投稿-${timestamp}`,
      content: '編集前の内容です',
      cosmeticName: '編集前の化粧品',
      cosmeticCategory: 'toner',
      skinType: 'normal',
      moodTag: 'good',
    }

    await postHelper.createPost(originalPost)

    // 投稿一覧から詳細ページに移動
    await page.goto('/posts')
    await page.getByRole('link', { name: originalPost.title }).click()

    // 編集ボタンが表示されることを確認（自分の投稿）
    await expect(page.getByTestId('edit-post-button')).toBeVisible()
    await page.getByTestId('edit-post-button').click()

    // 編集フォームが表示されることを確認
    await expect(page.locator('input[name="title"]')).toHaveValue(originalPost.title)
    await expect(page.locator('textarea[name="content"]')).toHaveValue(originalPost.content)
    await expect(page.locator('input[name="cosmeticName"]')).toHaveValue(originalPost.cosmeticName)

    // 投稿内容を編集
    const editedPost = {
      title: '編集後のタイトル',
      content: '編集後の内容です。詳細を追加しました。',
      cosmeticName: '編集後の化粧品',
      cosmeticCategory: 'foundation',
      skinType: 'dry',
      moodTag: 'love',
    }

    await page.locator('input[name="title"]').fill(editedPost.title)
    await page.locator('textarea[name="content"]').fill(editedPost.content)
    await page.locator('input[name="cosmeticName"]').fill(editedPost.cosmeticName)
    await page.locator('select[name="cosmeticCategory"]').selectOption(editedPost.cosmeticCategory)
    await page.locator('select[name="skinType"]').selectOption(editedPost.skinType)
    await page.locator('select[name="moodTag"]').selectOption(editedPost.moodTag)

    // 更新ボタンをクリック
    await page.getByRole('button', { name: '更新' }).click()

    // 更新完了メッセージが表示されることを確認
    await expect(page.getByText('投稿を更新しました')).toBeVisible()

    // 編集された内容が表示されることを確認
    await expect(page.getByRole('heading', { name: editedPost.title })).toBeVisible()
    await expect(page.getByText(editedPost.content)).toBeVisible()
    await expect(page.getByText(editedPost.cosmeticName)).toBeVisible()
  })

  test('投稿削除機能', async ({ page }) => {
    // ログインして投稿を作成
    await authHelper.registerAndLogin()
    const timestamp = Date.now()
    const postData = {
      title: `削除テスト用投稿-${timestamp}`,
      content: '削除予定の投稿です',
      cosmeticName: '削除テスト化粧品',
      cosmeticCategory: 'cleansing',
      skinType: 'combination',
      moodTag: 'okay',
    }

    await postHelper.createPost(postData)

    // 投稿一覧から詳細ページに移動
    await page.goto('/posts')
    await page.getByRole('link', { name: postData.title }).click()

    // 削除ボタンが表示されることを確認（自分の投稿）
    await expect(page.getByTestId('post-menu-button')).toBeVisible()
    await page.getByTestId('post-menu-button').click()

    // 削除確認ダイアログが表示されることを確認
    await expect(page.getByText('投稿を削除しますか？')).toBeVisible()
    await expect(page.getByText('この操作は取り消せません')).toBeVisible()
    await expect(page.getByRole('button', { name: '削除する' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'キャンセル' })).toBeVisible()

    // キャンセルボタンをクリック
    await page.getByRole('button', { name: 'キャンセル' }).click()

    // ダイアログが閉じることを確認
    await expect(page.getByText('投稿を削除しますか？')).not.toBeVisible()

    // 投稿が削除されていないことを確認
    await expect(page.getByRole('heading', { name: postData.title })).toBeVisible()

    // 再度削除ボタンをクリック
    await page.getByTestId('post-menu-button').click()
    await page.getByRole('button', { name: '削除する' }).click()

    // 削除完了メッセージが表示されることを確認
    await expect(page.getByText('投稿を削除しました')).toBeVisible()

    // 投稿一覧ページにリダイレクトされることを確認
    await expect(page).toHaveURL('/posts')

    // 削除された投稿が一覧に表示されないことを確認
    await expect(page.getByText(postData.title)).not.toBeVisible()
  })

  test('他人の投稿の編集・削除権限チェック', async ({ page }) => {
    // 最初のユーザーで投稿を作成
    await authHelper.registerAndLogin()
    const timestamp = Date.now()
    const postData = {
      title: `権限テスト用投稿-${timestamp}`,
      content: '他人の投稿テストです',
      cosmeticName: '権限テスト化粧品',
      cosmeticCategory: 'serum',
      skinType: 'sensitive',
      moodTag: 'disappointed',
    }

    await postHelper.createPost(postData)

    // 別のユーザーでログイン
    await authHelper.logout()
    await authHelper.registerAndLogin()

    // 他人の投稿詳細ページに移動
    await page.goto('/posts')
    await page.getByRole('link', { name: postData.title }).click()

    // 編集・削除ボタンが表示されないことを確認
    await expect(page.getByTestId('edit-post-button')).not.toBeVisible()
    await expect(page.getByTestId('post-menu-button')).not.toBeVisible()

    // 投稿内容は表示されることを確認
    await expect(page.getByRole('heading', { name: postData.title })).toBeVisible()
    await expect(page.getByText(postData.content)).toBeVisible()
  })

  test('投稿編集時のバリデーション', async ({ page }) => {
    // ログインして投稿を作成
    await authHelper.registerAndLogin()
    const timestamp = Date.now()
    const postData = {
      title: `バリデーションテスト用投稿-${timestamp}`,
      content: 'バリデーションテストです',
      cosmeticName: 'テスト化粧品',
      cosmeticCategory: 'moisturizer',
      skinType: 'normal',
      moodTag: 'good',
    }

    await postHelper.createPost(postData)

    // 投稿詳細ページに移動して編集
    await page.goto('/posts')
    await page.getByRole('link', { name: postData.title }).click()
    await page.getByTestId('edit-post-button').click()

    // 必須項目を空にする
    await page.locator('input[name="title"]').fill('')
    await page.locator('textarea[name="content"]').fill('')
    await page.locator('input[name="cosmeticName"]').fill('')

    // 更新ボタンをクリック
    await page.getByRole('button', { name: '更新' }).click()

    // バリデーションエラーが表示されることを確認
    await expect(page.getByText('タイトルを入力してください')).toBeVisible()
    await expect(page.getByText('内容を入力してください')).toBeVisible()
    await expect(page.getByText('化粧品名を入力してください')).toBeVisible()

    // 文字数制限のテスト
    const longTitle = 'あ'.repeat(201) // 200文字制限を超える
    const longContent = 'あ'.repeat(5001) // 5000文字制限を超える
    const longCosmeticName = 'あ'.repeat(101) // 100文字制限を超える

    await page.locator('input[name="title"]').fill(longTitle)
    await page.locator('textarea[name="content"]').fill(longContent)
    await page.locator('input[name="cosmeticName"]').fill(longCosmeticName)

    await page.getByRole('button', { name: '更新' }).click()

    // 文字数制限エラーが表示されることを確認
    await expect(page.getByText('タイトルは200文字以内で入力してください')).toBeVisible()
    await expect(page.getByText('内容は5000文字以内で入力してください')).toBeVisible()
    await expect(page.getByText('化粧品名は100文字以内で入力してください')).toBeVisible()
  })

  test('投稿編集のキャンセル機能', async ({ page }) => {
    // ログインして投稿を作成
    await authHelper.registerAndLogin()
    const timestamp = Date.now()
    const originalPost = {
      title: `キャンセルテスト用投稿-${timestamp}`,
      content: '元の内容です',
      cosmeticName: '元の化粧品',
      cosmeticCategory: 'sunscreen',
      skinType: 'combination',
      moodTag: 'love',
    }

    await postHelper.createPost(originalPost)

    // 投稿詳細ページに移動して編集
    await page.goto('/posts')
    await page.getByRole('link', { name: originalPost.title }).click()
    await page.getByTestId('edit-post-button').click()

    // 内容を変更
    await page.locator('input[name="title"]').fill('変更されたタイトル')
    await page.locator('textarea[name="content"]').fill('変更された内容')

    // キャンセルボタンをクリック
    await page.getByRole('button', { name: 'キャンセル' }).click()

    // 元の内容が表示されることを確認
    await expect(page.getByRole('heading', { name: originalPost.title })).toBeVisible()
    await expect(page.getByText(originalPost.content)).toBeVisible()

    // 変更内容が破棄されていることを確認
    await expect(page.getByText('変更されたタイトル')).not.toBeVisible()
    await expect(page.getByText('変更された内容')).not.toBeVisible()
  })

  test('投稿削除後の関連データの処理', async ({ page }) => {
    // ログインして投稿を作成
    await authHelper.registerAndLogin()
    const timestamp = Date.now()
    const postData = {
      title: `関連データテスト用投稿-${timestamp}`,
      content: '関連データテストです',
      cosmeticName: 'テスト化粧品',
      cosmeticCategory: 'toner',
      skinType: 'normal',
      moodTag: 'good',
    }

    await postHelper.createPost(postData)

    // 投稿詳細ページに移動
    await page.goto('/posts')
    await page.getByRole('link', { name: postData.title }).click()

    // 投稿を削除
    await page.getByTestId('post-menu-button').click()
    await page.getByRole('button', { name: '削除する' }).click()

    // 削除完了メッセージが表示されることを確認
    await expect(page.getByText('投稿を削除しました')).toBeVisible()

    // 削除された投稿のURLに直接アクセスした場合
    const deletedPostUrl = page.url().replace('/posts', `/posts/${postData.title}`)
    await page.goto(deletedPostUrl)

    // 404エラーページまたは「投稿が見つかりません」メッセージが表示されることを確認
    await expect(page.getByText('投稿が見つかりません').or(page.getByText('404'))).toBeVisible()
  })
})
