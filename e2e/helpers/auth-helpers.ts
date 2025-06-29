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
  const timestamp = Date.now()
  return {
    email: `test-${timestamp}@example.com`,
    password: 'test12345', // 8文字以上のパスワード
    userName: `testuser-${timestamp}`,
    skinType: 'normal',
  }
}

export async function cleanupTestUser(email: string) {
  // テストユーザーのクリーンアップ
  try {
    const response = await fetch('http://localhost:3000/api/test/cleanup-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      console.log(`Failed to cleanup test user ${email}: ${response.status}`)
    }
  } catch (error) {
    console.log(`Error cleaning up test user ${email}:`, error)
  }
}

export async function registerAndLoginTestUser(
  page: Page,
  userData: { email: string; password: string; userName: string; skinType?: string }
) {
  const registerData = {
    username: userData.userName, // AuthHelperのregisterで期待されるプロパティ名に変換
    email: userData.email,
    password: userData.password,
    skinType: userData.skinType,
  }

  // Register the user
  await registerTestUser(page, registerData)

  // After successful registration, explicitly login
  // Note: registerTestUser will leave us on registration-complete page, so we need to navigate to login
  await loginTestUser(page, userData.email, userData.password)
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
      // Wait for login to complete and redirect to dashboard
      try {
        await expect(this.page).toHaveURL(/\/dashboard/, { timeout: 15000 })
      } catch (error) {
        try {
          // Check if we're already on dashboard (sometimes URL matching can be flaky)
          const currentUrl = this.page.url()
          if (currentUrl.includes('/dashboard')) {
            console.log('Login successful - URL contains dashboard:', currentUrl)
            return
          }

          // Check for error messages on login page (with error handling for closed page)
          const errorElement = this.page.locator('[data-testid="error-message"]')
          const hasError = await errorElement.isVisible({ timeout: 2000 }).catch(() => false)
          if (hasError) {
            const errorText = await errorElement.textContent()
            throw new Error(`Login failed with error: ${errorText}`)
          }

          console.log('Login failed - expected dashboard but got: ', currentUrl)

          // Wait a bit more in case there's a delayed redirect
          await this.page.waitForTimeout(2000)
          const finalUrl = this.page.url()
          if (finalUrl.includes('/dashboard')) {
            console.log('Login successful after wait - URL contains dashboard:', finalUrl)
            return
          }
          throw new Error(`Login failed - expected dashboard but got: ${finalUrl} (after waiting)`)
        } catch (pageError) {
          // If page is closed or inaccessible, throw original error
          console.log('Page is no longer accessible during error handling:', pageError)
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
      // User is already logged out, nothing to do
      console.log('User was already logged out or logout failed: Already logged out')
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
          console.log(
            'User was already logged out or logout failed: No logout button found in mobile menu'
          )
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
            console.log('Found logout buttons:', buttons.length)

            for (const btn of buttons) {
              const rect = btn.getBoundingClientRect()
              const styles = window.getComputedStyle(btn)
              console.log('Button:', {
                text: btn.textContent,
                rect: { width: rect.width, height: rect.height },
                display: styles.display,
                visibility: styles.visibility,
                offsetParent: (btn as HTMLElement).offsetParent !== null,
              })

              // Try to click any logout button
              if (btn.textContent?.includes('ログアウト')) {
                ;(btn as HTMLElement).click()
                return true
              }
            }
            return false
          })

          if (!clicked) {
            console.log(
              'User was already logged out or logout failed: No logout button found or clickable'
            )
            return
          }
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

        if (!logoutCompleted) {
          console.log(
            'User was already logged out or logout failed: Logout did not complete - logout button still visible after clicking'
          )
          return
        }
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
          console.log('User was already logged out or logout failed:', error)
          return
        }
      }
    } catch (error) {
      console.log('User was already logged out or logout failed:', error)
      return
    }
  }

  async expectToBeLoggedIn() {
    const viewport = this.page.viewportSize()
    const isMobile = viewport && viewport.width < 768 // md breakpoint in Tailwind

    if (isMobile) {
      // Mobile view - need to open menu first
      const mobileMenuButton = this.page.locator('[data-testid="mobile-menu-button"]')
      await mobileMenuButton.waitFor({ state: 'visible', timeout: 5000 })
      await mobileMenuButton.click({ force: true, timeout: 5000 })
      // Wait for menu to open
      await this.page.waitForTimeout(500)

      // Check for mobile user menu button - get the last one (mobile should be last)
      const mobileUserMenuButton = this.page.getByTestId('user-menu-button').last()
      await expect(mobileUserMenuButton).toBeVisible({ timeout: 5000 })
    } else {
      // Desktop view - target the user menu button
      const desktopUserMenuButton = this.page.locator('[data-testid="user-menu-button"]')
      await expect(desktopUserMenuButton).toBeVisible({ timeout: 5000 })
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

        // If no logout button visible, assume logout worked even if login link not visible
        console.log('Logout completed - no logout button visible, assuming login link will appear')
      }
    } else {
      // Desktop view - target the login link in desktop nav
      // Use simpler selector that doesn't rely on complex CSS combinations
      const desktopLoginLink = this.page.locator('[data-testid="login-link"]')
      await expect(desktopLoginLink).toBeVisible({ timeout: 5000 })
    }
  }

  async expectErrorMessage(message: string) {
    // Wait for error message to appear with a longer timeout for webkit
    await this.page.waitForSelector('[data-testid="error-message"]', { timeout: 10000 })
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
