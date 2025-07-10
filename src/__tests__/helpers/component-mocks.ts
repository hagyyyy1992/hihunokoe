// Mock data for components testing

export const mockUser = {
  id: 'test-user-1',
  userName: 'testuser',
  email: 'test@example.com',
  displayName: 'Test User',
  skinType: 'normal' as const,
  emailVerified: true,
}

export const mockPost = {
  id: 'test-post-1',
  title: 'Test Post Title',
  content: 'This is a test post content for testing components.',
  cosmeticName: 'Test Cosmetic',
  cosmeticCategory: 'toner' as const,
  skinType: 'normal' as const,
  moodTag: 'good' as const,
  publishedAt: new Date('2024-01-01'),
  viewCount: 42,
  user: mockUser,
  usageSituation: {
    season: 'spring' as const,
    timeOfDay: 'morning' as const,
  },
  experienceDetails: {
    texture: {
      type: 'watery' as const,
      spreadability: 'easy' as const,
      absorption: 'fast' as const,
    },
  },
  empathies: [],
  comments: [],
  _count: {
    empathies: 5,
    comments: 3,
  },
}

export const mockComment = {
  id: 'test-comment-1',
  content: 'This is a test comment',
  createdAt: new Date('2024-01-01'),
  user: mockUser,
  replies: [],
}

export const mockPosts = [
  mockPost,
  {
    ...mockPost,
    id: 'test-post-2',
    title: 'Another Test Post',
    content: 'Another test post content',
    cosmeticName: 'Another Cosmetic',
    cosmeticCategory: 'serum' as const,
    skinType: 'dry' as const,
    moodTag: 'love' as const,
  },
]

// Mock form data
export const mockLoginFormData = {
  email: 'test@example.com',
  password: 'password123',
}

export const mockRegisterFormData = {
  userName: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  displayName: 'Test User',
  skinType: 'normal' as const,
}

export const mockPostFormData = {
  title: 'New Test Post',
  content: 'This is a new test post content',
  cosmeticName: 'New Test Cosmetic',
  cosmeticCategory: 'toner' as const,
  skinType: 'normal' as const,
  moodTag: 'good' as const,
  usageSituation: {
    season: 'spring' as const,
    timeOfDay: 'morning' as const,
  },
  experienceDetails: {
    texture: {
      type: 'watery' as const,
      spreadability: 'easy' as const,
      absorption: 'fast' as const,
    },
  },
}

// Mock API responses
export const mockApiResponse = {
  success: <T>(data: T) => ({
    ok: true,
    status: 200,
    json: async () => data,
  }),
  error: (message: string, status = 400) => ({
    ok: false,
    status,
    json: async () => ({ error: message }),
  }),
}

// Mock localStorage
export const createMockLocalStorage = () => {
  let store: Record<string, string> = {}

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length
    },
  }
}

// Mock fetch for API calls
export const createMockFetch = () => {
  return jest.fn() as jest.MockedFunction<typeof fetch>
}

// Helper to setup fetch mock
export const setupFetchMock = (mockFetch: jest.MockedFunction<typeof fetch>) => {
  global.fetch = mockFetch
  return mockFetch
}

// Common test props
export const defaultProps = {
  className: 'test-class',
  'data-testid': 'test-component',
}

// Mock router functions
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  refresh: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
}

// Mock pathname and search params
export const mockPathname = '/'
export const mockSearchParams = new URLSearchParams() as unknown as URLSearchParams

// Complete AuthContext mock
export const mockAuthContext = {
  user: null,
  loading: false,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  refreshAuth: jest.fn(),
  updateProfile: jest.fn(),
}
