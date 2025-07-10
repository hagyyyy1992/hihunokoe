import { categoryLabels } from '../../src/lib/constants/categories'

// カテゴリーマッピング（英語キー）
export const COSMETIC_CATEGORIES = Object.keys(categoryLabels).reduce(
  (acc, key) => {
    acc[key as keyof typeof categoryLabels] = key
    return acc
  },
  {} as Record<keyof typeof categoryLabels, string>
)

// 日本語ラベル（共通定数から参照）
export const COSMETIC_CATEGORY_LABELS = categoryLabels

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
    cosmeticCategory: 'cream' as const,
  },

  longPost: {
    title: '長文投稿のテスト',
    content: 'この投稿は長い内容のテストです。'.repeat(10),
    cosmeticName: 'テストファンデーション',
    cosmeticCategory: 'foundation' as const,
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
