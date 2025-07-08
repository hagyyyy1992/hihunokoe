#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define test file fixes
const testFixes = {
  // Auth tests
  'api/src/__tests__/api/auth/login.test.ts': {
    mockSetup: `const mockAuthController = {
  login: jest.fn(),
};

jest.mock('@api/framework/controllers/AuthController', () => ({
  AuthController: jest.fn(() => mockAuthController),
}))`,
    imports: `import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/login/route'
import { AuthController } from '@api/framework/controllers/AuthController'`,
    replacements: [
      { from: /mockLoginUser/g, to: 'mockAuthController.login' },
      { from: /mockGenerateToken[^;]+;/g, to: '' },
      { from: /userName/g, to: 'username' },
    ]
  },
  
  'api/src/__tests__/api/auth/logout.test.ts': {
    mockSetup: `const mockAuthController = {
  logout: jest.fn(),
};

jest.mock('@api/framework/controllers/AuthController', () => ({
  AuthController: jest.fn(() => mockAuthController),
}))`,
    imports: `import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/logout/route'
import { AuthController } from '@api/framework/controllers/AuthController'`,
    replacements: [
      { from: /logoutUser/g, to: 'mockAuthController.logout' },
    ]
  },
  
  'api/src/__tests__/api/auth/me.test.ts': {
    mockSetup: `const mockAuthController = {
  getCurrentUser: jest.fn(),
};

jest.mock('@api/framework/controllers/AuthController', () => ({
  AuthController: jest.fn(() => mockAuthController),
}))`,
    imports: `import { NextRequest } from 'next/server'
import { GET } from '@/app/api/auth/me/route'
import { AuthController } from '@api/framework/controllers/AuthController'`,
    replacements: [
      { from: /getCurrentUser/g, to: 'mockAuthController.getCurrentUser' },
      { from: /verifyToken/g, to: 'mockAuthController.getCurrentUser' },
    ]
  },
  
  'api/src/__tests__/api/auth/delete-account.test.ts': {
    mockSetup: `const mockAuthController = {
  deleteAccount: jest.fn(),
};

jest.mock('@api/framework/controllers/AuthController', () => ({
  AuthController: jest.fn(() => mockAuthController),
}))`,
    imports: `import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/delete-account/route'
import { AuthController } from '@api/framework/controllers/AuthController'`,
    replacements: [
      { from: /deleteAccount/g, to: 'mockAuthController.deleteAccount' },
    ]
  },
  
  'api/src/__tests__/api/auth/forgot-password.test.ts': {
    mockSetup: `const mockAuthController = {
  forgotPassword: jest.fn(),
};

jest.mock('@api/framework/controllers/AuthController', () => ({
  AuthController: jest.fn(() => mockAuthController),
}))`,
    imports: `import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/forgot-password/route'
import { AuthController } from '@api/framework/controllers/AuthController'`,
    replacements: [
      { from: /initPasswordReset/g, to: 'mockAuthController.forgotPassword' },
    ]
  },
  
  'api/src/__tests__/api/auth/reset-password.test.ts': {
    mockSetup: `const mockAuthController = {
  resetPassword: jest.fn(),
};

jest.mock('@api/framework/controllers/AuthController', () => ({
  AuthController: jest.fn(() => mockAuthController),
}))`,
    imports: `import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/reset-password/route'
import { AuthController } from '@api/framework/controllers/AuthController'`,
    replacements: [
      { from: /resetPassword/g, to: 'mockAuthController.resetPassword' },
    ]
  },
  
  'api/src/__tests__/api/auth/verify-email.test.ts': {
    mockSetup: `const mockAuthController = {
  verifyEmail: jest.fn(),
};

jest.mock('@api/framework/controllers/AuthController', () => ({
  AuthController: jest.fn(() => mockAuthController),
}))`,
    imports: `import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/verify-email/route'
import { AuthController } from '@api/framework/controllers/AuthController'`,
    replacements: [
      { from: /verifyEmail/g, to: 'mockAuthController.verifyEmail' },
    ]
  },
  
  'api/src/__tests__/api/auth/resend-verification.test.ts': {
    mockSetup: `const mockAuthController = {
  resendVerificationEmail: jest.fn(),
};

jest.mock('@api/framework/controllers/AuthController', () => ({
  AuthController: jest.fn(() => mockAuthController),
}))`,
    imports: `import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/resend-verification/route'
import { AuthController } from '@api/framework/controllers/AuthController'`,
    replacements: [
      { from: /resendVerificationEmail/g, to: 'mockAuthController.resendVerificationEmail' },
    ]
  },
  
  'api/src/__tests__/api/auth/verify-reset-token.test.ts': {
    mockSetup: `const mockAuthController = {
  verifyPasswordResetToken: jest.fn(),
};

jest.mock('@api/framework/controllers/AuthController', () => ({
  AuthController: jest.fn(() => mockAuthController),
}))`,
    imports: `import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/verify-reset-token/route'
import { AuthController } from '@api/framework/controllers/AuthController'`,
    replacements: [
      { from: /verifyPasswordResetToken/g, to: 'mockAuthController.verifyPasswordResetToken' },
    ]
  },
  
  // Admin tests
  'api/src/__tests__/api/admin/auth/login.test.ts': {
    mockSetup: `const mockAdminController = {
  login: jest.fn(),
};

jest.mock('@api/framework/controllers/AdminController', () => ({
  AdminController: jest.fn(() => mockAdminController),
}))`,
    imports: `import { NextRequest } from 'next/server'
import { POST } from '@/app/api/admin/auth/login/route'
import { AdminController } from '@api/framework/controllers/AdminController'`,
    replacements: [
      { from: /mockAuth\./g, to: 'mockAdminController.' },
    ]
  },
  
  // Post tests
  'api/src/__tests__/api/posts/posts.test.ts': {
    mockSetup: `const mockPostController = {
  getPosts: jest.fn(),
  createPost: jest.fn(),
};

jest.mock('@api/framework/controllers/PostController', () => ({
  PostController: jest.fn(() => mockPostController),
}))`,
    imports: `import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/posts/route'
import { PostController } from '@api/framework/controllers/PostController'`,
    replacements: []
  },
  
  // Profile tests
  'api/src/__tests__/api/profile/update.test.ts': {
    mockSetup: `const mockProfileController = {
  updateProfile: jest.fn(),
};

jest.mock('@api/framework/controllers/ProfileController', () => ({
  ProfileController: jest.fn(() => mockProfileController),
}))`,
    imports: `import { NextRequest } from 'next/server'
import { POST } from '@/app/api/profile/update/route'
import { ProfileController } from '@api/framework/controllers/ProfileController'`,
    replacements: []
  },
};

