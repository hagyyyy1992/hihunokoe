#!/usr/bin/env node
/**
 * E2E Test Coverage Report Generator
 * E2Eテストのカバレッジを分析してレポートを生成する
 */

const fs = require('fs')
const path = require('path')

// E2Eテストディレクトリのスキャン
function scanE2ETests(dir) {
  const tests = []
  const items = fs.readdirSync(dir)

  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      tests.push(...scanE2ETests(fullPath))
    } else if (item.endsWith('.spec.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8')
      const testMatches = content.match(/test\(['"](.*?)['"]/g) || []
      const testCases = testMatches.map(match => {
        const title = match.match(/test\(['"](.*?)['"]/)[1]
        return { title, file: fullPath.replace(process.cwd() + '/', '') }
      })

      tests.push({
        file: fullPath.replace(process.cwd() + '/', ''),
        category: path.dirname(fullPath).split('/').pop(),
        testCount: testCases.length,
        tests: testCases,
      })
    }
  }

  return tests
}

// 機能カバレッジの分析
function analyzeCoverage(tests) {
  const coverage = {
    auth: {
      registration: false,
      login: false,
      logout: false,
      passwordReset: false,
      rateLimiting: false,
    },
    posts: {
      create: false,
      view: false,
      edit: false,
      delete: false,
      search: false,
      filter: false,
      comments: false,
      likes: false,
    },
    ui: {
      responsive: false,
      navigation: false,
      forms: false,
      validation: false,
    },
  }

  for (const testFile of tests) {
    const fileName = testFile.file.toLowerCase()

    // 認証機能のカバレッジ
    if (fileName.includes('registration')) coverage.auth.registration = true
    if (fileName.includes('login')) coverage.auth.login = true
    if (fileName.includes('password-reset')) coverage.auth.passwordReset = true
    if (fileName.includes('rate-limiting')) coverage.auth.rateLimiting = true

    // 投稿機能のカバレッジ
    if (fileName.includes('create-post')) coverage.posts.create = true
    if (fileName.includes('view-post')) coverage.posts.view = true
    if (fileName.includes('search-posts')) coverage.posts.search = true

    // テスト内容からより詳細な分析
    for (const test of testFile.tests) {
      const testTitle = test.title.toLowerCase()

      if (testTitle.includes('ログアウト')) coverage.auth.logout = true
      if (testTitle.includes('編集')) coverage.posts.edit = true
      if (testTitle.includes('削除')) coverage.posts.delete = true
      if (testTitle.includes('コメント')) coverage.posts.comments = true
      if (testTitle.includes('いいね')) coverage.posts.likes = true
      if (testTitle.includes('フィルタ')) coverage.posts.filter = true
      if (testTitle.includes('レスポンシブ')) coverage.ui.responsive = true
      if (testTitle.includes('ナビゲーション')) coverage.ui.navigation = true
      if (testTitle.includes('バリデーション')) coverage.ui.validation = true
      if (testTitle.includes('フォーム')) coverage.ui.forms = true
    }
  }

  return coverage
}

// カバレッジ率の計算
function calculateCoveragePercentage(coverage) {
  const total = Object.values(coverage).reduce((sum, category) => {
    return sum + Object.keys(category).length
  }, 0)

  const covered = Object.values(coverage).reduce((sum, category) => {
    return sum + Object.values(category).filter(Boolean).length
  }, 0)

  return Math.round((covered / total) * 100)
}

// レポート生成
function generateReport() {
  console.log('🧪 E2E Test Coverage Report')
  console.log('='.repeat(50))

  const tests = scanE2ETests(path.join(process.cwd(), 'e2e'))
  const coverage = analyzeCoverage(tests)
  const percentage = calculateCoveragePercentage(coverage)

  // 総計
  const totalTests = tests.reduce((sum, file) => sum + file.testCount, 0)
  console.log(`📊 Total E2E Tests: ${totalTests}`)
  console.log(`📈 Estimated Coverage: ${percentage}%`)
  console.log('')

  // カテゴリ別レポート
  console.log('📁 Test Files by Category:')
  const categories = {}
  tests.forEach(test => {
    if (!categories[test.category]) categories[test.category] = []
    categories[test.category].push(test)
  })

  Object.entries(categories).forEach(([category, files]) => {
    const testCount = files.reduce((sum, file) => sum + file.testCount, 0)
    console.log(`  ${category}: ${files.length} files, ${testCount} tests`)
  })

  console.log('')

  // 機能カバレッジ詳細
  console.log('🎯 Feature Coverage:')
  Object.entries(coverage).forEach(([category, features]) => {
    console.log(`  ${category.toUpperCase()}:`)
    Object.entries(features).forEach(([feature, covered]) => {
      const status = covered ? '✅' : '❌'
      console.log(`    ${status} ${feature}`)
    })
  })

  console.log('')

  // 推奨事項
  console.log('💡 Recommendations:')
  const uncovered = []
  Object.entries(coverage).forEach(([category, features]) => {
    Object.entries(features).forEach(([feature, covered]) => {
      if (!covered) uncovered.push(`${category}.${feature}`)
    })
  })

  if (uncovered.length > 0) {
    console.log('  Missing coverage for:')
    uncovered.forEach(item => console.log(`    - ${item}`))
  } else {
    console.log('  🎉 All major features are covered!')
  }

  console.log('')
  console.log('📝 Detailed Test Files:')
  tests.forEach(test => {
    console.log(`  ${test.file} (${test.testCount} tests)`)
  })
}

// スクリプト実行
if (require.main === module) {
  generateReport()
}

module.exports = { scanE2ETests, analyzeCoverage, calculateCoveragePercentage }
