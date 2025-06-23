// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NODE_ENV = 'test'
process.env.USE_MOCK_DATA = 'true'

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
