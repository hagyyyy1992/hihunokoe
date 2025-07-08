#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Test templates for different controllers
const testTemplates = {
  auth: (methodName, routePath) => `// Mock the controller
const mock${methodName} = jest.fn()
jest.mock('@api/framework/controllers/AuthController', () => ({
  AuthController: jest.fn().mockImplementation(() => ({
    ${methodName}: mock${methodName},
  })),
}))

import { NextRequest } from 'next/server'
import { POST, GET } from '${routePath}'

const createMockResponse = (status, data) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
  })
}
`,

  admin: (methodName, routePath) => `// Mock the controller
const mock${methodName} = jest.fn()
jest.mock('@api/framework/controllers/AdminController', () => ({
  AdminController: jest.fn().mockImplementation(() => ({
    ${methodName}: mock${methodName},
  })),
}))

import { NextRequest } from 'next/server'
import { POST, GET } from '${routePath}'

const createMockResponse = (status, data) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
  })
}
`,

  post: (methodName, routePath) => `// Mock the controller
const mock${methodName} = jest.fn()
jest.mock('@api/framework/controllers/PostController', () => ({
  PostController: jest.fn().mockImplementation(() => ({
    ${methodName}: mock${methodName},
  })),
}))

import { NextRequest } from 'next/server'
import { GET, POST, PUT, DELETE } from '${routePath}'

const createMockResponse = (status, data) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
  })
}
`,

  profile: (methodName, routePath) => `// Mock the controller
const mock${methodName} = jest.fn()
jest.mock('@api/framework/controllers/ProfileController', () => ({
  ProfileController: jest.fn().mockImplementation(() => ({
    ${methodName}: mock${methodName},
  })),
}))

import { NextRequest } from 'next/server'
import { POST, GET } from '${routePath}'

const createMockResponse = (status, data) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
  })
}
`,
}

// Mapping of test files to their controller methods
const testMappings = {
  'api/src/__tests__/api/auth/delete-account.test.ts': {
    controller: 'auth',
    method: 'deleteAccount',
    routePath: '@/app/api/auth/delete-account/route',
  },
  'api/src/__tests__/api/auth/forgot-password.test.ts': {
    controller: 'auth',
    method: 'forgotPassword',
    routePath: '@/app/api/auth/forgot-password/route',
  },
  'api/src/__tests__/api/auth/reset-password.test.ts': {
    controller: 'auth',
    method: 'resetPassword',
    routePath: '@/app/api/auth/reset-password/route',
  },
  'api/src/__tests__/api/auth/verify-email.test.ts': {
    controller: 'auth',
    method: 'verifyEmail',
    routePath: '@/app/api/auth/verify-email/route',
  },
  'api/src/__tests__/api/auth/resend-verification.test.ts': {
    controller: 'auth',
    method: 'resendVerificationEmail',
    routePath: '@/app/api/auth/resend-verification/route',
  },
  'api/src/__tests__/api/auth/verify-reset-token.test.ts': {
    controller: 'auth',
    method: 'verifyPasswordResetToken',
    routePath: '@/app/api/auth/verify-reset-token/route',
  },
  'api/src/__tests__/api/admin/auth/login.test.ts': {
    controller: 'admin',
    method: 'login',
    routePath: '@/app/api/admin/auth/login/route',
  },
  'api/src/__tests__/api/admin/dashboard/stats.test.ts': {
    controller: 'admin',
    method: 'getDashboardStats',
    routePath: '@/app/api/admin/dashboard/stats/route',
  },
  'api/src/__tests__/api/posts/posts.test.ts': {
    controller: 'post',
    method: 'getPosts',
    routePath: '@/app/api/posts/route',
  },
  'api/src/__tests__/api/posts/[id].test.ts': {
    controller: 'post',
    method: 'getPost',
    routePath: '@/app/api/posts/[id]/route',
  },
  'api/src/__tests__/api/posts/[id]/empathy.test.ts': {
    controller: 'post',
    method: 'toggleEmpathy',
    routePath: '@/app/api/posts/[id]/empathy/route',
  },
  'api/src/__tests__/api/profile/update.test.ts': {
    controller: 'profile',
    method: 'updateProfile',
    routePath: '@/app/api/profile/update/route',
  },
}

// Function to update a test file
function updateTestFile(filePath, mapping) {
  console.log(`Updating ${filePath}...`)

  try {
    let content = fs.readFileSync(filePath, 'utf8')

    // Get the template
    const template = testTemplates[mapping.controller]
    if (!template) {
      console.log(`⚠️  No template for controller: ${mapping.controller}`)
      return
    }

    // Extract the test cases (everything after the first describe block)
    const describeMatch = content.match(/describe\(['"`].*?['"`],\s*\(\)\s*=>\s*{[\s\S]*$/)
    if (!describeMatch) {
      console.log(`⚠️  Could not find describe block in ${filePath}`)
      return
    }

    // Generate new content
    const newContent = template(mapping.method, mapping.routePath) + '\n' + describeMatch[0]

    // Update mock references
    const mockName = `mock${mapping.method.charAt(0).toUpperCase() + mapping.method.slice(1)}`

    // Common replacements
    const replacements = [
      // Auth module mocks
      [
        /mock(LoginUser|RegisterUser|GetCurrentUser|VerifyToken|GetUserById|DeleteAccount)/g,
        mockName,
      ],
      [/authModule\.\w+/g, mockName],

      // Password reset mocks
      [/mock(InitPasswordReset|ResetPassword|VerifyPasswordResetToken)/g, mockName],
      [/passwordResetModule\.\w+/g, mockName],

      // Email verification mocks
      [/mock(VerifyEmail|ResendVerificationEmail)/g, mockName],
      [/emailVerificationModule\.\w+/g, mockName],

      // Admin mocks
      [/mockAuth\.\w+/g, mockName],
      [/mockLoginAdmin/g, mockName],

      // Response handling
      [
        /\.mockResolvedValue\(([^)]+)\)/g,
        (match, value) => {
          // If the value is just an object, wrap it in createMockResponse
          if (!value.includes('createMockResponse')) {
            return `.mockResolvedValue(createMockResponse(200, ${value}))`
          }
          return match
        },
      ],

      // Error handling
      [
        /\.mockRejectedValue\(new Error\(['"`](.*?)['"`]\)\)/g,
        '.mockResolvedValue(createMockResponse(500, { error: "$1" }))',
      ],

      // Field name updates
      [/userName/g, 'username'],

      // Remove unused imports
      [/import \* as \w+Module from.*?\n/g, ''],
      [/const mock\w+ = [\s\S]*?>\n/g, ''],
    ]

    let updatedContent = newContent
    replacements.forEach(([pattern, replacement]) => {
      updatedContent = updatedContent.replace(pattern, replacement)
    })

    // Write the updated content
    fs.writeFileSync(filePath, updatedContent)
    console.log(`✓ Updated ${filePath}`)
  } catch (error) {
    console.error(`✗ Error updating ${filePath}: ${error.message}`)
  }
}

// Main function
function updateAllTests() {
  console.log('Batch updating test files for clean architecture...\n')

  Object.entries(testMappings).forEach(([filePath, mapping]) => {
    if (fs.existsSync(filePath)) {
      updateTestFile(filePath, mapping)
    } else {
      console.log(`⚠️  File not found: ${filePath}`)
    }
  })

  console.log('\nBatch update complete!')
}

// Run the update
updateAllTests()
