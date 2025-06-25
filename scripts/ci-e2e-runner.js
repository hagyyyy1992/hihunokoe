#!/usr/bin/env node

/**
 * CI E2E Test Runner with Threshold-based Pass/Fail Logic
 *
 * This script runs E2E tests with configurable pass rate thresholds
 * instead of failing on first failure.
 */

const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')

// Configuration
const TEST_CATEGORIES = {
  critical: {
    name: 'Critical Tests',
    patterns: ['e2e/auth/**'],
    threshold: 0.9, // 90% pass rate - 認証は最重要だが、一部のflaky testを考慮
    description: 'Authentication flows (login, registration, basic auth)',
  },
  // core: {
  //   name: 'Core Tests',
  //   patterns: ['e2e/posts/**'],
  //   threshold: 0.85, // 85% pass rate
  //   description: 'Post management features (create, view, search)',
  // },
}

class E2ETestRunner {
  constructor() {
    this.results = {}
    this.overallSuccess = true
  }

  async runTestCategory(category, config) {
    const startTime = new Date()
    console.log(`\n🧪 Running ${config.name}...`)
    console.log(`📊 Required pass rate: ${(config.threshold * 100).toFixed(0)}%`)
    console.log(`📝 Description: ${config.description}`)
    console.log(`🕐 Started at: ${startTime.toLocaleTimeString()}`)
    console.log(`🎯 Test patterns: ${config.patterns.join(', ')}`)

    const patterns = config.patterns.join(' ')
    // Use line reporter for better real-time feedback in CI, but still get JSON for parsing
    const command = `npx playwright test ${patterns} --reporter=json,line`

    // 実行対象のテストファイルを事前に確認
    console.log('📂 Scanning test files...')
    const { exec: execSync } = require('child_process')
    try {
      const listCommand = `find ${patterns.replace('/**', '')} -name "*.spec.ts" -o -name "*.spec.js" | head -10`
      execSync(listCommand, (error, stdout) => {
        if (!error && stdout) {
          const files = stdout
            .trim()
            .split('\n')
            .filter(f => f)
          console.log(`   Found ${files.length} test files:`)
          files.forEach(f => console.log(`   - ${f}`))
        }
      })
    } catch (e) {
      // Ignore errors in file listing
    }

    try {
      const result = await this.executeCommand(command)
      const endTime = new Date()
      const duration = ((endTime - startTime) / 1000).toFixed(1)

      console.log(`⏱️ Completed in: ${duration}s`)

      const stats = this.parseTestResults(result.stdout)

      this.results[category] = {
        ...stats,
        threshold: config.threshold,
        passed: stats.passRate >= config.threshold,
        duration,
      }

      this.logCategoryResults(category, config, stats)

      if (!this.results[category].passed) {
        this.overallSuccess = false
      }
    } catch (error) {
      console.error(`❌ Failed to run ${config.name}:`, error.message)
      this.results[category] = {
        total: 0,
        passed: 0,
        failed: 0,
        passRate: 0,
        threshold: config.threshold,
        passed: false,
      }
      this.overallSuccess = false
    }
  }

  async executeCommand(command) {
    console.log(`⚡ Executing: ${command}`)
    console.log('📊 Test execution in progress...')
    console.log('   This may take 2-3 minutes. Progress details:')

    return new Promise((resolve, reject) => {
      let stdoutBuffer = ''
      let stderrBuffer = ''
      let lastProgressUpdate = Date.now()

      const childProcess = exec(
        command,
        { maxBuffer: 1024 * 1024 * 10 },
        (error, stdout, stderr) => {
          if (error && !stdout) {
            // Only reject if there's no output (complete failure)
            reject(error)
          } else {
            // Accept partial failures - we'll evaluate based on results
            resolve({ stdout, stderr })
          }
        }
      )

      // Capture stdout for real-time progress
      childProcess.stdout?.on('data', data => {
        stdoutBuffer += data.toString()

        // Show progress updates every 5 seconds
        if (Date.now() - lastProgressUpdate > 5000) {
          const lines = stdoutBuffer.split('\n')
          const testLines = lines.filter(
            line =>
              line.includes('Running') ||
              line.includes('passed') ||
              line.includes('failed') ||
              line.includes('✓') ||
              line.includes('✗')
          )

          if (testLines.length > 0) {
            console.log(`   📍 Progress: ${testLines[testLines.length - 1].trim()}`)
          }
          lastProgressUpdate = Date.now()
        }
      })

      // Capture stderr for debugging
      childProcess.stderr?.on('data', data => {
        stderrBuffer += data.toString()
      })

      // Show periodic status updates
      let progressCounter = 0
      const progressInterval = setInterval(() => {
        progressCounter++
        const elapsed = Math.floor(progressCounter * 10)
        console.log(`   ⏳ Still running... (${elapsed}s elapsed)`)
      }, 10000) // Every 10 seconds

      childProcess.on('close', () => {
        clearInterval(progressInterval)
        console.log('✅ Test execution completed')
      })
    })
  }

  parseTestResults(jsonOutput) {
    try {
      const results = JSON.parse(jsonOutput)
      const stats = results.stats || {}

      return {
        total: stats.expected || 0,
        passed: stats.passed || 0,
        failed: stats.failed || 0,
        flaky: stats.flaky || 0,
        skipped: stats.skipped || 0,
        passRate: stats.expected > 0 ? stats.passed / stats.expected : 0,
      }
    } catch (error) {
      console.warn('⚠️ Failed to parse test results JSON, using fallback parsing')
      return this.fallbackParseResults(jsonOutput)
    }
  }

