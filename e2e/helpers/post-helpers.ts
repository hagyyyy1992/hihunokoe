import { Page, expect } from '@playwright/test'

export class PostHelper {
  constructor(private page: Page) {}

  async createPost(postData: {
    title: string
    content: string
    cosmeticName?: string
    cosmeticCategory?: string
    skinType?: string
    moodTag?: string
    tags?: string[]
  }) {
    // 投稿作成ページへ移動
    await this.page.goto('/posts/new', { waitUntil: 'networkidle' })

    // ページの読み込み完了を待つ
    await this.page.waitForLoadState('domcontentloaded')
    await this.page.waitForTimeout(2000) // クライアント側の認証チェックを待つ

    // ログインページにリダイレクトされた場合のチェック
    const currentUrl = this.page.url()
    if (currentUrl.includes('/auth/login')) {
      throw new Error('Redirected to login page. Authentication may have failed.')
    }

    // フォームが表示されるのを待機
    try {
      await this.page.waitForSelector('input[name="title"]', { state: 'visible', timeout: 15000 })
    } catch (error) {
      // タイムアウトした場合、現在のURLを確認
      const finalUrl = this.page.url()
      if (finalUrl.includes('/auth/login')) {
        throw new Error('Authentication lost during page load')
      }
      throw error
    }

    // ステップ1: 基本情報
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

    // 次のステップに進む
    await this.page.getByRole('button', { name: '次へ' }).click()
    await this.page.waitForTimeout(500)

    // ステップ2: 肌タイプを設定
    if (postData.skinType) {
      await this.page.selectOption('[name="skinType"]', postData.skinType)
    }

    // 残りのステップを進む
    for (let i = 0; i < 2; i++) {
      const nextButton = this.page.getByRole('button', { name: '次へ' })
      await nextButton.click()
      await this.page.waitForTimeout(500)
    }

    // ステップ4でムードタグを設定
    if (postData.moodTag) {
      await this.page.selectOption('[name="moodTag"]', postData.moodTag)
    }

    // GraphQL APIレスポンスを監視
    const responsePromise = this.page.waitForResponse(
      response => response.url().includes('/api/graphql') && response.status() === 200,
      { timeout: 30000 }
    )

    // 投稿を公開
    await this.page.getByRole('button', { name: '投稿する' }).click()

    // APIレスポンスを待つ
    const response = await responsePromise
    const responseData = await response.json()
    const postId = responseData.data?.createPost?.post?.id || responseData.data?.createPost?.id

    if (!postId) {
      throw new Error('Failed to get post ID from GraphQL response')
    }

    // 投稿詳細ページへのナビゲーションを待つ
    await this.page.waitForURL(`**/posts/${postId}`, { timeout: 10000 })

    return postId
  }

  async createPostWithDetails(postData: {
    title: string
    content: string
    cosmeticName?: string
    cosmeticCategory?: string
    skinType?: string
    moodTag?: string
    usageSituation?: {
      season?: string
      timeOfDay?: string
      skinCondition?: string
      menstrualCycle?: string
    }
    experienceDetails?: {
      fragrance?: {
        type?: string
        intensity?: string
        description?: string
      }
      texture?: {
        type?: string
        spreadability?: string
        absorption?: string
        description?: string
      }
      afterUse?: {
        moisture?: string
        texture?: string
        comfort?: string
        duration?: string
        description?: string
      }
    }
  }): Promise<string> {
    // REST APIを使用して直接投稿を作成（詳細情報を含む）
    const requestBody = {
      title: postData.title,
      content: postData.content,
      productName: postData.cosmeticName || 'テスト化粧品',
      category: postData.cosmeticCategory || 'skincare',
      skinType: postData.skinType,
      moodTag: postData.moodTag,
      usageSituation: postData.usageSituation,
      experienceDetails: postData.experienceDetails,
    }

    const response = await this.page.request.post('/api/posts', {
      data: requestBody,
    })

    if (!response.ok()) {
      throw new Error(`Failed to create post: ${response.status()} ${response.statusText()}`)
    }

    const responseData = await response.json()
    const postId = responseData.post?.id

    if (!postId) {
      throw new Error('Failed to get post ID from API response')
    }

    return postId
  }

  async saveDraft(postData: {
    title: string
    content: string
    cosmeticName?: string
    cosmeticCategory?: string
  }) {
    await this.page.goto('/posts/new')
    await this.page.waitForSelector('input[name="title"]', { state: 'visible', timeout: 10000 })

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

    // 下書き保存ボタンをクリック（存在する場合）
    const saveDraftButton = this.page.locator('[data-testid="save-draft-button"]')
    if (await saveDraftButton.isVisible()) {
      await saveDraftButton.click()
    }
  }

  async viewPost(postId: string) {
    await this.page.goto(`/posts/${postId}`)
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
    await this.page.goto(`/posts/${postId}/edit`)
    await this.page.waitForSelector('input[name="title"]', { state: 'visible', timeout: 10000 })

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
    await expect(
      this.page
        .locator(
          `h1:has-text("${title}"), h2:has-text("${title}"), [data-testid="post-title"]:has-text("${title}")`
        )
        .first()
    ).toBeVisible()
  }

  async expectPostContent(content: string) {
    await expect(this.page.locator(`text="${content}"`)).toBeVisible()
  }

  async expectCommentToBeVisible(comment: string) {
    await expect(
      this.page
        .locator(
          `[data-testid="comment"]:has-text("${comment}"), .comment-content:has-text("${comment}"), p:has-text("${comment}")`
        )
        .first()
    ).toBeVisible({ timeout: 10000 })
  }

  async expectCommentCount(count: number) {
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
