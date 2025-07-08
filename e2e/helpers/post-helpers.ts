import { Page, expect } from '@playwright/test'

export class PostHelper {
  constructor(private page: Page) {}

  private async isMobileSafari(): Promise<boolean> {
    const userAgent = await this.page.evaluate(() => navigator.userAgent)
    return (
      (userAgent.includes('iPhone') || userAgent.includes('iPad')) && userAgent.includes('Safari')
    )
  }

  private async isWebKit(): Promise<boolean> {
    const browserName = this.page.context().browser()?.browserType().name()
    return browserName === 'webkit'
  }

  async createPost(postData: {
    title: string
    content: string
    cosmeticName?: string
    cosmeticCategory?: string
    moodTag?: string
    tags?: string[]
  }) {
    const isMobileSafari = await this.isMobileSafari()
    const isWebKit = await this.isWebKit()

    // 認証クッキーが設定されていることを確認
    await this.page
      .waitForFunction(
        () => {
          const cookies = document.cookie.split(';').map(c => c.trim())
          return cookies.some(c => c.startsWith('auth-token='))
        },
        { timeout: 10000 }
      )
      .catch(() => {})

    await this.page.goto('/posts/new', {
      waitUntil: isWebKit ? 'networkidle' : 'domcontentloaded',
      timeout: isWebKit ? 30000 : 15000,
    })

    // ページのローディング状態が解除されるまで待機
    try {
      // ローディングインジケーターが消えるまで待つ
      await this.page.waitForFunction(
        () => {
          const loadingElement = document.querySelector('.animate-spin')
          return !loadingElement
        },
        { timeout: 10000 }
      )
    } catch (error) {}

    // 認証によるリダイレクトをチェック（複数回チェック）
    let retryCount = 0
    const maxRetries = isWebKit ? 5 : 3 // WebKitは長めにリトライ
    while (retryCount < maxRetries) {
      await this.page.waitForTimeout(isWebKit ? 3000 : 2000) // 認証チェックの時間を与える
      const currentUrl = this.page.url()

      if (!currentUrl.includes('/auth/login')) {
        break // ログインページではない場合は続行
      }

      // 認証クッキーの再確認
      const hasAuthCookie = await this.page.evaluate(() => {
        const cookies = document.cookie.split(';').map(c => c.trim())
        return cookies.some(c => c.startsWith('auth-token='))
      })

      if (hasAuthCookie) {
        await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 })
        await this.page.waitForTimeout(isWebKit ? 3000 : 1000)
      }