// Function to fix a test file
function fixTestFile(filePath, fixes) {
  console.log(`Fixing ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove old mocks
  content = content.replace(/jest\.mock\(['"]@.*?['"]\s*,.*?\}\)\);?/gs, '');
  content = content.replace(/import \* as \w+Module from.*?\n/g, '');
  content = content.replace(/const mock\w+ = [\s\S]*?>\n/g, '');
  
  // Add new mock setup at the beginning
  content = fixes.mockSetup + '\n\n' + content;
  
  // Replace imports
  const importMatch = content.match(/import[\s\S]*?from\s+['"].*?['"]/g);
  if (importMatch) {
    content = content.replace(importMatch[0], fixes.imports);
  }
  
  // Apply specific replacements
  fixes.replacements.forEach(({ from, to }) => {
    content = content.replace(from, to);
  });
  
  // Clean up duplicate imports
  const lines = content.split('\n');
  const uniqueLines = [];
  const seenImports = new Set();
  
  lines.forEach(line => {
    if (line.startsWith('import ')) {
      if (!seenImports.has(line)) {
        seenImports.add(line);
        uniqueLines.push(line);
      }
    } else {
      uniqueLines.push(line);
    }
  });
  
  content = uniqueLines.join('\n');
  
  fs.writeFileSync(filePath, content);
  console.log(`✓ Fixed ${filePath}`);
}

// Main function
function fixAllTests() {
  console.log('Fixing all test files for clean architecture...\n');
  
  Object.entries(testFixes).forEach(([filePath, fixes]) => {
    if (fs.existsSync(filePath)) {
      try {
        fixTestFile(filePath, fixes);
      } catch (error) {
        console.error(`✗ Error fixing ${filePath}: ${error.message}`);
      }
    } else {
      console.log(`⚠️  File not found: ${filePath}`);
    }
  });
  
  console.log('\nFix complete!');
}

// Run the fixes
fixAllTests();