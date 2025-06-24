export const testUsers = {
  validUser: {
    username: 'testuser_e2e',
    email: 'testuser@example.com',
    password: 'testpassword123',
    skinType: 'NORMAL',
  },

  admin: {
    username: 'admin_e2e',
    email: 'admin@example.com',
    password: 'adminpassword123',
    skinType: 'COMBINATION',
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
  return {
    username: `user_${timestamp}`,
    email: `user${timestamp}@example.com`,
    password: 'testpassword123',
    skinType: 'NORMAL',
  }
}
