import { Empathy, EmpathyType } from '@api/domain/entities/Empathy'

describe('Empathy Entity', () => {
  describe('constructor', () => {
    it('正常にEmpathyエンティティを作成できる', () => {
      const empathy = new Empathy(
        'empathy-123',
        'user-123',
        'post-123',
        'helpful',
        new Date('2023-01-01')
      )

      expect(empathy.id).toBe('empathy-123')
      expect(empathy.userId).toBe('user-123')
      expect(empathy.postId).toBe('post-123')
      expect(empathy.empathyType).toBe('helpful')
      expect(empathy.createdAt).toEqual(new Date('2023-01-01'))
    })

    it('helpfulタイプのEmpathyを作成できる', () => {
      const empathy = new Empathy('empathy-1', 'user-123', 'post-123', 'helpful', new Date())

      expect(empathy.empathyType).toBe('helpful')
    })

    it('interestedタイプのEmpathyを作成できる', () => {
      const empathy = new Empathy('empathy-2', 'user-123', 'post-123', 'interested', new Date())

      expect(empathy.empathyType).toBe('interested')
    })

    it('supportiveタイプのEmpathyを作成できる', () => {
      const empathy = new Empathy('empathy-3', 'user-123', 'post-123', 'supportive', new Date())

      expect(empathy.empathyType).toBe('supportive')
    })
  })

  describe('EmpathyType', () => {
    it('正しいタイプが定義されている', () => {
      const helpfulType: EmpathyType = 'helpful'
      const interestedType: EmpathyType = 'interested'
      const supportiveType: EmpathyType = 'supportive'

      expect(helpfulType).toBe('helpful')
      expect(interestedType).toBe('interested')
      expect(supportiveType).toBe('supportive')
    })

    it('定義されたタイプでEmpathyを作成できる', () => {
      const types: EmpathyType[] = ['helpful', 'interested', 'supportive']

      types.forEach((type, index) => {
        const empathy = new Empathy(`empathy-${index}`, 'user-123', 'post-123', type, new Date())

        expect(empathy.empathyType).toBe(type)
      })
    })
  })

  describe('プロパティの不変性', () => {
    it('TypeScriptでreadonlyプロパティが定義されている', () => {
      const empathy = new Empathy(
        'empathy-123',
        'user-123',
        'post-123',
        'helpful',
        new Date('2023-01-01')
      )

      // TypeScriptでの型チェックにより、これらのプロパティはreadonlyとして扱われる
      // 実際の変更テストは行わず、プロパティが正しく設定されていることを確認
      expect(empathy.id).toBe('empathy-123')
      expect(empathy.userId).toBe('user-123')
      expect(empathy.postId).toBe('post-123')
      expect(empathy.empathyType).toBe('helpful')
      expect(empathy.createdAt).toEqual(new Date('2023-01-01'))

      // TypeScriptコンパイラがreadonly制約を強制するため、
      // 以下のような代入はコンパイル時エラーになる:
      // empathy.id = 'new-id'          // コンパイルエラー
      // empathy.userId = 'new-user'    // コンパイルエラー
      // empathy.postId = 'new-post'    // コンパイルエラー
      // empathy.empathyType = 'interested' // コンパイルエラー
      // empathy.createdAt = new Date() // コンパイルエラー
    })
  })

  describe('複数のEmpathyインスタンス', () => {
    it('同一ユーザーが同一投稿に対して異なるタイプのEmpathyを作成できる', () => {
      const empathy1 = new Empathy(
        'empathy-1',
        'user-123',
        'post-123',
        'helpful',
        new Date('2023-01-01')
      )

      const empathy2 = new Empathy(
        'empathy-2',
        'user-123',
        'post-123',
        'interested',
        new Date('2023-01-02')
      )

      expect(empathy1.userId).toBe(empathy2.userId)
      expect(empathy1.postId).toBe(empathy2.postId)
      expect(empathy1.empathyType).not.toBe(empathy2.empathyType)
      expect(empathy1.id).not.toBe(empathy2.id)
    })

    it('異なるユーザーが同一投稿に対してEmpathyを作成できる', () => {
      const empathy1 = new Empathy('empathy-1', 'user-123', 'post-123', 'helpful', new Date())

      const empathy2 = new Empathy('empathy-2', 'user-456', 'post-123', 'helpful', new Date())

      expect(empathy1.postId).toBe(empathy2.postId)
      expect(empathy1.empathyType).toBe(empathy2.empathyType)
      expect(empathy1.userId).not.toBe(empathy2.userId)
      expect(empathy1.id).not.toBe(empathy2.id)
    })

    it('同一ユーザーが異なる投稿に対してEmpathyを作成できる', () => {
      const empathy1 = new Empathy('empathy-1', 'user-123', 'post-123', 'helpful', new Date())

      const empathy2 = new Empathy('empathy-2', 'user-123', 'post-456', 'helpful', new Date())

      expect(empathy1.userId).toBe(empathy2.userId)
      expect(empathy1.empathyType).toBe(empathy2.empathyType)
      expect(empathy1.postId).not.toBe(empathy2.postId)
      expect(empathy1.id).not.toBe(empathy2.id)
    })
  })

  describe('日付処理', () => {
    it('作成日時が正確に保存される', () => {
      const specificDate = new Date('2023-06-15T10:30:00.000Z')
      const empathy = new Empathy('empathy-123', 'user-123', 'post-123', 'helpful', specificDate)

      expect(empathy.createdAt).toEqual(specificDate)
      expect(empathy.createdAt.getTime()).toBe(specificDate.getTime())
    })

    it('現在時刻で作成できる', () => {
      const beforeCreation = new Date()
      const empathy = new Empathy('empathy-123', 'user-123', 'post-123', 'helpful', new Date())
      const afterCreation = new Date()

      expect(empathy.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime())
      expect(empathy.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime())
    })
  })

  describe('エッジケース', () => {
    it('空文字列のIDでも作成できる', () => {
      const empathy = new Empathy('', 'user-123', 'post-123', 'helpful', new Date())

      expect(empathy.id).toBe('')
    })

    it('空文字列のユーザーIDでも作成できる', () => {
      const empathy = new Empathy('empathy-123', '', 'post-123', 'helpful', new Date())

      expect(empathy.userId).toBe('')
    })

    it('空文字列の投稿IDでも作成できる', () => {
      const empathy = new Empathy('empathy-123', 'user-123', '', 'helpful', new Date())

      expect(empathy.postId).toBe('')
    })
  })

  describe('オブジェクトの等価性', () => {
    it('同一のプロパティを持つ2つのインスタンスは異なるオブジェクト', () => {
      const date = new Date('2023-01-01')

      const empathy1 = new Empathy('empathy-123', 'user-123', 'post-123', 'helpful', date)

      const empathy2 = new Empathy('empathy-123', 'user-123', 'post-123', 'helpful', date)

      expect(empathy1).not.toBe(empathy2)
      expect(empathy1.id).toBe(empathy2.id)
      expect(empathy1.userId).toBe(empathy2.userId)
      expect(empathy1.postId).toBe(empathy2.postId)
      expect(empathy1.empathyType).toBe(empathy2.empathyType)
      expect(empathy1.createdAt).toBe(empathy2.createdAt)
    })
  })
})
