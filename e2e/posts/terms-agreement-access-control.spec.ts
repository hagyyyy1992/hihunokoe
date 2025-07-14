import { test, expect } from '@playwright/test'
import { AuthHelper, cleanupTestUser } from '@e2e/helpers/auth-helpers'
import { PostHelper } from '@e2e/helpers/post-helpers'

test.describe('投稿詳細ページの利用規約同意チェック', () => {
  let authHelper: AuthHelper
  let postHelper: PostHelper
  let testPostId: string

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page)
    postHelper = new PostHelper(page)

    // レート制限をリセット
    try {
      const response = await page.request.post('http://localhost:3000/api/test/reset-rate-limiters')
      if (!response.ok()) {
        console.warn('Failed to reset rate limiters')
      }
    } catch (error) {
      console.warn('Failed to reset rate limiters:', error)
    }

    await page.waitForTimeout(500)

    // テスト用投稿を作成（利用規約同意済みユーザーで）
    const demoUser = { email: 'demo@example.com', password: 'demo1234' }

    // デモユーザーの利用規約同意状態を確保
    const port = process.env.PORT || '3000'
    await fetch(`http://localhost:${port}/api/test/accept-terms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: demoUser.email }),
    })

    // ログインして投稿作成
    await authHelper.login(demoUser.email, demoUser.password)

    const postData = {
      title: 'テスト投稿 - 利用規約チェック用',
      content: 'この投稿は利用規約同意チェックのテスト用です。',
      cosmeticName: 'テスト化粧品',
      cosmeticCategory: 'skincare',
      skinType: 'normal',
      moodTag: 'good',
      usageSituation: {
        season: 'spring',
        timeOfDay: 'morning',
        skinCondition: 'good',
        menstrualCycle: 'after',
      },
      experienceDetails: {
        fragrance: {
          type: 'floral',
          intensity: 'weak',
          description: 'フローラル系 (弱い)',
        },
        texture: {
          type: 'watery',
          spreadability: 'easy',
          absorption: 'fast',
          description: '水のような / よく伸びる / 浸透: 早い',
        },
        afterUse: {
          moisture: 'very_dry',
          texture: 'smooth',
          comfort: 'uncomfortable',
          duration: 'short',
          description:
            'うるおい感: とても乾燥 / 手触り: なめらか / 不快 / 持続時間: 短い（1-2時間）',
        },
      },
    }

    testPostId = await postHelper.createPostWithDetails(postData)
    await authHelper.logout()
  })

  test.afterEach(async ({ page }) => {
    // テスト後のクリーンアップ
    if (testPostId) {
      try {
        // テスト用投稿を削除
        await page.request.delete(`http://localhost:3000/api/posts/delete?id=${testPostId}`)
      } catch (error) {
        console.warn('Failed to cleanup test post:', error)
      }
    }
  })

  test('非ログインユーザーは詳細情報を見ることができず、ログイン促進メッセージが表示される', async ({
    page,
  }) => {
    // 投稿詳細ページにアクセス
    await page.goto(`/posts/${testPostId}`)

    // 投稿のタイトルと基本情報は表示される
    await expect(page.getByTestId('post-title')).toBeVisible()
    await expect(page.getByText('テスト投稿 - 利用規約チェック用')).toBeVisible()
    await expect(page.getByText('テスト化粧品')).toBeVisible()

    // 詳細情報セクションが表示される
    await expect(page.getByRole('heading', { name: '詳細情報' })).toBeVisible()
    await expect(page.getByText('使用状況')).toBeVisible()
    await expect(page.getByText('体験詳細')).toBeVisible()

    // 非ログインユーザー向けの「ログインして確認」メッセージが表示される
    await expect(page.getByText('ログインして確認')).toHaveCount(7) // 季節、時間帯、肌状態、生理周期、香り、テクスチャ、使用後

    // ログイン促進メッセージが表示される
    await expect(page.getByText('詳細情報を見るにはログインが必要です')).toBeVisible()
    await expect(page.getByRole('article').getByRole('link', { name: 'ログイン' })).toBeVisible()

    // 実際の詳細情報は表示されない
    await expect(page.getByText('春')).not.toBeVisible()
    await expect(page.getByText('朝')).not.toBeVisible()
    await expect(page.getByText('フローラル系（弱い）')).not.toBeVisible()
  })

  test('利用規約未同意のログインユーザーは詳細情報を見ることができず、利用規約同意促進メッセージが表示される', async ({
    page,
  }) => {
    // 新規ユーザーを作成（利用規約未同意）
    const newUser = await authHelper.generateUniqueUser()

    // 新規ユーザーを登録・認証
    await page.goto('/auth/register')
    await page.getByLabel('ユーザー名 *').fill(newUser.userName)
    await page.getByLabel('メールアドレス *').fill(newUser.email)
    await page.locator('input[name="password"]').fill(newUser.password)
    await page.locator('input[name="confirmPassword"]').fill(newUser.password)
    await page.getByRole('button', { name: '会員登録' }).click()

    // 登録完了を確認
    await expect(page.getByText('アカウントが作成されました')).toBeVisible()
    await page.waitForTimeout(2000)

    // メール認証を実行
    await authHelper.verifyEmail(newUser.email)
    await page.waitForTimeout(1000)

    // ログイン
    await page.goto('/auth/login')
    await page.getByLabel('メールアドレス').fill(newUser.email)
    await page.locator('input[name="password"]').fill(newUser.password)
    await page.getByRole('button', { name: 'ログイン' }).click()

    // 利用規約同意ページにリダイレクトされるが、キャンセルしてログイン状態のみにする
    await expect(page).toHaveURL('/auth/terms-agreement')
    await page.getByRole('button', { name: 'キャンセル' }).click()

    // 再度ログイン（利用規約未同意状態で）
    await page.goto('/auth/login')
    await page.getByLabel('メールアドレス').fill(newUser.email)
    await page.locator('input[name="password"]').fill(newUser.password)
    await page.getByRole('button', { name: 'ログイン' }).click()

    // 利用規約同意ページで再度キャンセル
    await expect(page).toHaveURL('/auth/terms-agreement')
    await page.getByRole('button', { name: 'キャンセル' }).click()

    // 投稿詳細ページに直接アクセス
    await page.goto(`/posts/${testPostId}`)

    // 投稿のタイトルと基本情報は表示される
    await expect(page.getByTestId('post-title')).toBeVisible()
    await expect(page.getByText('テスト投稿 - 利用規約チェック用')).toBeVisible()

    // 詳細情報セクションが表示される
    await expect(page.getByRole('heading', { name: '詳細情報' })).toBeVisible()
    await expect(page.getByText('使用状況')).toBeVisible()
    await expect(page.getByText('体験詳細')).toBeVisible()

    // 利用規約未同意ユーザー向けの「利用規約同意が必要」メッセージが表示される
    await expect(page.getByText('利用規約同意が必要')).toHaveCount(7) // 季節、時間帯、肌状態、生理周期、香り、テクスチャ、使用後

    // 利用規約同意促進メッセージが表示される
    await expect(page.getByText('⚠️ 詳細情報を見るには利用規約への同意が必要です')).toBeVisible()
    await expect(
      page.getByText(
        'サービスの詳細機能をご利用いただくために、利用規約とプライバシーポリシーへの同意をお願いします。'
      )
    ).toBeVisible()
    await expect(page.getByRole('link', { name: '利用規約に同意する' })).toBeVisible()

    // 実際の詳細情報は表示されない
    await expect(page.getByText('春')).not.toBeVisible()
    await expect(page.getByText('朝')).not.toBeVisible()
    await expect(page.getByText('フローラル系（弱い）')).not.toBeVisible()

    // クリーンアップ
    await cleanupTestUser(newUser.email)
  })

  test('利用規約同意済みのログインユーザーは詳細情報を完全に閲覧できる', async ({ page }) => {
    // デモユーザーでログイン（利用規約同意済み）
    const demoUser = { email: 'demo@example.com', password: 'demo1234' }

    // デモユーザーの利用規約同意状態を確保
    const port = process.env.PORT || '3000'
    await fetch(`http://localhost:${port}/api/test/accept-terms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: demoUser.email }),
    })

    await authHelper.login(demoUser.email, demoUser.password)

    // 投稿詳細ページにアクセス
    await page.goto(`/posts/${testPostId}`)

    // 投稿のタイトルと基本情報は表示される
    await expect(page.getByTestId('post-title')).toBeVisible()
    await expect(page.getByText('テスト投稿 - 利用規約チェック用')).toBeVisible()

    // 詳細情報セクションが表示される
    await expect(page.getByRole('heading', { name: '詳細情報' })).toBeVisible()
    await expect(page.getByText('使用状況')).toBeVisible()
    await expect(page.getByText('体験詳細')).toBeVisible()

    // 実際の詳細情報が表示される
    await expect(page.getByText('春')).toBeVisible() // 季節
    await expect(page.getByText('朝')).toBeVisible() // 時間帯
    await expect(page.getByText('調子が良い')).toBeVisible() // 肌状態
    await expect(page.getByText('生理後')).toBeVisible() // 生理周期

    // 体験詳細の情報が表示される
    await expect(page.getByText('フローラル系 (弱い)')).toBeVisible()
    await expect(page.getByText('水のような')).toBeVisible()
    await expect(page.getByText('よく伸びる')).toBeVisible()
    await expect(page.getByText('早い')).toBeVisible()
    await expect(page.getByText('とても乾燥')).toBeVisible()
    await expect(page.getByText('なめらか')).toBeVisible()
    await expect(page.getByText('不快')).toBeVisible()
    await expect(page.getByText('短い（1-2時間）')).toBeVisible()

    // アクセス制限メッセージは表示されない
    await expect(page.getByText('ログインして確認')).not.toBeVisible()
    await expect(page.getByText('利用規約同意が必要')).not.toBeVisible()
    await expect(page.getByText('詳細情報を見るにはログインが必要です')).not.toBeVisible()
    await expect(
      page.getByText('⚠️ 詳細情報を見るには利用規約への同意が必要です')
    ).not.toBeVisible()
  })

  test('利用規約未同意ユーザーが「利用規約に同意する」リンクをクリックすると利用規約同意ページに遷移する', async ({
    page,
  }) => {
    // 新規ユーザーを作成（利用規約未同意）
    const newUser = await authHelper.generateUniqueUser()

    // 新規ユーザーを登録・認証・ログイン（利用規約未同意状態）
    await page.goto('/auth/register')
    await page.getByLabel('ユーザー名 *').fill(newUser.userName)
    await page.getByLabel('メールアドレス *').fill(newUser.email)
    await page.locator('input[name="password"]').fill(newUser.password)
    await page.locator('input[name="confirmPassword"]').fill(newUser.password)
    await page.getByRole('button', { name: '会員登録' }).click()

    await expect(page.getByText('アカウントが作成されました')).toBeVisible()
    await page.waitForTimeout(2000)

    await authHelper.verifyEmail(newUser.email)
    await page.waitForTimeout(1000)

    await page.goto('/auth/login')
    await page.getByLabel('メールアドレス').fill(newUser.email)
    await page.locator('input[name="password"]').fill(newUser.password)
    await page.getByRole('button', { name: 'ログイン' }).click()

    // 利用規約同意ページをキャンセル
    await expect(page).toHaveURL('/auth/terms-agreement')
    await page.getByRole('button', { name: 'キャンセル' }).click()

    // 投稿詳細ページにアクセス
    await page.goto(`/posts/${testPostId}`)

    // 利用規約同意促進リンクをクリック
    await page.getByRole('link', { name: '利用規約に同意する' }).click()

    // 利用規約同意ページに遷移することを確認
    await expect(page).toHaveURL('/auth/terms-agreement')
    await expect(page.getByRole('heading', { name: '利用規約への同意' })).toBeVisible()

    // クリーンアップ
    await cleanupTestUser(newUser.email)
  })

  test('利用規約未同意ユーザーが利用規約に同意した後は詳細情報を閲覧できるようになる', async ({
    page,
  }) => {
    // 新規ユーザーを作成（利用規約未同意）
    const newUser = await authHelper.generateUniqueUser()

    // 新規ユーザーを登録・認証・ログイン
    await page.goto('/auth/register')
    await page.getByLabel('ユーザー名 *').fill(newUser.userName)
    await page.getByLabel('メールアドレス *').fill(newUser.email)
    await page.locator('input[name="password"]').fill(newUser.password)
    await page.locator('input[name="confirmPassword"]').fill(newUser.password)
    await page.getByRole('button', { name: '会員登録' }).click()

    await expect(page.getByText('アカウントが作成されました')).toBeVisible()
    await page.waitForTimeout(2000)

    await authHelper.verifyEmail(newUser.email)
    await page.waitForTimeout(1000)

    await page.goto('/auth/login')
    await page.getByLabel('メールアドレス').fill(newUser.email)
    await page.locator('input[name="password"]').fill(newUser.password)
    await page.getByRole('button', { name: 'ログイン' }).click()

    // 利用規約同意ページで同意を完了
    await expect(page).toHaveURL('/auth/terms-agreement')

    // 利用規約とプライバシーポリシーのリンクをクリック
    await page.getByRole('main').getByRole('link', { name: '利用規約' }).click()
    await page.waitForTimeout(100)
    await page.getByRole('main').getByRole('link', { name: 'プライバシーポリシー' }).click()

    // 最小読了時間を待つ（3秒）
    await page.waitForTimeout(3100)

    // 同意チェックボックスをチェック
    await page.getByTestId('agree-terms-checkbox').check()
    await page.getByTestId('agree-privacy-checkbox').check()

    // 同意ボタンをクリック
    await page.getByTestId('submit-agreement-button').click()

    // ホームページにリダイレクトされることを確認
    await expect(page).toHaveURL('/home')

    // セッションが維持されていることを確認
    await page.waitForTimeout(1000)

    // 投稿詳細ページにアクセス
    await page.goto(`/posts/${testPostId}`)
    await page.waitForLoadState('networkidle')

    // ログインしていることを確認（ログインページにリダイレクトされていないこと）
    await expect(page).not.toHaveURL('/auth/login')

    // 詳細情報が表示されることを確認
    await expect(page.getByText('春')).toBeVisible() // 季節
    await expect(page.getByText('朝')).toBeVisible() // 時間帯
    await expect(page.getByText('フローラル系 (弱い)')).toBeVisible()

    // アクセス制限メッセージは表示されない
    await expect(page.getByText('利用規約同意が必要')).not.toBeVisible()
    await expect(
      page.getByText('⚠️ 詳細情報を見るには利用規約への同意が必要です')
    ).not.toBeVisible()

    // クリーンアップは最後に実行（セッションが無効化される可能性があるため）
    // await cleanupTestUser(newUser.email)
  })
})
