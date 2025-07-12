// モックデータとデモ用のユーザー情報

export const MOCK_USERS = [
  {
    id: 'demo-user-1',
    userName: 'デモユーザー',
    displayName: 'デモユーザー',
    email: 'demo@example.com',
    passwordHash: '$2a$12$demo.hash.for.password123', // password: "demo123"
    skinType: 'normal' as const,
    role: 'USER' as const,
    isActive: true,
    termsAcceptedAt: new Date('2024-01-01'),
    privacyAcceptedAt: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'demo-user-2',
    userName: '美容好きさん',
    displayName: '美容好きさん',
    email: 'beauty@example.com',
    passwordHash: '$2a$12$demo.hash.for.password456', // password: "demo123"
    skinType: 'dry' as const,
    role: 'USER' as const,
    isActive: true,
    termsAcceptedAt: new Date('2024-01-01'),
    privacyAcceptedAt: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'demo-admin-1',
    userName: '管理者',
    displayName: '管理者',
    email: 'admin@example.com',
    passwordHash: '$2a$12$demo.hash.for.password789', // password: "demo123"
    skinType: 'normal' as const,
    role: 'ADMIN' as const,
    isActive: true,
    termsAcceptedAt: new Date('2024-01-01'),
    privacyAcceptedAt: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
]

export const MOCK_EMPATHIES = [
  {
    id: 'empathy-1',
    postId: 'post-1',
    userId: 'demo-user-2',
    empathyType: 'helpful' as const,
    createdAt: new Date('2024-01-16'),
  },
  {
    id: 'empathy-2',
    postId: 'post-2',
    userId: 'demo-user-1',
    empathyType: 'interested' as const,
    createdAt: new Date('2024-01-13'),
  },
]

export const MOCK_POSTS = [
  {
    id: 'post-1',
    userId: 'demo-user-1',
    title: 'SK-II フェイシャルトリートメントエッセンスを1ヶ月使ってみた感想',
    content: `1ヶ月間毎日朝晩使用してみました。

最初の1週間は特に変化を感じませんでしたが、2週間目あたりから肌のキメが整ってきたような気がします。

特に良かった点：
- 肌のざらつきが減った
- 毛穴が目立ちにくくなった
- 化粧ノリが良くなった

気になった点：
- 香りが少し独特
- 価格が高め

総合的には満足しています。リピートを検討中です。`,
    cosmeticName: 'SK-II フェイシャルトリートメントエッセンス',
    cosmeticCategory: 'toner' as const,
    skinType: 'normal' as const,
    usageSituation: {
      season: 'winter',
      timeOfDay: 'both',
      skinCondition: 'good',
    },
    experienceDetails: {
      fragrance: {
        type: 'other',
        intensity: 'moderate',
      },
      texture: {
        type: 'watery',
        spreadability: 'easy',
        absorption: 'fast',
      },
      afterUse: {
        moisture: 'moist',
        texture: 'smooth',
        comfort: 'comfortable',
      },
    },
    moodTag: 'good' as const,
    status: 'published' as const,
    viewCount: 125,
    empathyCount: 8,
    publishedAt: new Date('2024-01-15'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    user: MOCK_USERS[0],
    empathies: [],
    comments: [
      {
        id: 'comment-1',
        postId: 'post-1',
        userId: 'demo-user-2',
        content: 'とても参考になりました！私も同じ肌質なので試してみたいと思います。',
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-16'),
        user: MOCK_USERS[1],
        replies: [],
      },
    ],
    _count: {
      empathies: 8,
      comments: 1,
    },
  },
  {
    id: 'post-2',
    userId: 'demo-user-2',
    title: 'セタフィル モイスチャライジングローション - 敏感肌でも安心',
    content: `敏感肌で化粧品選びにいつも悩んでいましたが、これは本当に良かったです。

使用感：
- 軽いテクスチャなのにしっかり保湿
- ピリピリ感など刺激は一切なし
- べたつかずさらっとした仕上がり

価格も手頃で続けやすいのが嬉しいです。
ドラッグストアで手軽に買えるのも◎`,
    cosmeticName: 'セタフィル モイスチャライジングローション',
    cosmeticCategory: 'emulsion' as const,
    skinType: 'sensitive' as const,
    usageSituation: {
      season: 'autumn',
      timeOfDay: 'both',
      skinCondition: 'unstable',
    },
    experienceDetails: {
      fragrance: {
        type: 'none',
        intensity: 'weak',
      },
      texture: {
        type: 'cream',
        spreadability: 'easy',
        absorption: 'moderate',
      },
      afterUse: {
        moisture: 'moist',
        texture: 'smooth',
        comfort: 'very_comfortable',
      },
    },
    moodTag: 'love' as const,
    status: 'published' as const,
    viewCount: 89,
    empathyCount: 12,
    publishedAt: new Date('2024-01-12'),
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
    user: MOCK_USERS[1],
    empathies: [],
    comments: [],
    _count: {
      empathies: 12,
      comments: 0,
    },
  },
]

// デモ用の認証情報
export const DEMO_CREDENTIALS = {
  email: 'demo@example.com',
  password: 'demo123',
}

export const DEMO_CREDENTIALS_2 = {
  email: 'beauty@example.com',
  password: 'demo123',
}
