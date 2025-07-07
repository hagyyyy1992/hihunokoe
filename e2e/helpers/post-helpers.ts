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
      await this.page.fill('[name="cosmeticName"]', postData.cosmeticName)
    }

    if (postData.cosmeticCategory) {
      await this.page.selectOption('[data-testid="category-select"]', postData.cosmeticCategory)
    }

    // 最後のステップまでスキップ（オプション項目をスキップ）
    // ステップ1から4まで進む
    for (let i = 1; i < 4; i++) {
      // 既に投稿詳細ページに遷移している場合は終了
      if (this.page.url().includes('/posts/') && !this.page.url().includes('/posts/new')) {
        return
      }

      const nextButton = this.page.getByRole('button', { name: '次へ' })
      await nextButton.click()
      await this.page.waitForTimeout(500) // 遷移を待つ
    }

    // ステップ4でムードタグを設定（まだフォームにいる場合）
    if (
      (postData.moodTag && !this.page.url().includes('/posts/')) ||
      this.page.url().includes('/posts/new')
    ) {
      await this.page.selectOption('[name="moodTag"]', postData.moodTag!)
    }

    // 投稿を公開（まだフォームにいる場合）
    if (!this.page.url().includes('/posts/') || this.page.url().includes('/posts/new')) {
      await this.page.click('[data-testid="publish-button"]')
    }
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

    await this.page.click('[data-testid="save-draft-button"]')
  }

  async viewPost(postId: string) {
    await this.page.goto(`/posts/${postId}`)
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
    await this.page.click('[data-testid="like-button"]')
  }

  async addComment(comment: string) {
    await this.page.fill('[data-testid="comment-input"]', comment)
    await this.page.click('[data-testid="add-comment-button"]')
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
    // タイトルがh1またはh2タグに含まれていることを確認
    await expect(
      this.page.locator(`h1:has-text("${title}"), h2:has-text("${title}")`).first()
    ).toBeVisible()
  }

  async expectPostContent(content: string) {
    // 投稿内容がページのどこかに表示されていることを確認
    await expect(this.page.locator(`text="${content}"`)).toBeVisible()
  }

  async expectCommentToBeVisible(comment: string) {
    await expect(this.page.locator(`[data-testid="comment"]:has-text("${comment}")`)).toBeVisible()
  }

  async expectLikeCount(count: number) {
    await expect(this.page.locator('[data-testid="like-count"]')).toContainText(count.toString())
  }

  async expectErrorMessage(message: string) {
    await expect(this.page.locator('[data-testid="error-message"]')).toContainText(message)
  }

  async expectSuccessMessage(message: string) {
    await expect(this.page.locator('[data-testid="success-message"]')).toContainText(message)
  }
}
