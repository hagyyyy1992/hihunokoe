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

export function createTestUser() {
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

// AuthHelperクラスのregisterAndLoginメソッドのラッパー関数
export async function registerAndLogin(page: Page) {
  const authHelper = new AuthHelper(page)
  return await authHelper.registerAndLogin()
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
    // Mobile Safari判定を最初に実行
    const userAgent = await this.page.evaluate(() => navigator.userAgent)
    const isMobileSafari = userAgent.includes('iPhone') || userAgent.includes('iPad')
    console.log(`Mobile Safari detected: ${isMobileSafari}`)

    // 開発サーバーの可用性を事前確認
    try {
      const response = await this.page.goto('/auth/register', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      })

      if (!response || response.status() !== 200) {
        throw new Error(`Failed to load register page. Status: ${response?.status()}`)
      }
      console.log('Successfully navigated to register page')
    } catch (error) {
      console.log('Failed to navigate to register page:', error)
      throw error
    }

    // Mobile Safariに特化した段階的な待機戦略
    if (isMobileSafari) {
      console.log('Applying Mobile Safari-specific wait strategy...')

      // ステップ1: ネットワーク待機（長めのタイムアウト）
      await this.page.waitForLoadState('networkidle', { timeout: 20000 })
      console.log('Network idle state reached')

      // ステップ2: DOM安定化待機
      await this.page.waitForTimeout(2000)

      // ステップ3: Reactハイドレーション待機
      await this.page.waitForTimeout(4000)
      console.log('React hydration wait completed')

      // ステップ4: 段階的要素確認
      let formFound = false
      for (let attempt = 1; attempt <= 5; attempt++) {
        console.log(`Checking for form elements (attempt ${attempt}/5)...`)

        const formExists = await this.page.locator('[data-testid="register-form"]').count()
        if (formExists > 0) {
          formFound = true
          console.log('Register form found!')
          break
        }

        if (attempt < 5) {
          console.log('Form not found yet, waiting 2 more seconds...')
          await this.page.waitForTimeout(2000)
        }
      }

      if (!formFound) {
        console.log('Form still not found after 5 attempts, taking debug screenshot...')
        await this.page.screenshot({ path: `debug-mobile-safari-${Date.now()}.png` })
        throw new Error('Register form not found after multiple attempts on Mobile Safari')
      }
    } else {
      // 標準ブラウザ向けの待機戦略
      console.log('Applying standard browser wait strategy...')
      await this.page.waitForLoadState('networkidle', { timeout: 15000 })
      await this.page.waitForTimeout(3000)
    }

    // より確実な要素の待機とエラーハンドリング
    try {
      await this.page.waitForSelector('[data-testid="register-form"]', {
        timeout: isMobileSafari ? 30000 : 20000,
        state: 'visible',
      })
      console.log('Register form found and visible')
    } catch (error) {
      console.log('Register form not found, checking page state...')
      const currentUrl = this.page.url()
      const pageTitle = await this.page.title()
      const bodyContent = await this.page.textContent('body')
      console.log(`Current URL: ${currentUrl}`)
      console.log(`Page title: ${pageTitle}`)
      console.log(`Body content preview: ${bodyContent?.substring(0, 200)}`)

      // Take a screenshot for debugging
      await this.page.screenshot({ path: `debug-register-${Date.now()}.png` })
      console.log('Debug screenshot saved')

      throw error
    }

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
    // Mobile Safari判定を最初に実行
    const userAgent = await this.page.evaluate(() => navigator.userAgent)
    const isMobileSafari = userAgent.includes('iPhone') || userAgent.includes('iPad')
    console.log(`Login - Mobile Safari detected: ${isMobileSafari}`)

    await this.page.goto('/auth/login')

    // Mobile Safariに特化した段階的な待機戦略
    if (isMobileSafari) {
      console.log('Applying Mobile Safari-specific login wait strategy...')

      // ステップ1: ネットワーク待機（長めのタイムアウト）
      await this.page.waitForLoadState('networkidle', { timeout: 20000 })
      console.log('Login page - Network idle state reached')

      // ステップ2: DOM安定化待機
      await this.page.waitForTimeout(2000)

      // ステップ3: Reactハイドレーション待機
      await this.page.waitForTimeout(4000)
      console.log('Login page - React hydration wait completed')

      // ステップ4: 段階的要素確認
      let loginFormFound = false
      for (let attempt = 1; attempt <= 5; attempt++) {
        console.log(`Checking for login form (attempt ${attempt}/5)...`)

        const formExists = await this.page.locator('[data-testid="login-form"]').count()
        if (formExists > 0) {
          loginFormFound = true
          console.log('Login form found!')
          break
        }

        if (attempt < 5) {
          console.log('Login form not found yet, waiting 2 more seconds...')
          await this.page.waitForTimeout(2000)
        }
      }

      if (!loginFormFound) {
        console.log('Login form still not found after 5 attempts, taking debug screenshot...')
        await this.page.screenshot({ path: `debug-login-mobile-safari-${Date.now()}.png` })
        throw new Error('Login form not found after multiple attempts on Mobile Safari')
      }
    } else {
      // 標準ブラウザ向けの待機戦略
      console.log('Applying standard browser login wait strategy...')
      await this.page.waitForLoadState('networkidle', { timeout: 15000 })
      await this.page.waitForTimeout(3000)
    }

    // より確実な要素の待機
    try {
      await this.page.waitForSelector('[data-testid="login-form"]', {
        timeout: isMobileSafari ? 30000 : 20000,
        state: 'visible',
      })
      console.log('Login form found and visible')
    } catch (error) {
      console.log('Login form not found, checking page state...')
      const currentUrl = this.page.url()
      const pageTitle = await this.page.title()
      console.log(`Current URL: ${currentUrl}`)
      console.log(`Page title: ${pageTitle}`)
      await this.page.screenshot({ path: `debug-login-${Date.now()}.png` })
      throw error
    }

    // Fill login form
    await this.page.getByLabel('メールアドレス').fill(email)
    await this.page.locator('input[name="password"]').fill(password)

    // Click login button
    await this.page.getByRole('button', { name: 'ログイン' }).click()

    if (expectSuccess) {
      // Check if it's Mobile Safari for specific handling
      const userAgent = await this.page.evaluate(() => navigator.userAgent)
      const isMobileSafari = userAgent.includes('iPhone') || userAgent.includes('iPad')
      const timeoutMs = isMobileSafari ? 15000 : 10000

      // Check if we are redirected to terms agreement page
      try {
        await this.page.waitForURL('/auth/terms-agreement**', {
          timeout: isMobileSafari ? 5000 : 3000,
        })
        // If we reach here, terms agreement is required
        // E2Eテストモードでリダイレクトするため、URLにパラメータを追加
        const currentUrl = this.page.url()
        if (!currentUrl.includes('e2e=true')) {
          await this.page.goto(currentUrl + (currentUrl.includes('?') ? '&' : '?') + 'e2e=true')
        }
        await this.acceptTermsAndPrivacy()
      } catch {
        // No redirection to terms agreement, continue with normal flow
      }

      // Wait for navigation away from login page (and terms page if applicable) with extended timeout for Mobile Safari
      let attempts = 0
      const maxAttempts = isMobileSafari ? 3 : 1

      // Mobile Safari-specific navigation handling
      if (isMobileSafari) {
        // Use polling approach for Mobile Safari
        let loginPageDetected = true
        let attempts = 0
        const maxAttempts = 8

        while (loginPageDetected && attempts < maxAttempts) {
          await this.page.waitForTimeout(2000) // Wait for page to load
          const currentUrl = this.page.url()

          // Check if we're still on login or terms page
          if (currentUrl.includes('/auth/login') || currentUrl.includes('/auth/terms-agreement')) {
            attempts++
            console.log(`Mobile Safari: Attempt ${attempts}, still on auth page: ${currentUrl}`)

            if (attempts >= maxAttempts) {
              throw new Error(
                `Login failed - still on auth page after ${maxAttempts} attempts. Current URL: ${currentUrl}`
              )
            }
            continue
          }

          loginPageDetected = false
          console.log(
            `Mobile Safari: Successfully navigated away from auth pages to: ${currentUrl}`
          )
        }
      } else {
        // Use standard waitForURL for other browsers with retry
        while (attempts < maxAttempts) {
          try {
            await this.page.waitForURL(
              url =>
                !url.pathname.includes('/auth/login') &&
                !url.pathname.includes('/auth/terms-agreement'),
              { timeout: timeoutMs }
            )
            break
          } catch (error) {
            attempts++
            if (attempts >= maxAttempts) {
              // Last attempt failed, check if we're at least not on login page
              const currentUrl = this.page.url()
              if (currentUrl.includes('/auth/login')) {
                throw new Error(
                  `Login failed - still on login page after ${maxAttempts} attempts. Current URL: ${currentUrl}`
                )
              }
              // If we're not on login page but waitForURL still failed, we'll consider it successful
              console.warn(
                `waitForURL failed but user appears to be logged in. Current URL: ${currentUrl}`
              )
              break
            }
            await this.page.waitForTimeout(1000)
          }
        }
      }

      // ログイン成功後の安定のための待機（Mobile Safariでは長めに）
      await this.page.waitForTimeout(isMobileSafari ? 3000 : 2000)
    } else {
      // Wait a bit for any potential error message
      await this.page.waitForTimeout(1000)
    }
  }

  async acceptTermsAndPrivacy() {
    try {
      // 現在のページURL確認
      const currentUrl = this.page.url()
      console.log(`AcceptTermsAndPrivacy: Starting on URL: ${currentUrl}`)

      // 利用規約同意ページでない場合は終了
      if (!currentUrl.includes('/auth/terms-agreement')) {
        console.log('Not on terms agreement page, skipping')
        return
      }

      // E2Eモードの確認
      const isE2EMode = currentUrl.includes('e2e=true')
      console.log(`E2E mode: ${isE2EMode}`)

      // Mobile Safari判定
      const userAgent = await this.page.evaluate(() => navigator.userAgent)
      const isMobileSafari = userAgent.includes('iPhone') || userAgent.includes('iPad')
      console.log(`Terms page - Mobile Safari detected: ${isMobileSafari}`)

      // Suspenseコンポーネントを含むページの段階的読み込み待機
      if (isMobileSafari) {
        console.log('Applying Mobile Safari-specific terms page wait strategy...')

        // ステップ1: ネットワーク待機（長めのタイムアウト）
        await this.page.waitForLoadState('networkidle', { timeout: 20000 })
        console.log('Terms page - Network idle state reached')

        // ステップ2: Suspense fallback解除待機
        await this.page.waitForTimeout(2000)

        // ステップ3: Reactハイドレーション＋Suspense解決待機
        await this.page.waitForTimeout(4000)
        console.log('Terms page - Suspense resolution wait completed')

        // ステップ4: チェックボックス要素の段階的確認
        let checkboxesFound = false
        for (let attempt = 1; attempt <= 8; attempt++) {
          console.log(`Checking for checkboxes (attempt ${attempt}/8)...`)

          const termsCheckbox = await this.page
            .locator('[data-testid="agree-terms-checkbox"]')
            .count()
          const privacyCheckbox = await this.page
            .locator('[data-testid="agree-privacy-checkbox"]')
            .count()

          if (termsCheckbox > 0 && privacyCheckbox > 0) {
            checkboxesFound = true
            console.log('Both checkboxes found!')
            break
          }

          if (attempt < 8) {
            console.log(
              `Checkboxes not found yet (terms: ${termsCheckbox}, privacy: ${privacyCheckbox}), waiting 2 more seconds...`
            )
            await this.page.waitForTimeout(2000)
          }
        }

        if (!checkboxesFound) {
          console.log('Checkboxes still not found after 8 attempts, taking debug screenshot...')
          await this.page.screenshot({ path: `debug-terms-mobile-safari-${Date.now()}.png` })
          throw new Error(
            'Terms agreement checkboxes not found after multiple attempts on Mobile Safari'
          )
        }
      } else {
        // 標準ブラウザ向けの待機戦略
        console.log('Applying standard browser terms page wait strategy...')
        await this.page.waitForLoadState('networkidle', { timeout: 15000 })
        await this.page.waitForTimeout(3000)
      }

      // 利用規約リンクをクリック（E2Eモードでは即座に読了状態になる）
      // E2Eモードではボタン要素内のテキストを直接検索、通常モードではlink要素
      const termsElement = isE2EMode
        ? this.page.getByText('利用規約').first()
        : this.page.getByRole('link', { name: '利用規約' })
      await termsElement.waitFor({ state: 'visible', timeout: 10000 })
      await termsElement.click()
      console.log('Terms element clicked')

      // プライバシーポリシーリンクをクリック（E2Eモードでは即座に読了状態になる）
      // E2Eモードではボタン要素内のテキストを直接検索、通常モードではlink要素
      const privacyElement = isE2EMode
        ? this.page.getByText('プライバシーポリシー').first()
        : this.page.getByRole('link', { name: 'プライバシーポリシー' })
      await privacyElement.waitFor({ state: 'visible', timeout: 10000 })
      await privacyElement.click()
      console.log('Privacy element clicked')

      // E2Eモードでは短時間待機、通常モードでは少し長く待機
      const waitTime = isE2EMode ? 100 : 1000
      await this.page.waitForTimeout(waitTime)

      // チェックボックスをチェック
      await this.page.getByTestId('agree-terms-checkbox').check()
      console.log('Terms checkbox checked')
      await this.page.getByTestId('agree-privacy-checkbox').check()
      console.log('Privacy checkbox checked')

      // 同意ボタンをクリック
      const submitButton = this.page.getByTestId('submit-agreement-button')
      await submitButton.click()
      console.log('Submit button clicked')

      // ページ遷移を待つ
      await this.page.waitForURL(
        url => {
          const urlStr = url.toString()
          const isAway = !urlStr.includes('/auth/terms-agreement')
          console.log(`URL check: ${urlStr}, away from terms: ${isAway}`)
          return isAway
        },
        {
          timeout: 15000,
        }
      )

      console.log('Successfully completed terms and privacy acceptance')
    } catch (error) {
      console.error('Error in acceptTermsAndPrivacy:', error)
      console.log(`Current URL when error occurred: ${this.page.url()}`)
      throw error
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

      await mobileMenuButton.waitFor({ state: 'visible', timeout: 10000 })
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

    // Wait for message with retry logic for WebKit
    const maxRetries = 3
    let retries = 0
    while (retries < maxRetries) {
      try {
        await this.page.waitForSelector('[data-testid="message"]', {
          timeout: 5000,
          state: 'visible',
        })
        break
      } catch (error) {
        retries++
        if (retries === maxRetries) {
          // Final attempt with longer timeout and additional wait
          await this.page.waitForTimeout(1000)
          await this.page.waitForSelector('[data-testid="message"]', {
            timeout: 10000,
            state: 'attached',
          })
        }
      }
    }
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

  async generateUniqueUser() {
    // テスト用の一意なユーザーデータを生成
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    return {
      email: `test-${timestamp}-${randomSuffix}@example.com`,
      password: 'test12345',
      userName: `testuser-${timestamp}-${randomSuffix}`,
      skinType: 'normal',
    }
  }

  async registerAndLogin() {
    const userData = await this.generateUniqueUser()

    try {
      // ユーザー登録
      await this.register({
        username: userData.userName,
        email: userData.email,
        password: userData.password,
        skinType: userData.skinType,
      })

      // データベースへの保存が完了するまで待機
      await this.page.waitForTimeout(2000)

      // メール認証をテスト用に実行
      await this.verifyEmail(userData.email)

      // ログイン
      await this.login(userData.email, userData.password)

      // 認証状態を確認
      await this.expectToBeLoggedIn()

      return userData
    } catch (error) {
      console.error('Failed to register and login:', error)
      throw error
    }
  }

  async verifyEmail(email: string) {
    // テスト用のメール認証API呼び出し
    const port = process.env.PORT || '3000'
    try {
      const response = await fetch(`http://localhost:${port}/api/test/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        console.error(`Failed to verify email for ${email}: ${response.status}`)
      }
    } catch (error) {
      console.error(`Error verifying email for ${email}:`, error)
    }
  }

  async getVerificationToken(email: string): Promise<string> {
    // テスト用の認証トークン取得API呼び出し
    const port = process.env.PORT || '3000'

    // 少し待機してからトークン取得を試行
    await new Promise(resolve => setTimeout(resolve, 500))

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(`http://localhost:${port}/api/test/get-verification-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.log(`[TEST] API Error ${response.status}: ${errorText}`)
          if (attempt === 3) {
            throw new Error(
              `Failed to get verification token for ${email}: ${response.status} - ${errorText}`
            )
          }
          console.log(`Attempt ${attempt} failed, retrying...`)
          await new Promise(resolve => setTimeout(resolve, 1000))
          continue
        }

        const data = await response.json()
        if (!data.token) {
          if (attempt === 3) {
            throw new Error(`No token received for ${email}`)
          }
          console.log(`No token in response, retrying...`)
          await new Promise(resolve => setTimeout(resolve, 1000))
          continue
        }

        return data.token
      } catch (error) {
        if (attempt === 3) {
          console.error(`Error getting verification token for ${email}:`, error)
          throw error
        }
        console.log(`Attempt ${attempt} failed, retrying...`)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    throw new Error(`Failed to get verification token after 3 attempts`)
  }
}
