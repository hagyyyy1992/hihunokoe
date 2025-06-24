import { Page, expect } from '@playwright/test'

export class PostHelper {
  constructor(private page: Page) {}

  async createPost(postData: {
    title: string
    content: string
    category?: string
    mood?: string
    tags?: string[]
  }) {
    await this.page.goto('/posts/create')
    
    await this.page.fill('[data-testid="post-title-input"]', postData.title)
    await this.page.fill('[data-testid="post-content-textarea"]', postData.content)
    
    if (postData.category) {
      await this.page.selectOption('[data-testid="category-select"]', postData.category)
    }
    
    if (postData.mood) {
      await this.page.click(`[data-testid="mood-${postData.mood}"]`)
    }
    
    if (postData.tags && postData.tags.length > 0) {
      const tagsInput = this.page.locator('[data-testid="tags-input"]')
      for (const tag of postData.tags) {
        await tagsInput.fill(tag)
        await tagsInput.press('Enter')
      }
    }
    
    await this.page.click('[data-testid="publish-button"]')
  }

  async saveDraft(postData: {
    title: string
    content: string
    category?: string
  }) {
    await this.page.goto('/posts/create')
    
    await this.page.fill('[data-testid="post-title-input"]', postData.title)
    await this.page.fill('[data-testid="post-content-textarea"]', postData.content)
    
    if (postData.category) {
      await this.page.selectOption('[data-testid="category-select"]', postData.category)
    }
    
    await this.page.click('[data-testid="save-draft-button"]')
  }

  async viewPost(postId: string) {
    await this.page.goto(`/posts/${postId}`)
  }

  async editPost(postId: string, newData: {
    title?: string
    content?: string
    category?: string
  }) {
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
    await expect(this.page.locator(`[data-testid="post-title"]:has-text("${title}")`)).toBeVisible()
  }

  async expectPostContent(content: string) {
    await expect(this.page.locator('[data-testid="post-content"]')).toContainText(content)
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