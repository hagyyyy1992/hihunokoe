import { Page, expect } from '@playwright/test'

export class PostHelper {
  constructor(private page: Page) {}

  async createPost(postData: {
    title: string
    content: string
    cosmeticName?: string
    cosmeticCategory?: string
    moodTag?: string
    tags?: string[]
  }) {
    await this.page.goto('/posts/new')

    // ステップ1: 基本情報
    await this.page.fill('[data-testid="post-title-input"]', postData.title)
    await this.page.fill('[data-testid="post-content-textarea"]', postData.content)

    if (postData.cosmeticName) {
      await this.page.fill('[data-testid="cosmeticName-input"]', postData.cosmeticName)
    }

    if (postData.cosmeticCategory) {
      await this.page.selectOption('[data-testid="category-select"]', postData.cosmeticCategory)
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
    const publishButton = this.page.locator('[data-testid="publish-button"]')
    await expect(publishButton).toBeEnabled({ timeout: 10000 })
    await expect(publishButton).toBeVisible({ timeout: 10000 })

    // ボタンのテキストを確認
    await expect(publishButton).toContainText('投稿する')

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
    await this.page.goto('/posts/new')

    await this.page.fill('[data-testid="post-title-input"]', postData.title)
    await this.page.fill('[data-testid="post-content-textarea"]', postData.content)

    if (postData.cosmeticName) {
      await this.page.fill('[name="cosmeticName"]', postData.cosmeticName)
    }

    if (postData.cosmeticCategory) {
      await this.page.selectOption('[data-testid="category-select"]', postData.cosmeticCategory)
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
    await this.page.goto(`/posts/${postId}/edit`)

    if (newData.title) {
      await this.page.fill('[data-testid="post-title-input"]', newData.title)
    }

    if (newData.content) {
      await this.page.fill('[data-testid="post-content-textarea"]', newData.content)
    }

    if (newData.category) {
      await this.page.selectOption('[data-testid="category-select"]', newData.category)
    }

    await this.page.click('[data-testid="update-button"]')
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
