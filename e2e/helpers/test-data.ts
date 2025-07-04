export const testUsers = {
  validUser: {
    username: 'testuser_e2e',
    email: 'testuser@example.com',
    password: 'TestPassword123!',
    skinType: 'normal',
  },

  admin: {
    username: 'admin_e2e',
    email: 'admin@example.com',
    password: 'AdminPassword123!',
    skinType: 'combination',
  },
}

export const testPosts = {
  samplePost: {
    title: 'E2Eテスト投稿',
    content: 'これはPlaywrightのE2Eテストで作成された投稿です。',
    category: 'SKINCARE',
    mood: 'happy',
    tags: ['test', 'e2e', 'playwright'],
  },

  longPost: {
    title: '長文投稿のテスト',
    content: 'この投稿は長い内容のテストです。'.repeat(10),
    category: 'MAKEUP',
    mood: 'excited',
    tags: ['longform', 'test'],
  },
}

export const generateRandomUser = () => {
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const processId = process.pid || Math.floor(Math.random() * 10000)
  const workerId = process.env.PLAYWRIGHT_WORKER_ID || Math.floor(Math.random() * 100)
  const uniqueId = `${timestamp}_${randomSuffix}_${processId}_${workerId}`
  return {
    username: `user_${uniqueId}`,
    email: `user${uniqueId}@example.com`,
    password: 'TestPassword123!',
    skinType: 'normal',
  }
}
