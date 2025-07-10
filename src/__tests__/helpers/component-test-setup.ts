import { createMockLocalStorage, setupFetchMock, createMockFetch } from './component-mocks'

// Global test setup for components
export const setupComponentTest = () => {
  // Mock localStorage
  const mockLocalStorage = createMockLocalStorage()
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  })

  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: createMockLocalStorage(),
    writable: true,
  })

  // Mock fetch
  const mockFetch = createMockFetch()
  setupFetchMock(mockFetch)

  // Mock IntersectionObserver
  global.IntersectionObserver = jest.fn(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })) as unknown as jest.MockedClass<typeof IntersectionObserver>

  // Mock ResizeObserver
  global.ResizeObserver = jest.fn(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })) as unknown as jest.MockedClass<typeof ResizeObserver>

  // Mock scrollIntoView
  Element.prototype.scrollIntoView = jest.fn()

  // Mock getBoundingClientRect
  Element.prototype.getBoundingClientRect = jest.fn(() => ({
    bottom: 0,
    height: 0,
    left: 0,
    right: 0,
    top: 0,
    width: 0,
    x: 0,
    y: 0,
    toJSON: jest.fn(),
  }))

  return {
    mockLocalStorage,
    mockFetch,
  }
}

// Cleanup function
export const cleanupComponentTest = () => {
  jest.clearAllMocks()
  jest.restoreAllMocks()
}

// Common test utilities
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const flushPromises = () => new Promise(setImmediate)

// Mock window methods
export const mockWindowMethods = () => {
  Object.defineProperty(window, 'alert', {
    value: jest.fn(),
    writable: true,
  })

  Object.defineProperty(window, 'confirm', {
    value: jest.fn(() => true),
    writable: true,
  })

  Object.defineProperty(window, 'prompt', {
    value: jest.fn(() => 'test'),
    writable: true,
  })
}

// Mock CSS media queries
export const mockMediaQuery = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
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

// Helper for testing error boundaries
export const throwError = () => {
  throw new Error('Test error')
}

// Mock console methods for testing
export const mockConsole = () => {
  const originalConsole = { ...console }

  console.log = jest.fn()
  console.warn = jest.fn()
  console.error = jest.fn()
  console.info = jest.fn()

  return {
    restore: () => {
      Object.assign(console, originalConsole)
    },
  }
}
