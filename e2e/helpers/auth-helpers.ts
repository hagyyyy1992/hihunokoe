import { Page, expect } from '@playwright/test'

// E2Eテスト用のヘルパー関数
export async function loginTestUser(
  page: Page,
  email: string = 'demo@example.com',
  password: string = 'demo1234'
) {
  const authHelper = new AuthHelper(page)
  await authHelper.login(email, password)
}

export async function registerTestUser(
  page: Page,
  userData: {
    username: string
    email: string
    password: string
    skinType?: string
  }
) {
  const authHelper = new AuthHelper(page)
  await authHelper.register(userData)
}

export async function logoutTestUser(page: Page) {
  const authHelper = new AuthHelper(page)
  await authHelper.logout()
}

// E2Eテストで使用される追加の関数
export async function loginUser(
  page: Page,
  email: string = 'demo@example.com',
  password: string = 'demo1234'
) {
  return loginTestUser(page, email, password)
}

export async function createTestUser() {
  // テスト用の一意なユーザーデータを生成
  // タイムスタンプにランダムな要素を追加して衝突を避ける
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  return {
    email: `test-${timestamp}-${randomSuffix}@example.com`,
    password: 'test12345', // 8文字以上のパスワード
    userName: `testuser-${timestamp}-${randomSuffix}`,
    skinType: 'normal',
  }
}

export async function cleanupTestUser(email: string) {
  // テストユーザーのクリーンアップ
  const port = process.env.PORT || '3000'
  try {
    const response = await fetch(`http://localhost:${port}/api/test/cleanup-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      console.error(`Failed to cleanup test user ${email}: ${response.status}`)
    }
  } catch (error) {
    console.error(`Error cleaning up test user ${email}:`, error)
  }
}

export async function registerAndLoginTestUser(
  page: Page,
  userData: { email: string; password: string; userName: string; skinType?: string }
) {
  const authHelper = new AuthHelper(page)

  // Register the user
  await authHelper.register({
    username: userData.userName,
    email: userData.email,
    password: userData.password,
    skinType: userData.skinType,
  })

  // Verify the user's email for testing
  const port = process.env.PORT || '3000'
  try {
    const response = await fetch(`http://localhost:${port}/api/test/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: userData.email }),
    })

    if (!response.ok) {
      console.error(`Failed to verify email for ${userData.email}: ${response.status}`)
    }
  } catch (error) {
    console.error(`Error verifying email for ${userData.email}:`, error)
  }

  // Login with the registered user
  await authHelper.login(userData.email, userData.password)

  // 簡単な認証状態確認 - 1秒待機後、ホームページへの遷移を確認
  await page.waitForTimeout(1000)

  // ログイン成功を確認
  const currentUrl = page.url()
  if (currentUrl.includes('/auth/login')) {
    throw new Error('Authentication failed - still on login page')
  }
}

export class AuthHelper {
  constructor(private page: Page) {}

  private isMobile(): boolean {
    const viewport = this.page.viewportSize()
    return viewport ? viewport.width < 768 : false
  }

  async register(
    userData: {
      username: string
      email: string
      password: string
      skinType?: string
    },
    expectSuccess: boolean = true
  ) {
    await this.page.goto('/auth/register')

    // Wait for form to be loaded
    await this.page.waitForSelector('[data-testid="register-form"]', { timeout: 10000 })

    // Fill form fields
    await this.page.getByLabel('ユーザー名 *').fill(userData.username)
    await this.page.getByLabel('メールアドレス *').fill(userData.email)
    await this.page.locator('input[name="password"]').fill(userData.password)
    await this.page.locator('input[name="confirmPassword"]').fill(userData.password)

    if (userData.skinType) {
      await this.page.getByLabel('肌質').selectOption(userData.skinType)
    }

    // Click register button
    await this.page.getByRole('button', { name: '会員登録' }).click()

    if (expectSuccess) {
      // Wait for registration complete page
      await this.page.waitForURL(/\/auth\/registration-complete/, { timeout: 10000 })
    } else {
      // Wait a bit for error message
      await this.page.waitForTimeout(1000)
    }
  }

  async login(email: string, password: string, expectSuccess: boolean = true) {
    await this.page.goto('/auth/login')

    // Fill login form
    await this.page.getByLabel('メールアドレス').fill(email)
    await this.page.locator('input[name="password"]').fill(password)

    // Click login button
    await this.page.getByRole('button', { name: 'ログイン' }).click()

    if (expectSuccess) {
      // Wait for navigation away from login page
      await this.page.waitForURL(url => !url.pathname.includes('/auth/login'), { timeout: 10000 })

      // ログイン成功後の安定のための待機
      await this.page.waitForTimeout(2000)
    } else {
      // Wait a bit for any potential error message
      await this.page.waitForTimeout(1000)
    }
  }

