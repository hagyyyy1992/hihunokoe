#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Function to update test file for clean architecture
function updateTestFile(filePath) {
  console.log(`Updating ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  // Common transformations for all test files
  const transformations = [
    // Update auth module mocks
    {
      pattern: /jest\.mock\(['"]@\/lib\/auth\/auth['"]/g,
      replacement: "jest.mock('@api/framework/controllers/AuthController'",
      name: 'auth module mock'
    },
    
    // Update admin middleware mocks
    {
      pattern: /jest\.mock\(['"]@\/lib\/auth\/admin-middleware['"]/g,
      replacement: "jest.mock('@api/framework/middleware/AdminAuthMiddleware'",
      name: 'admin middleware mock'
    },
    
    // Update rate limiter mocks
    {
      pattern: /jest\.mock\(['"]@\/lib\/rate-limiter['"]/g,
      replacement: "jest.mock('@api/interface-adapters/services/RateLimitServiceImpl'",
      name: 'rate limiter mock'
    },
    
    // Update imports for auth functions
    {
      pattern: /import \* as authModule from ['"]@\/lib\/auth\/auth['"]/g,
      replacement: "import { AuthController } from '@api/framework/controllers/AuthController'",
      name: 'auth module import'
    },
    
    // Update imports for specific auth functions
    {
      pattern: /import \{ ([^}]+) \} from ['"]@\/lib\/auth\/auth['"]/g,
      replacement: (match, funcs) => {
        // Map old functions to new controller methods
        const funcMapping = {
          'loginUser': 'login',
          'registerUser': 'register',
          'logoutUser': 'logout',
          'getCurrentUser': 'getCurrentUser',
          'generateToken': 'generateToken',
          'verifyToken': 'verifyToken',
        };
        
        return "import { AuthController } from '@api/framework/controllers/AuthController'";
      },
      name: 'specific auth imports'
    },
    
    // Update mock implementations
    {
      pattern: /mockLoginUser\.mockResolvedValue/g,
      replacement: 'mockAuthController.login.mockResolvedValue',
      name: 'login mock'
    },
    
    {
      pattern: /mockRegisterUser\.mockResolvedValue/g,
      replacement: 'mockAuthController.register.mockResolvedValue',
      name: 'register mock'
    },
    
    // Update POST/GET imports to use controllers
    {
      pattern: /import \{ (POST|GET|PUT|DELETE) \} from ['"]@\/app\/api\/([\w/-]+)\/route['"]/g,
      replacement: (match, method, path) => {
        const controllerMap = {
          'auth/login': 'AuthController',
          'auth/register': 'AuthController',
          'auth/logout': 'AuthController',
          'auth/me': 'AuthController',
          'auth/forgot-password': 'AuthController',
          'auth/reset-password': 'AuthController',
          'auth/verify-email': 'AuthController',
          'auth/delete-account': 'AuthController',
          'posts': 'PostController',
          'posts/[id]': 'PostController',
          'posts/[id]/empathy': 'PostController',
          'admin/auth/login': 'AdminController',
          'admin/dashboard/stats': 'AdminController',
          'profile/update': 'ProfileController',
        };
        
        const controller = controllerMap[path] || 'Controller';
        return `import { ${controller} } from '@api/framework/controllers/${controller}'
import { ${method} } from '@/app/api/${path}/route'`;
      },
      name: 'route imports'
    },
    
    // Fix NextRequest usage in tests
    {
      pattern: /new NextRequest\(.*?\)/gs,
      replacement: (match) => {
        // Check if the test needs special handling
        if (match.includes('auth-token')) {
          // For tests that check auth tokens
          return match;
        }
        return match;
      },
      name: 'NextRequest usage'
    }
  ];
  
  // Apply transformations
  transformations.forEach(({ pattern, replacement, name }) => {
    const before = content;
    if (typeof replacement === 'string') {
      content = content.replace(pattern, replacement);
    } else {
      content = content.replace(pattern, replacement);
    }
    if (before !== content) {
      console.log(`  ✓ Updated ${name}`);
      updated = true;
    }
  });
  
  // Special handling for specific test files
  if (filePath.includes('auth/login.test.ts')) {
    // Add mock setup for AuthController
    if (!content.includes('mockAuthController')) {
      const mockSetup = `
const mockAuthController = {
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  getCurrentUser: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  verifyEmail: jest.fn(),
  deleteAccount: jest.fn(),
};

jest.mock('@api/framework/controllers/AuthController', () => ({
  AuthController: jest.fn(() => mockAuthController),
}));
`;
      content = content.replace(/jest\.mock.*?AuthController.*?\}\);?\s*/gs, mockSetup);
      console.log('  ✓ Added AuthController mock setup');
      updated = true;
    }
  }
  
  // Write the updated content back
  if (updated) {
    fs.writeFileSync(filePath, content);
    console.log(`✓ Updated ${filePath}\n`);
  } else {
    console.log(`⚠️  No changes needed for ${filePath}\n`);
  }
}

// Main function
async function updateAllTests() {
  console.log('Updating test files for clean architecture...\n');
  
  // Find all test files in the new location
  const testFiles = glob.sync('api/src/__tests__/**/*.test.ts');
  
  for (const file of testFiles) {
    try {
      updateTestFile(file);
    } catch (error) {
      console.error(`✗ Error updating ${file}: ${error.message}\n`);
    }
  }
  
  console.log('Update complete!');
}

// Check if glob is installed
try {
  require.resolve('glob');
} catch (e) {
  console.error('Installing glob package...');
  require('child_process').execSync('npm install glob', { stdio: 'inherit' });
}

// Run the update
updateAllTests().catch(console.error);