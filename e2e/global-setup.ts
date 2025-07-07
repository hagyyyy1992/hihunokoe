import { chromium } from '@playwright/test'

async function globalSetup() {
  console.log('🚀 Running global setup for E2E tests...')

  // データベース接続の確認
  const dbCheckMaxRetries = 5
  let dbCheckRetries = 0
  let dbAvailable = false

  while (dbCheckRetries < dbCheckMaxRetries && !dbAvailable) {
    try {
      const response = await fetch('http://localhost:3000/api/health', {
        method: 'GET',
      })
      if (response.ok) {
        dbAvailable = true
        console.log('✅ Database connection verified')
      }
    } catch (error) {
      dbCheckRetries++
      console.log(`⏳ Waiting for database... (attempt ${dbCheckRetries}/${dbCheckMaxRetries})`)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  if (!dbAvailable) {
    throw new Error('❌ Database is not available after multiple retries')
  }

  // レート制限のリセット
  try {
    await fetch('http://localhost:3000/api/test/reset-rate-limiter', {
      method: 'POST',
    })
    console.log('✅ Rate limiter reset')
  } catch (error) {
    console.log('⚠️  Failed to reset rate limiter:', error)
  }

  // テスト用デモデータの確認
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // デモユーザーが存在することを確認
    const response = await page.request.post('http://localhost:3000/api/auth/login', {
      data: {
        email: 'demo@example.com',
        password: 'demo123',
      },
    })

    if (response.ok()) {
      console.log('✅ Demo user verified')
    } else {
      console.log('⚠️  Demo user login failed, but continuing...')
    }
  } catch (error) {
    console.log('⚠️  Failed to verify demo user:', error)
  } finally {
    await browser.close()
  }

  console.log('✅ Global setup completed')
}

export default globalSetup
