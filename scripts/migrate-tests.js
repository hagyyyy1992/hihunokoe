#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Define test file mappings
const testMappings = [
  // Auth tests
  {
    from: '__tests__/api/auth/delete-account.test.ts',
    to: 'api/src/__tests__/api/auth/delete-account.test.ts',
  },
  {
    from: '__tests__/api/auth/email-verification.test.ts',
    to: 'api/src/__tests__/api/auth/email-verification.test.ts',
  },
  {
    from: '__tests__/api/auth/forgot-password.test.ts',
    to: 'api/src/__tests__/api/auth/forgot-password.test.ts',
  },
  { from: '__tests__/api/auth/logout.test.ts', to: 'api/src/__tests__/api/auth/logout.test.ts' },
  { from: '__tests__/api/auth/me.test.ts', to: 'api/src/__tests__/api/auth/me.test.ts' },
  {
    from: '__tests__/api/auth/register.test.ts',
    to: 'api/src/__tests__/api/auth/register.test.ts',
  },
  {
    from: '__tests__/api/auth/resend-verification.test.ts',
    to: 'api/src/__tests__/api/auth/resend-verification.test.ts',
  },
  {
    from: '__tests__/api/auth/reset-password.test.ts',
    to: 'api/src/__tests__/api/auth/reset-password.test.ts',
  },
  {
    from: '__tests__/api/auth/verify-email.test.ts',
    to: 'api/src/__tests__/api/auth/verify-email.test.ts',
  },
  {
    from: '__tests__/api/auth/verify-reset-token.test.ts',
    to: 'api/src/__tests__/api/auth/verify-reset-token.test.ts',
  },

  // Admin tests
  {
    from: '__tests__/api/admin/auth/login.test.ts',
    to: 'api/src/__tests__/api/admin/auth/login.test.ts',
  },
  {
    from: '__tests__/api/admin/dashboard/stats.test.ts',
    to: 'api/src/__tests__/api/admin/dashboard/stats.test.ts',
  },

  // Posts tests
  { from: '__tests__/api/posts/[id].test.ts', to: 'api/src/__tests__/api/posts/[id].test.ts' },
  {
    from: '__tests__/api/posts/[id]/empathy.test.ts',
    to: 'api/src/__tests__/api/posts/[id]/empathy.test.ts',
  },
  {
    from: '__tests__/api/posts/empathy.test.ts',
    to: 'api/src/__tests__/api/posts/empathy.test.ts',
  },
  { from: '__tests__/api/posts/posts.test.ts', to: 'api/src/__tests__/api/posts/posts.test.ts' },
  { from: '__tests__/api/posts/test.test.ts', to: 'api/src/__tests__/api/posts/test.test.ts' },

  // Profile tests
  {
    from: '__tests__/api/profile/update.test.ts',
    to: 'api/src/__tests__/api/profile/update.test.ts',
  },

  // Test utility tests
  {
    from: '__tests__/api/test/cleanup-user.test.ts',
    to: 'api/src/__tests__/api/test/cleanup-user.test.ts',
  },
  {
    from: '__tests__/api/test/reset-rate-limiters.test.ts',
    to: 'api/src/__tests__/api/test/reset-rate-limiters.test.ts',
  },

  // V2 API tests
  { from: '__tests__/api/v2/auth/me.test.ts', to: 'api/src/__tests__/api/v2/auth/me.test.ts' },

  // Library tests
  {
    from: '__tests__/lib/auth/delete-account.test.ts',
    to: 'api/src/__tests__/lib/auth/delete-account.test.ts',
  },
  {
    from: '__tests__/lib/auth/password-validation.test.ts',
    to: 'api/src/__tests__/lib/auth/password-validation.test.ts',
  },
  { from: '__tests__/lib/rate-limiter.test.ts', to: 'api/src/__tests__/lib/rate-limiter.test.ts' },
]

// Common import transformations
const importTransformations = [
  // Route imports
  { from: /@\/app\/api\/auth\/(\w+)\/route/g, to: '@/app/api/auth/$1/route' },
  { from: /@\/app\/api\/admin\/(\w+)\/route/g, to: '@/app/api/admin/$1/route' },
  { from: /@\/app\/api\/posts\/(\w+)\/route/g, to: '@/app/api/posts/$1/route' },

  // Auth module imports - these need to be updated to use clean architecture
  { from: /@\/lib\/auth\/auth/g, to: '@api/usecases/auth/LoginUseCase' },
  { from: /@\/lib\/auth\/admin-middleware/g, to: '@api/framework/middleware/AdminAuthMiddleware' },

  // Mock updates
  { from: /jest\.mock\('@\/lib\/auth\/auth'/g, to: "jest.mock('@api/usecases/auth/LoginUseCase'" },
]

// Function to transform test content
function transformTestContent(content, filePath) {
  let transformed = content

  // Apply import transformations
  importTransformations.forEach(({ from, to }) => {
    transformed = transformed.replace(from, to)
  })

  // Add clean architecture specific transformations based on file path
  if (filePath.includes('auth/login')) {
    // Already handled
  } else if (filePath.includes('auth/register')) {
    transformed = transformed.replace(
      /jest\.mock\('@\/lib\/auth\/auth'.*?\}\)/gs,
      `jest.mock('@api/framework/controllers/AuthController', () => ({
  AuthController: jest.fn().mockImplementation(() => ({
    register: jest.fn(),
  })),
}))`
    )
  }

  return transformed
}

// Function to ensure directory exists
function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// Main migration function
async function migrateTests() {
  console.log('Starting test migration...\n')

  for (const mapping of testMappings) {
    try {
      if (fs.existsSync(mapping.from)) {
        console.log(`Migrating ${mapping.from} -> ${mapping.to}`)

        // Read the original test file
        const content = fs.readFileSync(mapping.from, 'utf8')

        // Transform the content
        const transformedContent = transformTestContent(content, mapping.to)

        // Ensure target directory exists
        ensureDirectoryExists(mapping.to)

        // Write the transformed content
        fs.writeFileSync(mapping.to, transformedContent)

        // Delete the original file
        fs.unlinkSync(mapping.from)

        console.log(`✓ Migrated successfully\n`)
      } else {
        console.log(`⚠️  Skipping ${mapping.from} (file not found)\n`)
      }
    } catch (error) {
      console.error(`✗ Error migrating ${mapping.from}: ${error.message}\n`)
    }
  }

  console.log('Migration complete!')
}

// Run the migration
migrateTests().catch(console.error)
