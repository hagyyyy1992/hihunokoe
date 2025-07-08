#!/usr/bin/env node

const fs = require('fs')
const glob = require('glob')

// Fix mock initialization issues in test files
function fixMockInitialization(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')

  // Pattern to find mock variable references before initialization
  const mockPattern = /mockConstructor\.(mock\w+) \(.*?\:.*?mockConstructor\.(mock\w+),/g

  // Check if file has the initialization issue
  if (content.includes('Cannot access') || content.includes('before initialization')) {
    console.log(`Fixing ${filePath}...`)

    // Replace the problematic pattern with a function that returns the mock
    content = content.replace(
      /const (mock\w+) = jest\.fn\(\)\s*jest\.mock\(['"]@api\/framework\/controllers\/(\w+)['"]\s*,\s*\(\)\s*=>\s*\(\s*{\s*(\w+):\s*jest\.fn\(\)\.mockImplementation\(\s*\(\)\s*=>\s*\(\s*{\s*([\w\s:,]+),?\s*}\s*\)\s*\)\s*}\s*\)\s*\)/g,
      (match, mockName, controllerName, controllerExport, methods) => {
        // Extract method name from the methods string
        const methodMatch = methods.match(/(\w+):\s*mock\w+/)
        const methodName = methodMatch ? methodMatch[1] : 'unknownMethod'

        return `jest.mock('@api/framework/controllers/${controllerName}', () => ({
  ${controllerExport}: jest.fn().mockImplementation(() => ({
    ${methodName}: jest.fn()
  }))
}))`
      }
    )

    // Fix variable name issues (mockforgotPassword -> mockForgotPassword)
    content = content.replace(/mock([a-z])(\w+)/g, (match, firstLetter, rest) => {
      return 'mock' + firstLetter.toUpperCase() + rest
    })

    fs.writeFileSync(filePath, content)
    console.log(`✓ Fixed ${filePath}`)
    return true
  }

  return false
}

// Fix test files based on the error pattern
function fixTestFiles() {
  console.log('Fixing mock initialization issues...\n')

  const testFiles = glob.sync('api/src/__tests__/**/*.test.ts')
  let fixedCount = 0

  testFiles.forEach(file => {
    if (fixMockInitialization(file)) {
      fixedCount++
    }
  })

  // Specifically fix known problematic files
  const problematicFiles = [
    'api/src/__tests__/api/auth/forgot-password.test.ts',
    'api/src/__tests__/api/auth/reset-password.test.ts',
    'api/src/__tests__/api/auth/verify-email.test.ts',
    'api/src/__tests__/api/auth/resend-verification.test.ts',
    'api/src/__tests__/api/auth/verify-reset-token.test.ts',
    'api/src/__tests__/api/auth/delete-account.test.ts',
    'api/src/__tests__/api/admin/auth/login.test.ts',
    'api/src/__tests__/api/admin/dashboard/stats.test.ts',
    'api/src/__tests__/api/posts/posts.test.ts',
    'api/src/__tests__/api/posts/[id].test.ts',
    'api/src/__tests__/api/posts/[id]/empathy.test.ts',
    'api/src/__tests__/api/profile/update.test.ts',
  ]

  problematicFiles.forEach(file => {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8')

      // Extract controller and method info from the file
      const controllerMatch = content.match(/controllers\/(\w+)/)
      const methodMatch = content.match(/mock(\w+) = jest\.fn/)

      if (controllerMatch && methodMatch) {
        const controller = controllerMatch[1]
        const method = methodMatch[1].charAt(0).toLowerCase() + methodMatch[1].slice(1)

        // Create a proper mock implementation
        const newMock = `jest.mock('@api/framework/controllers/${controller}', () => ({
  ${controller}: jest.fn().mockImplementation(() => ({
    ${method}: jest.fn().mockImplementation(async (request) => {
      // Default mock implementation
      return new Response(
        JSON.stringify({ message: 'Mock response' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    })
  }))
}))`

        // Replace the entire mock section
        content = content.replace(/const mock.*?jest\.mock\(['"]@api.*?\}\)\)/s, newMock)

        // Remove duplicate imports and mocks
        content = content.replace(/import { NextRequest }.*?\n/g, '')
        content = content.replace(/import { .*? } from.*?route'\n/g, '')

        // Add imports back at the top
        const imports = `import { NextRequest } from 'next/server'
import { GET, POST, PUT, DELETE } from '${content.match(/@\/app\/api[^']+/)?.[0] || '@/app/api/route'}'

`

        content = newMock + '\n\n' + imports + content.replace(/jest\.mock[\s\S]*?\}\)\)/g, '')

        fs.writeFileSync(file, content)
        console.log(`✓ Specifically fixed ${file}`)
        fixedCount++
      }
    }
  })

  console.log(`\nFixed ${fixedCount} test files!`)
}

// Run the fixes
fixTestFiles()