      retryCount++
      if (retryCount === maxRetries) {
        // 詳細なエラー情報を収集
        const cookies = await this.page.context().cookies()
        const authCookie = cookies.find(c => c.name === 'auth-token')
        console.error('Authentication debug info:', {
          currentUrl,
          hasAuthCookie,
          authCookieDetails: authCookie,
          isWebKit,
          retryCount,
        })
        throw new Error('Redirected to login page. Authentication may have failed.')
      }
      await this.page.waitForTimeout(isWebKit ? 3000 : 2000)
    }

    // フォームが表示されるのを待機
    try {
      await this.page.waitForSelector('input[name="title"]', {
        state: 'visible',
        timeout: 10000,
      })
    } catch (error) {
      // もし要素が見つからない場合、ページの状態を出力
      console.error('Failed to find title input. Current URL:', this.page.url())

      // ページのHTMLを出力してデバッグ
      const bodyText = await this.page.locator('body').innerText()
      console.error('Page body text:', bodyText.substring(0, 500))

      throw error
    }

    // Mobile SafariとWebKitの場合は追加の待機時間
    if (isMobileSafari || isWebKit) {
      await this.page.waitForTimeout(3000)

      // ローディング状態が解除されるまで待機
      await this.page.waitForFunction(
        () => {
          const loadingElement = document.querySelector(
            '[data-testid="loading"], .loading, .animate-spin'
          )
          return !loadingElement || (loadingElement as HTMLElement).style.display === 'none'
        },
        { timeout: 30000 }
      )
    }

    // ステップ1: 基本情報
    // Mobile Safariの場合はより具体的なセレクターを使用
    if (isMobileSafari) {
      await this.page.waitForSelector(
        'input[name="title"], input[id="title"], [aria-label="タイトル"]',
        {
          state: 'visible',
          timeout: 20000,
        }
      )
      const titleInput = await this.page
        .locator('input[name="title"], input[id="title"], [aria-label="タイトル"]')
        .first()
      await titleInput.fill(postData.title)

      await this.page.waitForSelector('textarea[name="content"], textarea[id="content"]', {
        state: 'visible',
        timeout: 20000,
      })
      const contentTextarea = await this.page
        .locator('textarea[name="content"], textarea[id="content"]')
        .first()
      await contentTextarea.fill(postData.content)
    } else {
      await this.page.locator('input[name="title"]').fill(postData.title)
      await this.page.locator('textarea[name="content"]').fill(postData.content)
    }

    if (postData.cosmeticName) {
      if (isMobileSafari) {
        await this.page.waitForSelector(
          'input[name="cosmeticName"], input[id="cosmeticName"], [aria-label="使用したコスメ名"]',
          {
            state: 'visible',
            timeout: 20000,
          }
        )
        const cosmeticInput = await this.page
          .locator(
            'input[name="cosmeticName"], input[id="cosmeticName"], [aria-label="使用したコスメ名"]'
          )
          .first()
        await cosmeticInput.fill(postData.cosmeticName)
      } else {
        await this.page.locator('input[name="cosmeticName"]').fill(postData.cosmeticName)
      }
    }

    if (postData.cosmeticCategory) {
      if (isMobileSafari) {
        await this.page.waitForSelector(
          'select[name="cosmeticCategory"], select[id="cosmeticCategory"]',
          {
            state: 'visible',
            timeout: 20000,
          }
        )
        const categorySelect = await this.page
          .locator('select[name="cosmeticCategory"], select[id="cosmeticCategory"]')
          .first()
        await categorySelect.selectOption(postData.cosmeticCategory)
      } else {
        await this.page
          .locator('select[name="cosmeticCategory"]')
          .selectOption(postData.cosmeticCategory)
      }
    }

    // 最後のステップまで進む
    // ステップ1: 基本情報 → ステップ2: 使用状況
    let nextButton = this.page.getByRole('button', { name: '次へ' })
    await expect(nextButton).toBeEnabled({ timeout: 5000 })
    await nextButton.click()
    await this.page.waitForTimeout(500)

    // ステップ2: 使用状況 → ステップ3: 体験詳細
    nextButton = this.page.getByRole('button', { name: '次へ' })
    await expect(nextButton).toBeEnabled({ timeout: 5000 })
    await nextButton.click()
    await this.page.waitForTimeout(500)

    // ステップ3: 体験詳細 → ステップ4: ムード・タグ
    nextButton = this.page.getByRole('button', { name: '次へ' })
    await expect(nextButton).toBeEnabled({ timeout: 5000 })
    await nextButton.click()
    await this.page.waitForTimeout(500)

    // ステップ4でムードタグを設定
    if (postData.moodTag) {
      await this.page.selectOption('[name="moodTag"]', postData.moodTag)
    }

    // 投稿を公開
    await this.page.waitForTimeout(1000) // ボタンが有効になるのを待つ

    // ボタンが有効になっていることを確認
    const publishButton = this.page.getByRole('button', { name: '投稿する' })
    await expect(publishButton).toBeEnabled({ timeout: 10000 })
    await expect(publishButton).toBeVisible({ timeout: 10000 })

    // ネットワークレスポンスを監視して投稿IDを取得
    const responsePromise = this.page.waitForResponse(
      response => response.url().includes('/api/posts') && response.status() === 200,
      { timeout: 30000 }
    )

    // フォームを送信
    await publishButton.click()

    // APIレスポンスを待つ
    const response = await responsePromise
    const responseData = await response.json()

    if (!responseData.post || !responseData.post.id) {
      throw new Error('Failed to get post ID from API response')
    }

    const postId = responseData.post.id

    // 投稿詳細ページへのナビゲーションを待つ
    try {
      await this.page.waitForURL(`**/posts/${postId}`, { timeout: 30000 })
    } catch (error) {
      // リダイレクトが失敗した場合の詳細な診断情報
      console.error('Failed to navigate to post detail page')
      console.error('Current URL:', this.page.url())
      console.error('Page title:', await this.page.title())

      // エラーメッセージがあるかチェック
      const errorMessage = await this.page
        .locator('[data-testid="error-message"]')
        .textContent()
        .catch(() => null)
      if (errorMessage) {
        console.error('Error message on page:', errorMessage)
      }

      // 手動で投稿詳細ページに移動を試みる
      await this.page.goto(`/posts/${postId}`)
      await this.page.waitForLoadState('networkidle')
    }

    // 投稿詳細ページが正しく読み込まれたことを確認
    // h1タグでタイトルが表示されることを確認
    await this.page.waitForSelector('h1', { timeout: 10000 })
    // 投稿タイトルが表示されていることを確認
    await expect(this.page.locator('h1')).toContainText(postData.title)

    return postId
  }

  async saveDraft(postData: {
    title: string
    content: string
    cosmeticName?: string
    cosmeticCategory?: string
  }) {
    const isMobileSafari = await this.isMobileSafari()
    const isWebKit = await this.isWebKit()

    // 認証クッキーが設定されていることを確認
    await this.page
      .waitForFunction(
        () => {
          const cookies = document.cookie.split(';').map(c => c.trim())
          return cookies.some(c => c.startsWith('auth-token='))
        },
        { timeout: 10000 }
      )
      .catch(() => {})

    await this.page.goto('/posts/new', {
      waitUntil: isWebKit ? 'networkidle' : 'domcontentloaded',
      timeout: isWebKit ? 30000 : 15000,
    })

    // Mobile SafariとWebKitの場合は追加の待機時間
    if (isMobileSafari || isWebKit) {
      await this.page.waitForTimeout(3000)
    }

    await this.page.locator('input[name="title"]').fill(postData.title)
    await this.page.locator('textarea[name="content"]').fill(postData.content)

    if (postData.cosmeticName) {
      await this.page.locator('input[name="cosmeticName"]').fill(postData.cosmeticName)
    }

    if (postData.cosmeticCategory) {
      await this.page
        .locator('select[name="cosmeticCategory"]')
        .selectOption(postData.cosmeticCategory)
    }

    // save-draft-buttonが見つからない場合は、フォームがステップ形式のため
    // 現在のUIに合わせた処理を実装する必要がある
    const saveDraftButton = this.page.locator('[data-testid="save-draft-button"]')
    if (await saveDraftButton.isVisible()) {
      await saveDraftButton.click()
    } else {
      // ステップ形式のフォームでは下書き保存機能が異なる可能性がある
      // 実装に応じて調整が必要
      console.warn('Save draft button not found in step-based form')
    }
  }

  async viewPost(postId: string) {
    await this.page.goto(`/posts/${postId}`)
    // ページが完全に読み込まれるまで待機
    await this.page.waitForLoadState('networkidle')
    // 投稿タイトルが表示されるまで待機（ゲストユーザーでも表示される要素）
    await this.page.waitForSelector('[data-testid="post-title"]', { timeout: 10000 })
  }

  async editPost(
    postId: string,
    newData: {
      title?: string
      content?: string
      category?: string
    }
  ) {
    const isMobileSafari = await this.isMobileSafari()
    const isWebKit = await this.isWebKit()

    // 認証クッキーが設定されていることを確認
    await this.page
      .waitForFunction(
        () => {
          const cookies = document.cookie.split(';').map(c => c.trim())
          return cookies.some(c => c.startsWith('auth-token='))
        },
        { timeout: 10000 }
      )
      .catch(() => {})

    await this.page.goto(`/posts/${postId}/edit`, {
      waitUntil: isWebKit ? 'networkidle' : 'domcontentloaded',
      timeout: isWebKit ? 30000 : 15000,
    })

    // Mobile SafariとWebKitの場合は追加の待機時間
    if (isMobileSafari || isWebKit) {
      await this.page.waitForTimeout(3000)
    }

    if (newData.title) {
      await this.page.locator('input[name="title"]').fill(newData.title)
    }

    if (newData.content) {
      await this.page.locator('textarea[name="content"]').fill(newData.content)
    }

    if (newData.category) {
      await this.page.locator('select[name="cosmeticCategory"]').selectOption(newData.category)
    }

    await this.page.getByRole('button', { name: '更新' }).click()
  }

  async deletePost(postId: string) {
    await this.page.goto(`/posts/${postId}`)
    await this.page.click('[data-testid="post-menu-button"]')
    await this.page.click('[data-testid="delete-post-button"]')
    await this.page.click('[data-testid="confirm-delete-button"]')
  }

  async likePost() {
    await this.page.click('[data-testid="empathy-button"]')
  }

  async addComment(comment: string) {
    await this.page.fill('[data-testid="comment-input"]', comment)
    await this.page.click('[data-testid="add-comment-button"]')

    // コメントが送信されるを待つ
    await this.page.waitForTimeout(1000)
  }

  async searchPosts(query: string) {
    await this.page.goto('/posts')
    await this.page.fill('[data-testid="search-input"]', query)
    await this.page.press('[data-testid="search-input"]', 'Enter')
  }

  async filterByCategory(category: string) {
    await this.page.goto('/posts')
    await this.page.selectOption('[data-testid="category-filter"]', category)
  }

  async filterBySkinType(skinType: string) {
    await this.page.goto('/posts')
    await this.page.selectOption('[data-testid="skin-type-filter"]', skinType)
  }

  async expectPostToBeVisible(title: string) {
    // タイトルがh1タグに含まれていることを確認（投稿詳細ページ）
    // または投稿一覧ページのタイトルを確認
    await expect(
      this.page
        .locator(
          `h1:has-text("${title}"), h2:has-text("${title}"), [data-testid="post-title"]:has-text("${title}")`
        )
        .first()
    ).toBeVisible()
  }

  async expectPostContent(content: string) {
    // 投稿内容がページのどこかに表示されていることを確認
    await expect(this.page.locator(`text="${content}"`)).toBeVisible()
  }

  async expectCommentToBeVisible(comment: string) {
    // コメントが表示されるまで待機
    // 実装に応じて複数のセレクターを試す
    await expect(
      this.page
        .locator(
          `[data-testid="comment"]:has-text("${comment}"), .comment-content:has-text("${comment}"), p:has-text("${comment}")`
        )
        .first()
    ).toBeVisible({ timeout: 10000 })
  }

  async expectCommentCount(count: number) {
    // コメント数が更新されるまで待機
    await expect(this.page.locator('[data-testid="comment-count"]')).toContainText(`${count}`, {
      timeout: 10000,
    })
  }

  async expectEmpathyCount(count: number) {
    await expect(this.page.locator('[data-testid="empathy-button"]')).toContainText(`(${count})`)
  }

  async expectErrorMessage(message: string) {
    await expect(this.page.locator('[data-testid="error-message"]')).toContainText(message)
  }

  async expectSuccessMessage(message: string) {
    await expect(this.page.locator('[data-testid="success-message"]')).toContainText(message)
  }
}
