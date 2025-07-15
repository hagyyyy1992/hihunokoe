import { Post } from '@api/domain/entities/Post'

describe('Post Entity', () => {
  const mockPost = new Post(
    'post-123',
    'user-123',
    'Test Post Title',
    'This is a test post content that is long enough to be valid.',
    'Foundation X',
    'Brand Y',
    'https://example.com/image.jpg',
    'makeup',
    true,
    new Date('2023-01-01'),
    'published',
    'Foundation X', // cosmeticName alias
    'makeup', // cosmeticCategory alias
    'dry',
    'daily',
    100,
    5,
    3,
    new Date('2023-01-01'),
    new Date('2023-01-02'),
    null, // deletedAt
    { morning: true, evening: false },
    { satisfaction: 4, wouldRecommend: true },
    { id: 'user-123', userName: 'testuser' }
  )

  describe('constructor', () => {
    it('正常にPostエンティティを作成できる', () => {
      expect(mockPost.id).toBe('post-123')
      expect(mockPost.userId).toBe('user-123')
      expect(mockPost.title).toBe('Test Post Title')
      expect(mockPost.content).toBe('This is a test post content that is long enough to be valid.')
      expect(mockPost.productName).toBe('Foundation X')
      expect(mockPost.brandName).toBe('Brand Y')
      expect(mockPost.isPublished).toBe(true)
      expect(mockPost.viewCount).toBe(100)
      expect(mockPost.empathyCount).toBe(5)
      expect(mockPost.commentCount).toBe(3)
    })

    it('エイリアスフィールドが正しく設定される', () => {
      expect(mockPost.cosmeticName).toBe(mockPost.productName)
      expect(mockPost.cosmeticCategory).toBe(mockPost.category)
    })

    it('オプショナルフィールドが正しく設定される', () => {
      expect(mockPost.usageSituation).toEqual({ morning: true, evening: false })
      expect(mockPost.experienceDetails).toEqual({ satisfaction: 4, wouldRecommend: true })
      expect(mockPost.user).toEqual({ id: 'user-123', userName: 'testuser' })
    })
  })

  describe('isValid getter', () => {
    it('タイトルとコンテンツが空でない場合はtrueを返す', () => {
      expect(mockPost.isValid).toBe(true)
    })

    it('タイトルが空の場合はfalseを返す', () => {
      const invalidPost = new Post(
        'post-123',
        'user-123',
        '', // empty title
        'Valid content',
        null,
        null,
        null,
        null,
        true,
        null,
        'published',
        '', // cosmeticName
        null, // cosmeticCategory
        null,
        null,
        0,
        0,
        0,
        new Date(),
        new Date()
      )
      expect(invalidPost.isValid).toBe(false)
    })

    it('タイトルが空白文字のみの場合はfalseを返す', () => {
      const invalidPost = new Post(
        'post-123',
        'user-123',
        '   ', // whitespace only title
        'Valid content',
        null,
        null,
        null,
        null,
        true,
        null,
        'published',
        '   ', // cosmeticName
        null, // cosmeticCategory
        null,
        null,
        0,
        0,
        0,
        new Date(),
        new Date()
      )
      expect(invalidPost.isValid).toBe(false)
    })

    it('コンテンツが空の場合はfalseを返す', () => {
      const invalidPost = new Post(
        'post-123',
        'user-123',
        'Valid title',
        '', // empty content
        null,
        null,
        null,
        null,
        true,
        null,
        'published',
        'Valid title', // cosmeticName
        null, // cosmeticCategory
        null,
        null,
        0,
        0,
        0,
        new Date(),
        new Date()
      )
      expect(invalidPost.isValid).toBe(false)
    })

    it('コンテンツが空白文字のみの場合はfalseを返す', () => {
      const invalidPost = new Post(
        'post-123',
        'user-123',
        'Valid title',
        '   ', // whitespace only content
        null,
        null,
        null,
        null,
        true,
        null,
        'published',
        'Valid title', // cosmeticName
        null, // cosmeticCategory
        null,
        null,
        0,
        0,
        0,
        new Date(),
        new Date()
      )
      expect(invalidPost.isValid).toBe(false)
    })
  })

  describe('excerpt getter', () => {
    it('コンテンツが100文字以下の場合はそのまま返す', () => {
      const shortPost = new Post(
        'post-123',
        'user-123',
        'Title',
        'Short content',
        null,
        null,
        null,
        null,
        true,
        null,
        'published',
        'Title', // cosmeticName
        null, // cosmeticCategory
        null,
        null,
        0,
        0,
        0,
        new Date(),
        new Date()
      )
      expect(shortPost.excerpt).toBe('Short content')
    })

    it('コンテンツが100文字を超える場合は切り詰めて"..."を付ける', () => {
      const longContent = 'a'.repeat(150) // 150文字の文字列
      const longPost = new Post(
        'post-123',
        'user-123',
        'Title',
        longContent,
        null,
        null,
        null,
        null,
        true,
        null,
        'published',
        'Title', // cosmeticName
        null, // cosmeticCategory
        null,
        null,
        0,
        0,
        0,
        new Date(),
        new Date()
      )
      expect(longPost.excerpt).toBe('a'.repeat(100) + '...')
      expect(longPost.excerpt.length).toBe(103) // 100 + "..." = 103
    })

    it('コンテンツがちょうど100文字の場合はそのまま返す', () => {
      const exactContent = 'a'.repeat(100)
      const exactPost = new Post(
        'post-123',
        'user-123',
        'Title',
        exactContent,
        null,
        null,
        null,
        null,
        true,
        null,
        'published',
        'Title', // cosmeticName
        null, // cosmeticCategory
        null,
        null,
        0,
        0,
        0,
        new Date(),
        new Date()
      )
      expect(exactPost.excerpt).toBe(exactContent)
      expect(exactPost.excerpt.length).toBe(100)
    })
  })

  describe('nullフィールドのテスト', () => {
    it('すべてのオプショナルフィールドがnullでも正常に動作する', () => {
      const minimalPost = new Post(
        'post-123',
        'user-123',
        'Title',
        'Content',
        null, // productName
        null, // brandName
        null, // imageUrl
        null, // category
        false, // isPublished
        null, // publishedAt
        'draft', // status
        'Title', // cosmeticName
        null, // cosmeticCategory
        null, // skinType
        null, // moodTag
        0, // viewCount
        0, // empathyCount
        0, // commentCount
        new Date(),
        new Date(),
        null, // deletedAt
        null, // usageSituation
        null, // experienceDetails
        null // user
      )

      expect(minimalPost.isValid).toBe(true)
      expect(minimalPost.excerpt).toBe('Content')
      expect(minimalPost.productName).toBe(null)
      expect(minimalPost.brandName).toBe(null)
      expect(minimalPost.imageUrl).toBe(null)
      expect(minimalPost.category).toBe(null)
      expect(minimalPost.usageSituation).toBe(null)
      expect(minimalPost.experienceDetails).toBe(null)
      expect(minimalPost.user).toBe(null)
    })
  })
})