  async logout() {
    // First check if user is already logged out by looking for login links
    try {
      const loginLink = this.page.locator('[data-testid="login-link"]')
      await expect(loginLink).toBeVisible({ timeout: 2000 })
      return
    } catch {
      // User is logged in, proceed with logout
    }

    const viewport = this.page.viewportSize()
    const isMobile = viewport && viewport.width < 768 // md breakpoint in Tailwind

    try {
      if (isMobile) {
        // Mobile view - need to open menu first
        const mobileMenuButton = this.page.locator('[data-testid="mobile-menu-button"]')

        // Add extra handling for Mobile Safari
        const userAgent = await this.page.evaluate(() => navigator.userAgent)
        const isMobileSafari = userAgent.includes('iPhone') || userAgent.includes('iPad')

        await mobileMenuButton.waitFor({ state: 'visible', timeout: 10000 })
        await mobileMenuButton.click({ force: true, timeout: 10000 })
        // Wait for menu to open with longer delay for Mobile Safari
        await this.page.waitForTimeout(isMobileSafari ? 2000 : 1000)

        // Check if user is already logged out by checking for logout button
        const logoutButtons = this.page.getByTestId('logout-button')
        const logoutButtonCount = await logoutButtons.count()
        if (logoutButtonCount === 0) {
          // User is already logged out, nothing to do
          return
        }

        // Click mobile logout button - try simple approach first
        try {
          // First try to find and click any visible logout button
          const logoutButton = this.page.getByTestId('logout-button')
          await logoutButton.click({ force: true, timeout: 5000 })
        } catch (error) {
          // If that fails, try our evaluate approach
          const clicked = await this.page.evaluate(() => {
            const buttons = document.querySelectorAll('[data-testid="logout-button"]')

            for (const btn of buttons) {
              // Try to click any logout button
              if (btn.textContent?.includes('ログアウト')) {
                ;(btn as HTMLElement).click()
                return true
              }
            }
            return false
          })

          if (!clicked) return
        }

        // Wait for logout to complete and UI to update
        await this.page.waitForTimeout(3000)

        // Wait for logout buttons to disappear (indicating logout completed)
        let logoutCompleted = false
        for (let i = 0; i < 10; i++) {
          const hasLogoutButton = await this.page.evaluate(() => {
            const buttons = document.querySelectorAll('[data-testid="logout-button"]')
            return Array.from(buttons).some(btn => {
              const rect = btn.getBoundingClientRect()
              return rect.width > 0 && rect.height > 0 && (btn as HTMLElement).offsetParent !== null
            })
          })

          if (!hasLogoutButton) {
            logoutCompleted = true
            break
          }

          await this.page.waitForTimeout(500)
        }

        if (!logoutCompleted) return
      } else {
        // Desktop view
        // Click desktop logout button
        const desktopLogoutButton = this.page.locator('[data-testid="logout-button"]')
        try {
          await expect(desktopLogoutButton).toBeVisible({ timeout: 10000 })
          await desktopLogoutButton.click()

          // Wait for logout to complete
          await this.page.waitForTimeout(2000)
        } catch (error) {
          console.error('User was already logged out or logout failed:', error)
          return
        }
      }
    } catch (error) {
      console.error('User was already logged out or logout failed:', error)
      return
    }
  }

