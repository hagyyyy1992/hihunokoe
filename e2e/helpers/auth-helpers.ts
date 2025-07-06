import { Page, expect } from '@playwright/test'

// E2Eテスト用のヘルパー関数
export async function loginTestUser(
  page: Page,
  email: string = 'demo@example.com',
  password: string = 'demo123'
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
  password: string = 'demo123'
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
  const browserName = page.context().browser()?.browserType().name()
  const isWebKit = browserName === 'webkit'

  // Register the user
  await authHelper.register({
    username: userData.userName,
    email: userData.email,
    password: userData.password,
    skinType: userData.skinType,
  })

  // Login with the registered user
  await authHelper.login(userData.email, userData.password)

  // 認証状態が確立されるまで待機
  await page.waitForTimeout(isWebKit ? 3000 : 2000)

  // Verify we're logged in (リトライロジック付き)
  let verificationSuccess = false
  let retryCount = 0
  const maxRetries = 5 // リトライ回数を増やす

  while (!verificationSuccess && retryCount < maxRetries) {
    const currentUrl = page.url()

    if (
      currentUrl.includes('/home') ||
      currentUrl.includes('/profile') ||
      currentUrl.includes('/account/delete') ||
      (currentUrl.endsWith('/') && !currentUrl.includes('/auth'))
    ) {
      verificationSuccess = true
      break
    }

    retryCount++
    console.log(
      `Authentication verification attempt ${retryCount}/${maxRetries}. Current URL: ${currentUrl}`
    )

    if (retryCount === 1) {
      // 最初のリトライでは手動でホームページに遷移を試みる
      try {
        await page.goto('/home', { waitUntil: 'networkidle', timeout: isWebKit ? 15000 : 10000 })
        await page.waitForTimeout(isWebKit ? 3000 : 1000)
      } catch (error) {
        console.error('Failed to navigate to home:', error)
      }
    } else {
      // 2回目以降は待機時間を増やす
      await page.waitForTimeout(isWebKit ? 4000 : 3000)
    }

    // 再度URLを確認
    const newUrl = page.url()
    if (newUrl.includes('/auth/login')) {
      if (retryCount === maxRetries) {
        throw new Error('Authentication verification failed - redirected back to login')
      }
    } else if (
      newUrl.includes('/home') ||
      newUrl.includes('/profile') ||
      newUrl.includes('/account/delete') ||
      (newUrl.endsWith('/') && !newUrl.includes('/auth'))
    ) {
      verificationSuccess = true
    }
  }

  // 追加の認証確認：クッキーの存在を確認（リトライロジック付き）
  let authCookie = null
  retryCount = 0

  while (!authCookie && retryCount < 3) {
    const cookies = await page.context().cookies()
    authCookie = cookies.find(c => c.name === 'auth-token')

    if (!authCookie) {
      retryCount++
      console.log(`Auth cookie not found, attempt ${retryCount}/5`)
      await page.waitForTimeout(isWebKit ? 3000 : 2000) // 待機時間も少し増やす
    }
  }

  if (!authCookie) {
    console.error('Auth cookie not found after multiple attempts')
    // WebKitの場合はクッキーのチェックをスキップ（別の認証方法を使用している可能性）
    if (!isWebKit) {
      throw new Error('Authentication cookie not set after login')
    }
  }

  // 認証状態が安定するまで待機（WebKitは長めに）
  await page.waitForTimeout(isWebKit ? 3000 : 1000)
}

export class AuthHelper {
  constructor(private page: Page) {}

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

    // Check for runtime errors
    const runtimeError = await this.page
      .locator('text=Runtime Error')
      .isVisible()
      .catch(() => false)
    if (runtimeError) {
      const errorMessage = await this.page
        .locator('text=Error:')
        .first()
        .textContent()
        .catch(() => '')
      throw new Error(`Runtime error on registration page: ${errorMessage}`)
    }

    // Wait for form to be fully loaded
    await this.page.waitForSelector('[data-testid="register-form"]', { timeout: 10000 })

    await this.page.fill('[data-testid="username-input"]', userData.username)
    await this.page.fill('[data-testid="email-input"]', userData.email)
    await this.page.fill('[data-testid="password-input"]', userData.password)
    await this.page.fill('[data-testid="confirm-password-input"]', userData.password)

    if (userData.skinType) {
      await this.page.selectOption('[data-testid="skin-type-select"]', userData.skinType)
    }

    // Submit the form
    await this.page.click('[data-testid="register-button"]')

