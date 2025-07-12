import { defineConfig, devices } from '@playwright/test'

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: 0,
  /* Opt out of parallel tests on CI. */
  workers: 1,
  /* Maximum time a test can wait */
  expect: {
    timeout: 10000,
  },
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html'], ['line'], process.env.CI ? ['github'] : ['list']],
  /* Maximum time one test can run for */
  timeout: 60000,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PORT ? `http://localhost:${process.env.PORT}` : 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'off',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',

    /* Slow down operations by the specified amount of milliseconds */
    launchOptions: {
      slowMo: 100,
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        // WebKit専用の設定
        actionTimeout: 20000,
        navigationTimeout: 40000,
        contextOptions: {
          // WebKit用の追加設定
          ignoreHTTPSErrors: true,
          bypassCSP: true,
        },
        launchOptions: {
          slowMo: 500, // WebKitでの操作を少し遅くする
        },
      },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        // Mobile Chrome専用の設定
        actionTimeout: 20000,
        navigationTimeout: 40000,
        launchOptions: {
          slowMo: 200, // Mobile Chromeでの操作を少し遅くする
        },
      },
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
        // Mobile Safari専用の設定
        actionTimeout: 20000,
        navigationTimeout: 40000,
        contextOptions: {
          strictSelectors: false,
        },
      },
    },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      DATABASE_URL: 'postgresql://postgres:password@localhost:5432/hihunokoe_dev',
      NEXTAUTH_SECRET: 'test-secret-key-for-e2e-tests',
      NODE_ENV: 'test', // E2Eテスト環境であることを明示
      USE_MOCK_DATA: 'false',
      MAILHOG_HOST: 'localhost',
      MAILHOG_PORT: '1025',
    },
  },
})