  async expectToBeLoggedIn() {
    // URLがログインページでないことを確認
    const currentUrl = this.page.url()
    if (currentUrl.includes('/auth/login')) {
      throw new Error('Still on login page, not logged in')
    }

    // クッキーを確認
    const cookies = await this.page.context().cookies()
    const authCookie = cookies.find(c => c.name === 'auth-token')

    if (!authCookie) {
      // API経由で認証状態を確認
      const authCheck = await this.page.evaluate(async () => {
        try {
          const response = await fetch('/api/auth/me')
          const data = await response.json()
          return {
            ok: response.ok,
            status: response.status,
            data,
          }
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          }
        }
      })

      if (!authCheck.ok) {
        throw new Error(`Not authenticated. API response: ${JSON.stringify(authCheck)}`)
      }
    }
  }

  async expectToBeLoggedOut() {
    const viewport = this.page.viewportSize()
    const isMobile = viewport && viewport.width < 768 // md breakpoint in Tailwind

    if (isMobile) {
      // Mobile view - need to open menu first
      const mobileMenuButton = this.page.locator('[data-testid="mobile-menu-button"]')

      // Check if it's Mobile Safari
      const userAgent = await this.page.evaluate(() => navigator.userAgent)
      const isMobileSafari = userAgent.includes('iPhone') || userAgent.includes('iPad')

      await mobileMenuButton.waitFor({ state: 'visible', timeout: 5000 })
      await mobileMenuButton.click({ force: true, timeout: 5000 })
      // Wait for menu to open
      await this.page.waitForTimeout(500)

      // Check for mobile login link - wait for it to appear after logout
      let attempts = 0
      let hasVisibleLoginLink = false
      const maxAttempts = isMobileSafari ? 10 : 5 // More attempts for Mobile Safari

      while (attempts < maxAttempts && !hasVisibleLoginLink) {
        await this.page.waitForTimeout(isMobileSafari ? 1000 : 500)
        hasVisibleLoginLink = await this.page.evaluate(() => {
          const links = document.querySelectorAll('[data-testid="login-link"]')
          return Array.from(links).some(link => {
            const rect = link.getBoundingClientRect()
            return rect.width > 0 && rect.height > 0 && (link as HTMLElement).offsetParent !== null
          })
        })
        attempts++
      }

      if (!hasVisibleLoginLink) {
        // If we still can't find it, check if logout actually worked by looking for logout buttons
        const hasLogoutButton = await this.page.evaluate(() => {
          const buttons = document.querySelectorAll('[data-testid="logout-button"]')
          return Array.from(buttons).some(btn => {
            const rect = btn.getBoundingClientRect()
            return rect.width > 0 && rect.height > 0 && (btn as HTMLElement).offsetParent !== null
          })
        })

        if (hasLogoutButton) {
          throw new Error('Logout may not have completed - logout button still visible')
        }
      }
    } else {
      // Desktop view - target the login link in desktop nav
      // Use simpler selector that doesn't rely on complex CSS combinations
      const desktopLoginLink = this.page.locator('[data-testid="login-link"]')
      await expect(desktopLoginLink).toBeVisible({ timeout: 5000 })
    }
  }

  async expectErrorMessage(message: string) {
    const browserName = this.page.context().browser()?.browserType().name()
    const isWebKit = browserName === 'webkit'

    // WebKitの場合は追加の待機とリトライロジック
    if (isWebKit) {
      await this.page.waitForTimeout(1000)
    }

    // Wait for error message to appear with a longer timeout for webkit
    let errorVisible = false
    let retryCount = 0
    const maxRetries = isWebKit ? 3 : 1

    while (!errorVisible && retryCount < maxRetries) {
      try {
        await this.page.waitForSelector('[data-testid="error-message"]', {
          timeout: isWebKit ? 15000 : 10000,
          state: 'visible',
        })
        errorVisible = true
      } catch (error) {
        retryCount++
        if (retryCount < maxRetries) {
          await this.page.waitForTimeout(2000)
        }
      }
    }

    if (!errorVisible) {
      throw new Error('Error message not found after retries')
    }

    await expect(this.page.locator('[data-testid="error-message"]')).toContainText(message)
  }

  async expectSuccessMessage(message: string) {
    await expect(this.page.locator('[data-testid="success-message"]')).toContainText(message)
  }

  async expectToBeOnRegistrationCompletePage() {
    await expect(this.page).toHaveURL(/\/auth\/registration-complete/)
    await expect(this.page.locator('[data-testid="success-message"]')).toBeVisible()
  }

  async requestPasswordReset(email: string) {
    await this.page.goto('/auth/forgot-password')

    // Wait for form to be ready
    await this.page.waitForSelector('[data-testid="email-input"]', { timeout: 10000 })

    // Fill email
    await this.page.fill('[data-testid="email-input"]', email)

    // Click reset button
    await this.page.click('[data-testid="reset-password-button"]')

    // Wait for message
    await this.page.waitForSelector('[data-testid="message"]', { timeout: 10000 })
  }

  async resetPassword(token: string, newPassword: string) {
    await this.page.goto(`/auth/reset-password?token=${token}`)

    // Wait for token verification
    await this.page.waitForTimeout(2000)

    // Check if form is visible (token is valid)
    const passwordInput = this.page.locator('input[name="password"]')
    await expect(passwordInput).toBeVisible({ timeout: 10000 })

    // Fill password fields
    await passwordInput.fill(newPassword)
    await this.page.locator('input[name="confirmPassword"]').fill(newPassword)

    // Submit form
    await this.page.getByRole('button', { name: 'パスワードをリセット' }).click()

    // Wait for success message
    await this.page.waitForSelector('.bg-green-50', { timeout: 10000 })
  }
}