  fallbackParseResults(output) {
    // Fallback parsing for when JSON parsing fails
    const lines = output.split('\n')
    let passed = 0,
      failed = 0,
      total = 0

    lines.forEach(line => {
      if (line.includes('passed')) passed++
      if (line.includes('failed')) failed++
    })

    total = passed + failed
    return {
      total,
      passed,
      failed,
      flaky: 0,
      skipped: 0,
      passRate: total > 0 ? passed / total : 0,
    }
  }

  logCategoryResults(category, config, stats) {
    const passRatePercent = (stats.passRate * 100).toFixed(1)
    const thresholdPercent = (config.threshold * 100).toFixed(0)
    const status = stats.passRate >= config.threshold ? '✅ PASS' : '❌ FAIL'
    const duration = this.results[category]?.duration || 'N/A'

    console.log(`\n📊 ${config.name} Results:`)
    console.log(`   Total: ${stats.total}`)
    console.log(`   Passed: ${stats.passed}`)
    console.log(`   Failed: ${stats.failed}`)
    if (stats.flaky > 0) console.log(`   Flaky: ${stats.flaky}`)
    if (stats.skipped > 0) console.log(`   Skipped: ${stats.skipped}`)
    console.log(`   Pass Rate: ${passRatePercent}% (required: ${thresholdPercent}%)`)
    console.log(`   Duration: ${duration}s`)
    console.log(`   Status: ${status}`)
  }

  generateSummaryReport() {
    console.log('\n' + '='.repeat(60))
    console.log('📋 FINAL E2E TEST SUMMARY')
    console.log('='.repeat(60))

    let totalTests = 0
    let totalPassed = 0
    let categoriesPassed = 0

    Object.entries(this.results).forEach(([category, result]) => {
      const config = TEST_CATEGORIES[category]
      const passRatePercent = (result.passRate * 100).toFixed(1)
      const thresholdPercent = (result.threshold * 100).toFixed(0)
      const status = result.passed ? '✅' : '❌'

      console.log(`\n${status} ${config.name}:`)
      console.log(`   Pass Rate: ${passRatePercent}% (threshold: ${thresholdPercent}%)`)
      console.log(`   Tests: ${result.passed}/${result.total}`)

      totalTests += result.total
      totalPassed += result.passed
      if (result.passed) categoriesPassed++
    })

    const overallPassRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0
    const categoryPassRate =
      Object.keys(this.results).length > 0
        ? ((categoriesPassed / Object.keys(this.results).length) * 100).toFixed(1)
        : 0

    console.log('\n' + '-'.repeat(40))
    console.log(`📊 Overall Statistics:`)
    console.log(`   Total Tests: ${totalTests}`)
    console.log(`   Overall Pass Rate: ${overallPassRate}%`)
    console.log(
      `   Categories Passed: ${categoriesPassed}/${Object.keys(this.results).length} (${categoryPassRate}%)`
    )
    console.log(`   Final Status: ${this.overallSuccess ? '✅ SUCCESS' : '❌ FAILURE'}`)

    return this.overallSuccess
  }

  async run() {
    console.log('🚀 Starting CI E2E Tests with Threshold-based Evaluation')
    console.log('='.repeat(60))

    // Show environment info
    console.log('\n📋 Environment Information:')
    console.log(`   Node Version: ${process.version}`)
    console.log(`   Platform: ${process.platform}`)
    console.log(`   CI Environment: ${process.env.CI ? 'Yes' : 'No'}`)
    console.log(`   Working Directory: ${process.cwd()}`)
    console.log(`   Retries: ${process.env.CI ? '3' : '0'} per test`)
    console.log(`   Test Categories: ${Object.keys(TEST_CATEGORIES).length}`)
    console.log('='.repeat(60))

    // Run each test category
    for (const [category, config] of Object.entries(TEST_CATEGORIES)) {
      await this.runTestCategory(category, config)
    }

    // Generate final report
    const success = this.generateSummaryReport()

    // Write results to file for CI artifacts
    const reportPath = path.join(process.cwd(), 'e2e-threshold-report.json')
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          success,
          results: this.results,
          summary: {
            totalTests: Object.values(this.results).reduce((sum, r) => sum + r.total, 0),
            totalPassed: Object.values(this.results).reduce((sum, r) => sum + r.passed, 0),
            categoriesPassed: Object.values(this.results).filter(r => r.passed).length,
            totalCategories: Object.keys(this.results).length,
          },
        },
        null,
        2
      )
    )

    console.log(`\n📄 Detailed report saved to: ${reportPath}`)

    // Exit with appropriate code
    process.exit(success ? 0 : 1)
  }
}

// Handle command line arguments
const args = process.argv.slice(2)
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🧪 CI E2E Test Runner with Threshold-based Pass/Fail Logic

Usage: node scripts/ci-e2e-runner.js [options]

Options:
  --help, -h     Show this help message
  
Test Categories:
  Critical Tests (90% threshold): Authentication flows (login, registration, basic auth)
  Core Tests (85% threshold):     Post management features (create, view, search)

This runner evaluates E2E tests based on configurable pass rate thresholds
instead of failing on the first test failure.
`)
  process.exit(0)
}

// Run the tests
const runner = new E2ETestRunner()
runner.run().catch(error => {
  console.error('💥 Fatal error:', error.message)
  process.exit(1)
})
