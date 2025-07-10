import { Comment } from '@api/domain/entities/Comment'

describe('Comment Entity', () => {
  const mockComment = new Comment(
    'comment-123',
    'post-123',
    'user-123',
    'This is a test comment that is valid.',
    null, // parentCommentId
    true, // isActive
    new Date('2023-01-01'),
    new Date('2023-01-02')
  )

  const mockReply = new Comment(
    'reply-123',
    'post-123',
    'user-456',
    'This is a reply to the comment.',
    'comment-123', // parentCommentId
    true,
    new Date('2023-01-01'),
    new Date('2023-01-02')
  )

  describe('constructor', () => {
    it('正常にCommentエンティティを作成できる', () => {
      expect(mockComment.id).toBe('comment-123')
      expect(mockComment.postId).toBe('post-123')
      expect(mockComment.userId).toBe('user-123')
      expect(mockComment.content).toBe('This is a test comment that is valid.')
      expect(mockComment.parentCommentId).toBe(null)
      expect(mockComment.isActive).toBe(true)
      expect(mockComment.createdAt).toEqual(new Date('2023-01-01'))
      expect(mockComment.updatedAt).toEqual(new Date('2023-01-02'))
    })

    it('返信コメントを正常に作成できる', () => {
      expect(mockReply.id).toBe('reply-123')
      expect(mockReply.parentCommentId).toBe('comment-123')
      expect(mockReply.content).toBe('This is a reply to the comment.')
    })
  })

  describe('isValid getter', () => {
    it('有効なコンテンツの場合はtrueを返す', () => {
      expect(mockComment.isValid).toBe(true)
    })

    it('空のコンテンツの場合はfalseを返す', () => {
      const invalidComment = new Comment(
        'comment-123',
        'post-123',
        'user-123',
        '', // empty content
        null,
        true,
        new Date(),
        new Date()
      )
      expect(invalidComment.isValid).toBe(false)
    })

    it('空白文字のみのコンテンツの場合はfalseを返す', () => {
      const invalidComment = new Comment(
        'comment-123',
        'post-123',
        'user-123',
        '   ', // whitespace only
        null,
        true,
        new Date(),
        new Date()
      )
      expect(invalidComment.isValid).toBe(false)
    })

    it('1000文字を超えるコンテンツの場合はfalseを返す', () => {
      const longContent = 'a'.repeat(1001) // 1001文字
      const invalidComment = new Comment(
        'comment-123',
        'post-123',
        'user-123',
        longContent,
        null,
        true,
        new Date(),
        new Date()
      )
      expect(invalidComment.isValid).toBe(false)
    })

    it('ちょうど1000文字のコンテンツの場合はtrueを返す', () => {
      const maxContent = 'a'.repeat(1000) // 1000文字
      const validComment = new Comment(
        'comment-123',
        'post-123',
        'user-123',
        maxContent,
        null,
        true,
        new Date(),
        new Date()
      )
      expect(validComment.isValid).toBe(true)
    })

    it('1文字のコンテンツの場合はtrueを返す', () => {
      const minContent = 'a' // 1文字
      const validComment = new Comment(
        'comment-123',
        'post-123',
        'user-123',
        minContent,
        null,
        true,
        new Date(),
        new Date()
      )
      expect(validComment.isValid).toBe(true)
    })
  })

  describe('isReply getter', () => {
    it('parentCommentIdがnullの場合はfalseを返す', () => {
      expect(mockComment.isReply).toBe(false)
    })

    it('parentCommentIdが設定されている場合はtrueを返す', () => {
      expect(mockReply.isReply).toBe(true)
    })
  })

  describe('isRootComment getter', () => {
    it('parentCommentIdがnullの場合はtrueを返す', () => {
      expect(mockComment.isRootComment).toBe(true)
    })

    it('parentCommentIdが設定されている場合はfalseを返す', () => {
      expect(mockReply.isRootComment).toBe(false)
    })
  })

  describe('canBeRepliedTo', () => {
    it('アクティブなルートコメントの場合はtrueを返す', () => {
      expect(mockComment.canBeRepliedTo()).toBe(true)
    })

    it('非アクティブなルートコメントの場合はfalseを返す', () => {
      const inactiveComment = new Comment(
        'comment-123',
        'post-123',
        'user-123',
        'Test content',
        null,
        false, // isActive = false
        new Date(),
        new Date()
      )
      expect(inactiveComment.canBeRepliedTo()).toBe(false)
    })

    it('アクティブな返信コメントの場合はfalseを返す', () => {
      expect(mockReply.canBeRepliedTo()).toBe(false)
    })

    it('非アクティブな返信コメントの場合はfalseを返す', () => {
      const inactiveReply = new Comment(
        'reply-123',
        'post-123',
        'user-456',
        'Test reply',
        'comment-123',
        false, // isActive = false
        new Date(),
        new Date()
      )
      expect(inactiveReply.canBeRepliedTo()).toBe(false)
    })
  })

  describe('canBeEditedBy', () => {
    it('コメント作成者の場合はtrueを返す', () => {
      expect(mockComment.canBeEditedBy('user-123')).toBe(true)
    })

    it('コメント作成者でない場合はfalseを返す', () => {
      expect(mockComment.canBeEditedBy('user-456')).toBe(false)
    })

    it('非アクティブなコメントの場合は作成者でもfalseを返す', () => {
      const inactiveComment = new Comment(
        'comment-123',
        'post-123',
        'user-123',
        'Test content',
        null,
        false, // isActive = false
        new Date(),
        new Date()
      )
      expect(inactiveComment.canBeEditedBy('user-123')).toBe(false)
    })

    it('空文字列のuserIdの場合はfalseを返す', () => {
      expect(mockComment.canBeEditedBy('')).toBe(false)
    })
  })

  describe('canBeDeletedBy', () => {
    it('コメント作成者の場合はtrueを返す', () => {
      expect(mockComment.canBeDeletedBy('user-123')).toBe(true)
    })

    it('コメント作成者でない場合はfalseを返す', () => {
      expect(mockComment.canBeDeletedBy('user-456')).toBe(false)
    })

    it('非アクティブなコメントの場合は作成者でもfalseを返す', () => {
      const inactiveComment = new Comment(
        'comment-123',
        'post-123',
        'user-123',
        'Test content',
        null,
        false, // isActive = false
        new Date(),
        new Date()
      )
      expect(inactiveComment.canBeDeletedBy('user-123')).toBe(false)
    })

    it('空文字列のuserIdの場合はfalseを返す', () => {
      expect(mockComment.canBeDeletedBy('')).toBe(false)
    })
  })

  describe('境界値テスト', () => {
    it('コンテンツの長さの境界値をテストする', () => {
      // 999文字（有効）
      const valid999 = new Comment(
        'comment-1',
        'post-123',
        'user-123',
        'a'.repeat(999),
        null,
        true,
        new Date(),
        new Date()
      )
      expect(valid999.isValid).toBe(true)

      // 1000文字（有効）
      const valid1000 = new Comment(
        'comment-2',
        'post-123',
        'user-123',
        'a'.repeat(1000),
        null,
        true,
        new Date(),
        new Date()
      )
      expect(valid1000.isValid).toBe(true)

      // 1001文字（無効）
      const invalid1001 = new Comment(
        'comment-3',
        'post-123',
        'user-123',
        'a'.repeat(1001),
        null,
        true,
        new Date(),
        new Date()
      )
      expect(invalid1001.isValid).toBe(false)
    })
  })

  describe('複合条件テスト', () => {
    it('アクティブな返信コメントの権限チェック', () => {
      expect(mockReply.isReply).toBe(true)
      expect(mockReply.isRootComment).toBe(false)
      expect(mockReply.canBeRepliedTo()).toBe(false)
      expect(mockReply.canBeEditedBy('user-456')).toBe(true) // 作成者
      expect(mockReply.canBeEditedBy('user-123')).toBe(false) // 作成者でない
      expect(mockReply.canBeDeletedBy('user-456')).toBe(true) // 作成者
      expect(mockReply.canBeDeletedBy('user-123')).toBe(false) // 作成者でない
    })
  })
})
