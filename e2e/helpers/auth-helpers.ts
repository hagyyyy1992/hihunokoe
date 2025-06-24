import { Page, expect } from '@playwright/test'

export class AuthHelper {
  constructor(private page: Page) {}

  async register(userData: {
    username: string
    email: string
    password: string
    skinType?: string
  }) {
    await this.page.goto('/auth/register')

    await this.page.fill('[data-testid="username-input"]', userData.username)
    await this.page.fill('[data-testid="email-input"]', userData.email)
    await this.page.fill('[data-testid="password-input"]', userData.password)

    if (userData.skinType) {
      await this.page.selectOption('[data-testid="skin-type-select"]', userData.skinType)
    }

    await this.page.click('[data-testid="register-button"]')
  }

  async login(email: string, password: string) {
    await this.page.goto('/auth/login')

    await this.page.fill('[data-testid="email-input"]', email)
    await this.page.fill('[data-testid="password-input"]', password)
    await this.page.click('[data-testid="login-button"]')
  }

  async logout() {
    await this.page.click('[data-testid="user-menu-button"]')
    await this.page.click('[data-testid="logout-button"]')
  }

  async expectToBeLoggedIn() {
    await expect(this.page.locator('[data-testid="user-menu-button"]')).toBeVisible()
  }

  async expectToBeLoggedOut() {
    await expect(this.page.locator('[data-testid="login-link"]')).toBeVisible()
  }

  async expectErrorMessage(message: string) {
    await expect(this.page.locator('[data-testid="error-message"]')).toContainText(message)
  }

  async expectSuccessMessage(message: string) {
    await expect(this.page.locator('[data-testid="success-message"]')).toContainText(message)
  }

  async expectToBeOnRegistrationCompletePage() {
    await expect(this.page).toHaveURL(/\/auth\/registration-complete/)
    await expect(this.page.locator('[data-testid="success-message"]')).toBeVisible()
  }
}
