// カテゴリーマッピング（英語 -> 日本語）
export const COSMETIC_CATEGORIES = {
  toner: 'toner',
  serum: 'serum',
  emulsion: 'emulsion',
  cream: 'cream',
  cleanser: 'cleanser',
  foundation: 'foundation',
  concealer: 'concealer',
  sunscreen: 'sunscreen',
  other: 'other',
} as const

// 日本語ラベル
export const COSMETIC_CATEGORY_LABELS = {
  toner: '化粧水',
  serum: '美容液',
  emulsion: '乳液',
  cream: 'クリーム',
  cleanser: '洗顔',
  foundation: 'ファンデーション',
  concealer: 'コンシーラー',
  sunscreen: '日焼け止め',
  other: 'その他',
} as const

// 肌タイプマッピング（英語 -> 日本語）
export const SKIN_TYPES = {
  normal: '普通肌',
  dry: '乾燥肌',
  oily: '脂性肌',
  combination: '混合肌',
  sensitive: '敏感肌',
} as const

// ムードタグマッピング（英語 -> 日本語）
export const MOOD_TAGS = {
  disappointed: 'ちょっと残念',
  okay: 'まあまあ',
  good: '良かった',
  love: 'また使いたい',
  perfect: '完璧',
} as const

export const testUsers = {
  validUser: {
    username: 'testuser_e2e',
    email: 'testuser@example.com',
    password: 'TestPassword123',
    skinType: 'normal',
  },

  admin: {
    username: 'admin_e2e',
    email: 'admin@example.com',
    password: 'AdminPassword123',
    skinType: 'combination',
  },
}

export const testPosts = {
  samplePost: {
    title: 'E2Eテスト投稿',
    content: 'これはPlaywrightのE2Eテストで作成された投稿です。',
    cosmeticName: 'テストクリーム',
    cosmeticCategory: COSMETIC_CATEGORIES.cream,
  },

  longPost: {
    title: '長文投稿のテスト',
    content: 'この投稿は長い内容のテストです。'.repeat(10),
    cosmeticName: 'テストファンデーション',
    cosmeticCategory: COSMETIC_CATEGORIES.foundation,
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
    password: 'TestPassword123',
    skinType: 'normal',
  }
}