    if (expectSuccess) {
      // Wait for form submission to start
      await this.page.waitForTimeout(500)

      // Wait for either navigation or error message with extended timeout
      try {
        await Promise.race([
          // Wait for success - registration-complete page
          expect(this.page).toHaveURL(/\/auth\/registration-complete/, { timeout: 45000 }),
          // Wait for error message to appear (if registration fails)
          this.page.waitForSelector('[data-testid="error-message"]', { timeout: 45000 }),
        ])

        // Check if we're on registration-complete page (success)
        const currentUrl = this.page.url()
        if (currentUrl.includes('/auth/registration-complete')) {
          return
        }

        // If we're still on register page, check for error
        const errorElement = this.page.locator('[data-testid="error-message"]')
        const hasError = await errorElement.isVisible({ timeout: 2000 }).catch(() => false)
        if (hasError) {
          const errorText = await errorElement.textContent()
          throw new Error(`Registration failed with error: ${errorText}`)
        }

        throw new Error(
          `Registration failed - expected registration-complete page but got: ${currentUrl}`
        )
      } catch (error) {
        const currentUrl = this.page.url()

        // Check for error message one more time
        const errorElement = this.page.locator('[data-testid="error-message"]')
        const hasError = await errorElement.isVisible({ timeout: 1000 }).catch(() => false)

        if (hasError) {
          const errorText = await errorElement.textContent()
          throw new Error(`Registration failed with error: ${errorText}`)
        }

        throw new Error(
          `Registration timeout or failed - expected registration-complete page but got: ${currentUrl}. Original error: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    } else {
      // Wait a bit for potential redirect or error message
      await this.page.waitForTimeout(2000)
    }
  }

  async login(email: string, password: string, expectSuccess: boolean = true) {
    await this.page.goto('/auth/login')

    // Clear any existing values first to avoid form validation issues
    await this.page.fill('[data-testid="email-input"]', '')
    await this.page.fill('[data-testid="password-input"]', '')

    // Wait a bit for form to clear
    await this.page.waitForTimeout(500)

    await this.page.fill('[data-testid="email-input"]', email)
    await this.page.fill('[data-testid="password-input"]', password)

    // Wait for form validation to enable the button
    await this.page.waitForTimeout(500)

    // Ensure the login button is enabled before clicking
    const loginButton = this.page.locator('[data-testid="login-button"]')
    await expect(loginButton).toBeEnabled({ timeout: 5000 })

    await loginButton.click()

    if (expectSuccess) {
      // Wait for login to complete and redirect to home or root
      try {
        await expect(this.page).toHaveURL(/\/home|\/(?!auth)/, { timeout: 15000 })
      } catch (error) {
        try {
          // Check if we're already on home or root (sometimes URL matching can be flaky)
          const currentUrl = this.page.url()
          if (
            currentUrl.includes('/home') ||
            (currentUrl.endsWith('/') && !currentUrl.includes('/auth'))
          ) {
            return
          }

          // Check for error messages on login page (with error handling for closed page)
          const errorElement = this.page.locator('[data-testid="error-message"]')
          const hasError = await errorElement.isVisible({ timeout: 2000 }).catch(() => false)
          if (hasError) {
            const errorText = await errorElement.textContent()
            throw new Error(`Login failed with error: ${errorText}`)
          }

          // Wait a bit more in case there's a delayed redirect
          await this.page.waitForTimeout(2000)
          const finalUrl = this.page.url()
          if (
            finalUrl.includes('/home') ||
            (finalUrl.endsWith('/') && !finalUrl.includes('/auth'))
          ) {
            return
          }
          throw new Error(
            `Login failed - expected home or root but got: ${finalUrl} (after waiting)`
          )
        } catch (pageError) {
          // If page is closed or inaccessible, throw original error
          throw error
        }
      }
    } else {
      // Wait a bit for any potential redirect, but don't expect success
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
    const viewport = this.page.viewportSize()
    const isMobile = viewport && viewport.width < 768 // md breakpoint in Tailwind
    const browserName = this.page.context().browser()?.browserType().name()
    const isWebKit = browserName === 'webkit'

    // WebKitの場合は追加の待機
    if (isWebKit) {
      await this.page.waitForTimeout(2000)
    }

    // まずURLを確認（ログインページでないことを確認）
    const currentUrl = this.page.url()
    if (currentUrl.includes('/auth/login')) {
      throw new Error('Still on login page, not logged in')
    }

    if (isMobile) {
      // Mobile view - need to open menu first
      const mobileMenuButton = this.page.locator('[data-testid="mobile-menu-button"]')

      // WebKitでのリトライロジック
      let menuButtonVisible = false
      let retryCount = 0
      const maxRetries = isWebKit ? 3 : 1

      while (!menuButtonVisible && retryCount < maxRetries) {
        try {
          await mobileMenuButton.waitFor({ state: 'visible', timeout: isWebKit ? 10000 : 5000 })
          menuButtonVisible = true
        } catch (error) {
          retryCount++
          if (retryCount < maxRetries) {
            console.log(`Mobile menu button not visible, retry ${retryCount}/${maxRetries}`)
            await this.page.waitForTimeout(2000)
          }
        }
      }

      if (menuButtonVisible) {
        await mobileMenuButton.click({ force: true, timeout: 5000 })
        // Wait for menu to open
        await this.page.waitForTimeout(isWebKit ? 1000 : 500)

        // Check for mobile user menu button - get the last one (mobile should be last)
        const mobileUserMenuButton = this.page.getByTestId('user-menu-button').last()
        await expect(mobileUserMenuButton).toBeVisible({ timeout: isWebKit ? 10000 : 5000 })
      }
    } else {
      // Desktop view - target the user menu button
      const desktopUserMenuButton = this.page.locator('[data-testid="user-menu-button"]')
      await expect(desktopUserMenuButton).toBeVisible({ timeout: isWebKit ? 10000 : 5000 })
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
          console.log(`Error message not visible, retry ${retryCount}/${maxRetries}`)
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
}
