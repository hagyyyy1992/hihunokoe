#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Template for creating properly mocked tests
const createTestFile = (controllerName, methodName, routePath, testCases) => {
  return `// Mock the entire ${controllerName} class
jest.mock('@api/framework/controllers/${controllerName}', () => {
  return {
    ${controllerName}: jest.fn().mockImplementation(() => {
      return {
        ${methodName}: jest.fn().mockImplementation(async (request) => {
          // Mock implementation based on request
          return new Response(
            JSON.stringify({ message: 'Mock response' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        })
      }
    })
  }
})

import { NextRequest } from 'next/server'
import { GET, POST, PUT, DELETE } from '${routePath}'

${testCases}
`;
};

// Mapping of test files that need updates
const testUpdates = [
  // Simple tests that don't need mocking
  {
    path: 'api/src/__tests__/api/auth/logout.test.ts',
    skip: true, // This test doesn't mock anything
  },
  {
    path: 'api/src/__tests__/api/posts/test.test.ts',
    controller: 'HealthController',
    method: 'checkPostsApi',
    route: '@/app/api/posts/test/route',
  },
  {
    path: 'api/src/__tests__/api/test/reset-rate-limiters.test.ts',
    controller: 'TestController',
    method: 'resetRateLimiters',
    route: '@/app/api/test/reset-rate-limiters/route',
  },
  // Auth tests
  {
    path: 'api/src/__tests__/api/auth/email-verification.test.ts',
    skip: true, // Complex test, handle separately
  },
  // Library tests that need different handling
  {
    path: 'api/src/__tests__/lib/auth/password-validation.test.ts',
    skip: true, // Library test, not API test
  },
  {
    path: 'api/src/__tests__/lib/auth/delete-account.test.ts',
    skip: true, // Library test, not API test
  },
  {
    path: 'api/src/__tests__/lib/rate-limiter.test.ts',
    skip: true, // Library test, not API test
  },
];

// Fix simple test files
function fixSimpleTest(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // For tests that have NextRequest constructor errors
  if (content.includes('Expected 1 arguments, but got 0')) {
    // Update NextRequest usage
    const fixed = content.replace(
      /new NextRequest\(\)/g,
      "new NextRequest('http://localhost:3000/test')"
    );
    
    fs.writeFileSync(filePath, fixed);
    console.log(`✓ Fixed NextRequest usage in ${filePath}`);
  }
}

// Fix GetUserUseCase test
function fixGetUserUseCaseTest() {
  const testPath = 'api/src/__tests__/usecases/user/GetUserUseCase.test.ts';
  if (!fs.existsSync(testPath)) return;
  
  const content = `import { GetUserUseCase } from '@api/usecases/user/interactor'
import { UserRepository } from '@api/domain/repositories/UserRepository'
import { User, UserRole } from '@api/domain/entities/User'

// Create a mock repository that implements all required methods
class MockUserRepository implements UserRepository {
  findById = jest.fn()
  findByEmail = jest.fn()
  findByUsername = jest.fn()
  findByEmailVerificationToken = jest.fn()
  findByPasswordResetToken = jest.fn()
  findMany = jest.fn()
  create = jest.fn()
  update = jest.fn()
  delete = jest.fn()
  softDelete = jest.fn()
  incrementFailedLoginAttempts = jest.fn()
  resetFailedLoginAttempts = jest.fn()
  lockAccount = jest.fn()
  updatePassword = jest.fn()
  verifyEmail = jest.fn()
}

describe('GetUserUseCase', () => {
  let useCase: GetUserUseCase
  let mockUserRepository: MockUserRepository

  beforeEach(() => {
    mockUserRepository = new MockUserRepository()
    useCase = new GetUserUseCase(mockUserRepository)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return user when found', async () => {
    const mockUser = new User(
      '1',
      'test@example.com',
      'testuser',
      'testuser',
      'hashedPassword',
      null, // displayName
      null, // profileImageUrl
      null, // birthDate
      null, // gender
      null, // skinType
      null, // skinTypeOther
      null, // allergies
      null, // allergiesOther
      true, // emailVerified
      null, // emailVerificationToken
      null, // passwordResetToken
      null, // passwordResetExpires
      0, // failedLoginAttempts
      null, // lockedUntil
      UserRole.USER,
      true, // active
      true, // isActive
      null, // deletedAt
      new Date(),
      new Date(),
      undefined // password
    )

    mockUserRepository.findById.mockResolvedValue(mockUser)

    const result = await useCase.execute({ id: '1' })

    expect(result.user).toEqual(mockUser)
    expect(mockUserRepository.findById).toHaveBeenCalledWith('1')
  })

  it('should return null when user not found', async () => {
    mockUserRepository.findById.mockResolvedValue(null)

    const result = await useCase.execute({ id: 'non-existent' })

    expect(result.user).toBeNull()
    expect(mockUserRepository.findById).toHaveBeenCalledWith('non-existent')
  })
})`;

  fs.writeFileSync(testPath, content);
  console.log(`✓ Fixed GetUserUseCase test`);
}

// Main function
function fixAllTests() {
  console.log('Fixing all API tests...\n');

  // Fix GetUserUseCase test first
  fixGetUserUseCaseTest();

  // Fix simple tests
  const simpleTests = [
    'api/src/__tests__/api/posts/test.test.ts',
    'api/src/__tests__/api/test/reset-rate-limiters.test.ts',
  ];

  simpleTests.forEach(testPath => {
    if (fs.existsSync(testPath)) {
      fixSimpleTest(testPath);
    }
  });

  // Find and update other test files
  const testFiles = glob.sync('api/src/__tests__/**/*.test.ts');
  
  testFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check for common issues
    if (content.includes('Expected 1 arguments, but got 0') && 
        content.includes('NextRequest')) {
      fixSimpleTest(file);
    }
    
    // Check for userName vs username issues
    if (content.includes('userName')) {
      const fixed = content.replace(/userName/g, 'username');
      fs.writeFileSync(file, fixed);
      console.log(`✓ Fixed userName -> username in ${file}`);
    }
  });

  console.log('\nTest fixes complete!');
}

// Run the fixes
fixAllTests();