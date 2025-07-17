import { ValueObject } from '@api/domain/entities/ValueObject'

// テスト用の具体的なValueObjectクラス
class TestValueObject extends ValueObject<string> {
  constructor(value: string) {
    super(value)
  }

  protected validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('値は必須です')
    }
  }
}

class NumberValueObject extends ValueObject<number> {
  constructor(value: number) {
    super(value)
  }

  protected validate(value: number): void {
    if (value < 0) {
      throw new Error('値は0以上である必要があります')
    }
  }
}

describe('ValueObject', () => {
  describe('constructor', () => {
    it('有効な値でインスタンスを作成できる', () => {
      const vo = new TestValueObject('test')
      expect(vo.value).toBe('test')
    })

    it('無効な値の場合はエラーをスローする', () => {
      expect(() => new TestValueObject('')).toThrow('値は必須です')
      expect(() => new TestValueObject('   ')).toThrow('値は必須です')
    })

    it('インスタンスは不変（イミュータブル）である', () => {
      const vo = new TestValueObject('test')
      expect(() => {
        ;(vo as any)._value = 'modified'
      }).toThrow()
    })
  })

  describe('value getter', () => {
    it('値を取得できる', () => {
      const vo = new TestValueObject('test value')
      expect(vo.value).toBe('test value')
    })
  })

  describe('equals', () => {
    it('同じ値を持つインスタンスは等しいと判定される', () => {
      const vo1 = new TestValueObject('test')
      const vo2 = new TestValueObject('test')
      expect(vo1.equals(vo2)).toBe(true)
    })

    it('異なる値を持つインスタンスは等しくないと判定される', () => {
      const vo1 = new TestValueObject('test1')
      const vo2 = new TestValueObject('test2')
      expect(vo1.equals(vo2)).toBe(false)
    })

    it('異なるクラスのインスタンスは等しくないと判定される', () => {
      const stringVo = new TestValueObject('100')
      const numberVo = new NumberValueObject(100)
      expect(stringVo.equals(numberVo as any)).toBe(false)
    })

    it('nullまたはundefinedとの比較はfalseを返す', () => {
      const vo = new TestValueObject('test')
      expect(vo.equals(null as any)).toBe(false)
      expect(vo.equals(undefined as any)).toBe(false)
    })
  })

  describe('toString', () => {
    it('文字列表現を返す', () => {
      const vo = new TestValueObject('test value')
      expect(vo.toString()).toBe('test value')
    })

    it('数値の場合も文字列として返す', () => {
      const vo = new NumberValueObject(123)
      expect(vo.toString()).toBe('123')
    })
  })

  describe('toJSON', () => {
    it('JSON表現を返す', () => {
      const vo = new TestValueObject('test value')
      expect(vo.toJSON()).toBe('test value')
    })

    it('数値の場合は数値として返す', () => {
      const vo = new NumberValueObject(123)
      expect(vo.toJSON()).toBe(123)
    })
  })

  describe('複雑なオブジェクトの等価性判定', () => {
    class ObjectValueObject extends ValueObject<{ name: string; age: number }> {
      constructor(value: { name: string; age: number }) {
        super(value)
      }

      protected validate(value: { name: string; age: number }): void {
        if (!value.name || value.age < 0) {
          throw new Error('無効なオブジェクト')
        }
      }
    }

    it('同じプロパティを持つオブジェクトは等しいと判定される', () => {
      const vo1 = new ObjectValueObject({ name: 'John', age: 30 })
      const vo2 = new ObjectValueObject({ name: 'John', age: 30 })
      expect(vo1.equals(vo2)).toBe(true)
    })

    it('異なるプロパティを持つオブジェクトは等しくないと判定される', () => {
      const vo1 = new ObjectValueObject({ name: 'John', age: 30 })
      const vo2 = new ObjectValueObject({ name: 'Jane', age: 30 })
      expect(vo1.equals(vo2)).toBe(false)
    })
  })
})
