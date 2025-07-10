// Test data factory functions for consistent test data across tests

export const createMockUser = (overrides: Partial<any> = {}) => ({
  id: 'test-user-id',
  userName: 'Test User',
  email: 'test@example.com',
  skinType: 'normal',
  emailVerified: true,
  ...overrides,
})

export const createMockPost = (overrides: Partial<any> = {}) => ({
  id: 'test-post-id',
  userId: 'test-user-id',
  title: 'Test Post Title',
  content: 'Test post content',
  cosmeticName: 'Test Cosmetic',
  cosmeticCategory: 'toner',
  skinType: 'normal',
  moodTag: 'good',
  status: 'published',
  viewCount: 0,
  empathyCount: 0,
  publishedAt: new Date('2024-01-01T00:00:00Z'),
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  usageSituation: {
    season: 'spring',
    timeOfDay: 'morning',
  },
  experienceDetails: {
    texture: {
      type: 'watery',
      spreadability: 'easy',
      absorption: 'fast',
    },
  },
  user: createMockUser(),
  ...overrides,
})

export const createMockComment = (overrides: Partial<any> = {}) => ({
  id: 'test-comment-id',
  postId: 'test-post-id',
  userId: 'test-user-id',
  content: 'Test comment content',
  parentCommentId: null,
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  user: createMockUser(),
  replies: [],
  ...overrides,
})

export const createMockEmpathy = (overrides: Partial<any> = {}) => ({
  id: 'test-empathy-id',
  postId: 'test-post-id',
  userId: 'test-user-id',
  empathyType: 'like',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  user: createMockUser(),
  ...overrides,
})

export const createValidPostData = (overrides: Partial<any> = {}) => ({
  title: 'Test Post Title',
  content: 'Test post content describing the cosmetic experience',
  cosmeticName: 'Test Cosmetic Product',
  cosmeticCategory: 'toner',
  skinType: 'normal',
  moodTag: 'good',
  usageSituation: {
    season: 'spring',
    timeOfDay: 'morning',
    menstrualCycle: 'none',
    skinCondition: 'good',
    weatherCondition: 'normal',
  },
  experienceDetails: {
    fragrance: {
      type: 'floral',
      intensity: 'weak',
      description: 'Light floral scent',
    },
    texture: {
      type: 'watery',
      spreadability: 'easy',
      absorption: 'fast',
      description: 'Absorbs quickly',
    },
    afterUse: {
      moisture: 'moist',
      texture: 'smooth',
      comfort: 'comfortable',
      duration: 'moderate',
      description: 'Skin feels hydrated',
    },
  },
  ...overrides,
})

export const createValidUserRegistrationData = (overrides: Partial<any> = {}) => ({
  userName: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  skinType: 'normal',
  ...overrides,
})

export const createValidLoginData = (overrides: Partial<any> = {}) => ({
  email: 'test@example.com',
  password: 'password123',
  ...overrides,
})

// Mock Prisma responses
export const createMockPrismaPostResponse = (overrides: Partial<any> = {}) => ({
  ...createMockPost(),
  user: {
    id: 'test-user-id',
    userName: 'Test User',
    skinType: 'normal',
  },
  empathies: [],
  comments: [],
  _count: {
    empathies: 0,
    comments: 0,
  },
  ...overrides,
})

export const createMockPrismaUserResponse = (overrides: Partial<any> = {}) => ({
  ...createMockUser(),
  passwordHash: '$2b$12$hashedpassword',
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  ...overrides,
})

// Error responses
export const createPrismaUniqueConstraintError = (field: string = 'email') => ({
  code: 'P2002',
  meta: {
    target: [field],
  },
  message: `Unique constraint failed on the constraint: \`User_${field}_key\``,
})

export const createDatabaseError = (message: string = 'Database connection failed') =>
  new Error(message)

// JWT tokens for testing
export const createValidJWTToken = () =>
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtdXNlci1pZCIsInVzZXJOYW1lIjoidGVzdHVzZXIiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTY0MTYwMDAwMH0.example'

export const createInvalidJWTToken = () => 'invalid.jwt.token'

export const createExpiredJWTToken = () =>
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtdXNlci1pZCIsInVzZXJOYW1lIjoidGVzdHVzZXIiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTY0MDk5NTIwMX0.expired'
