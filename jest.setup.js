require('@testing-library/jest-dom')

// Extend Jest matchers with jest-dom custom matchers
expect.extend(require('@testing-library/jest-dom/matchers'))

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NODE_ENV = 'test'
process.env.USE_MOCK_DATA = 'true'

// Polyfill for Next.js API routes in JSDOM environment
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Fetch polyfill for API routes (node-fetch v2 for CJS compatibility)
const fetch = require('node-fetch')
global.fetch = global.fetch || fetch
global.Request = global.Request || fetch.Request
global.Headers = global.Headers || fetch.Headers

// Enhanced Response with json static method for Next.js compatibility
const OriginalResponse = fetch.Response
global.Response = class Response extends OriginalResponse {
  static json(data, init) {
    return new Response(JSON.stringify(data), {
      status: 200,
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    })
  }
}

// Mock Next.js router for components
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock window.matchMedia (only in DOM environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

// Suppress console.error during tests unless test actually fails
const originalError = console.error
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks()
  // Suppress console.error during tests
  console.error = jest.fn()
})

afterEach(() => {
  // Restore original console.error
  console.error = originalError
})
