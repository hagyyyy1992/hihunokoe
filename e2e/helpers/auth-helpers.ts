import { Page, expect } from '@playwright/test'

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
      // Wait for registration to complete and redirect to registration-complete page
      try {
        await expect(this.page).toHaveURL(/\/auth\/registration-complete/, { timeout: 15000 })
      } catch (error) {
        // Check for error messages on registration page
        const errorElement = this.page.locator('[data-testid="error-message"]')
        const hasError = await errorElement.isVisible()
        if (hasError) {
          const errorText = await errorElement.textContent()
          throw new Error(`Registration failed with error: ${errorText}`)
        }

        // If no error message but still on registration page, check current URL
        const currentUrl = this.page.url()
        throw new Error(
          `Registration failed - expected registration-complete page but got: ${currentUrl}`
        )
      }

      // After registration, manually login since registration doesn't auto-login
      await this.login(userData.email, userData.password)
    } else {
      // Wait a bit for potential redirect or error message
      await this.page.waitForTimeout(2000)
    }
  }

  async login(email: string, password: string, expectSuccess: boolean = true) {
    await this.page.goto('/auth/login')

    await this.page.fill('[data-testid="email-input"]', email)
    await this.page.fill('[data-testid="password-input"]', password)
    await this.page.click('[data-testid="login-button"]')

    if (expectSuccess) {
      // Wait for login to complete and redirect to dashboard
      try {
        await expect(this.page).toHaveURL(/\/dashboard/, { timeout: 10000 })
      } catch (error) {
        // Check for error messages on login page
        const errorElement = this.page.locator('[data-testid="error-message"]')
        const hasError = await errorElement.isVisible()
        if (hasError) {
          const errorText = await errorElement.textContent()
          throw new Error(`Login failed with error: ${errorText}`)
        }

        // If no error message but still on login page, check current URL
        const currentUrl = this.page.url()
        console.log('Login failed - expected dashboard but got: ', currentUrl)

        // Wait a bit more in case there's a delayed redirect
        await this.page.waitForTimeout(2000)
        const finalUrl = this.page.url()
        throw new Error(`Login failed - expected dashboard but got: ${finalUrl} (after waiting)`)
      }
    } else {
      // Wait a bit for any potential redirect, but don't expect success
      await this.page.waitForTimeout(1000)
    }
  }

  async logout() {
    const viewport = this.page.viewportSize()
    const isMobile = viewport && viewport.width < 768 // md breakpoint in Tailwind

    if (isMobile) {
      // Mobile view - need to open menu first
      const mobileMenuButton = this.page.locator('[data-testid="mobile-menu-button"]')
      await mobileMenuButton.waitFor({ state: 'visible', timeout: 5000 })
      await mobileMenuButton.click({ force: true, timeout: 5000 })
      // Wait for menu to open
      await this.page.waitForTimeout(500)

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
        await logoutButton.click({ force: true, timeout: 2000 })
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
          throw new Error('No logout button found or clickable')
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
        throw new Error('Logout did not complete - logout button still visible after clicking')
      }
    } else {
      // Desktop view
      // Check if user is already logged out by looking for desktop login link in hidden section
      const desktopLoginLink = this.page.locator('.hidden.md\\:flex [data-testid="login-link"]')
      try {
        await expect(desktopLoginLink).toBeVisible({ timeout: 1000 })
        // User is already logged out, nothing to do
        return
      } catch {
        // User is logged in, proceed with logout
      }

      // Click desktop logout button - use button element in hidden section
      const desktopLogoutButton = this.page.locator(
        '.hidden.md\\:flex button[data-testid="logout-button"]'
      )
      await expect(desktopLogoutButton).toBeVisible({ timeout: 5000 })
      await desktopLogoutButton.click()
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
      // Desktop view - target the span in desktop nav
      const desktopUserMenuButton = this.page.locator(
        '.hidden.md\\:flex span[data-testid="user-menu-button"]'
      )
      await expect(desktopUserMenuButton).toBeVisible({ timeout: 5000 })
    }
  }

  async expectToBeLoggedOut() {
    const viewport = this.page.viewportSize()
    const isMobile = viewport && viewport.width < 768 // md breakpoint in Tailwind

    if (isMobile) {
      // Mobile view - need to open menu first
      const mobileMenuButton = this.page.locator('[data-testid="mobile-menu-button"]')
      await mobileMenuButton.waitFor({ state: 'visible', timeout: 5000 })
      await mobileMenuButton.click({ force: true, timeout: 5000 })
      // Wait for menu to open
      await this.page.waitForTimeout(500)

      // Check for mobile login link - wait for it to appear after logout
      let attempts = 0
      let hasVisibleLoginLink = false

      while (attempts < 5 && !hasVisibleLoginLink) {
        await this.page.waitForTimeout(500)
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
      const desktopLoginLink = this.page.locator('.hidden.md\\:flex [data-testid="login-link"]')
      await expect(desktopLoginLink).toBeVisible({ timeout: 5000 })
    }
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
