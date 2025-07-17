import { Id } from '@api/domain/entities/Id'

describe('Id', () => {
  describe('constructor', () => {
    it('引数なしで新しいIDを生成できる', () => {
      const id = new Id()
      expect(id.value).toBeTruthy()
      expect(Id.isValid(id.value)).toBe(true)
    })

    it('既存のID文字列からインスタンスを作成できる', () => {
      const uuidString = '550e8400-e29b-41d4-a716-446655440000'
      const id = new Id(uuidString)
      expect(id.value).toBe(uuidString)
    })

    it('無効なID形式の場合はエラーをスローする', () => {
      expect(() => new Id('invalid-id')).toThrow('無効なID形式です')
      expect(() => new Id('123')).toThrow('無効なID形式です')
      expect(() => new Id('')).toThrow('IDは必須です')
    })

    it('生成されるIDは毎回異なる', () => {
      const id1 = new Id()
      const id2 = new Id()
      expect(id1.value).not.toBe(id2.value)
    })
  })

  describe('generate（ファクトリーメソッド）', () => {
    it('新しいIDを生成できる', () => {
      const id = Id.generate()
      expect(id).toBeInstanceOf(Id)
      expect(id.value).toBeTruthy()
      expect(Id.isValid(id.value)).toBe(true)
    })

    it('生成されるIDは毎回異なる', () => {
      const id1 = Id.generate()
      const id2 = Id.generate()
      expect(id1.equals(id2)).toBe(false)
    })
  })

  describe('from（ファクトリーメソッド）', () => {
    it('既存のID文字列からIdオブジェクトを作成できる', () => {
      const uuidString = '550e8400-e29b-41d4-a716-446655440000'
      const id = Id.from(uuidString)
      expect(id).toBeInstanceOf(Id)
      expect(id.value).toBe(uuidString)
    })

    it('無効なID形式の場合はエラーをスローする', () => {
      expect(() => Id.from('invalid-id')).toThrow('無効なID形式です')
    })
  })

  describe('isValid（バリデーション）', () => {
    it('有効なUUID v4形式の場合はtrueを返す', () => {
      expect(Id.isValid('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
      expect(Id.isValid('6ba7b810-9dad-41d1-80b4-00c04fd430c8')).toBe(true)
    })

    it('無効な形式の場合はfalseを返す', () => {
      expect(Id.isValid('invalid-id')).toBe(false)
      expect(Id.isValid('123')).toBe(false)
      expect(Id.isValid('')).toBe(false)
      expect(Id.isValid('550e8400-e29b-11d4-a716-446655440000')).toBe(false) // v1 UUID
      expect(Id.isValid('550e8400-e29b-51d4-a716-446655440000')).toBe(false) // v5 UUID
    })

    it('大文字小文字を区別しない', () => {
      expect(Id.isValid('550E8400-E29B-41D4-A716-446655440000')).toBe(true)
      expect(Id.isValid('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    })
  })

  describe('equals（等価性判定）', () => {
    it('同じID値を持つインスタンスは等しいと判定される', () => {
      const uuidString = '550e8400-e29b-41d4-a716-446655440000'
      const id1 = new Id(uuidString)
      const id2 = new Id(uuidString)
      expect(id1.equals(id2)).toBe(true)
    })

    it('異なるID値を持つインスタンスは等しくないと判定される', () => {
      const id1 = new Id()
      const id2 = new Id()
      expect(id1.equals(id2)).toBe(false)
    })
  })

  describe('toString', () => {
    it('ID文字列を返す', () => {
      const uuidString = '550e8400-e29b-41d4-a716-446655440000'
      const id = new Id(uuidString)
      expect(id.toString()).toBe(uuidString)
    })
  })

  describe('toJSON', () => {
    it('ID文字列を返す', () => {
      const uuidString = '550e8400-e29b-41d4-a716-446655440000'
      const id = new Id(uuidString)
      expect(id.toJSON()).toBe(uuidString)
    })
  })

  describe('実際の使用例', () => {
    it('エンティティのIDとして使用できる', () => {
      class User {
        constructor(
          public readonly id: Id,
          public readonly name: string
        ) {}
      }

      const userId = new Id()
      const user = new User(userId, 'John Doe')

      expect(user.id).toBeInstanceOf(Id)
      expect(user.id.value).toBeTruthy()
    })

    it('既存エンティティの復元に使用できる', () => {
      const existingId = '550e8400-e29b-41d4-a716-446655440000'
      const restoredId = Id.from(existingId)

      expect(restoredId.value).toBe(existingId)
    })
  })
})
