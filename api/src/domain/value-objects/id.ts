import { v4 as uuidv4 } from 'uuid'

/**
 * IDを表すValue Object
 * 不変性とビジネスルールを保証する
 */
export class Id {
  private readonly value: string

  protected constructor(value: string) {
    this.value = value
  }

  /**
   * 既存のID文字列からIdインスタンスを作成
   */
  static from(value: string): Id {
    if (!value || value.trim() === '') {
      throw new Error('ID cannot be empty')
    }

    if (!this.isValidFormat(value)) {
      throw new Error(`Invalid ID format: ${value}`)
    }

    return new Id(value)
  }

  /**
   * 新しいIDを生成
   */
  static generate(): Id {
    return new Id(uuidv4())
  }

  /**
   * IDの文字列表現を取得
   */
  toString(): string {
    return this.value
  }

  /**
   * IDの値を取得（Prisma等のORMで使用）
   */
  getValue(): string {
    return this.value
  }

  /**
   * 等価性の比較
   */
  equals(other: Id | null | undefined): boolean {
    if (!other) return false
    return this.value === other.value
  }

  /**
   * IDフォーマットの検証
   * UUID v4とCUID2の両方をサポート
   */
  private static isValidFormat(value: string): boolean {
    // UUID v4形式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    // CUID2形式（将来の移行に備えて）
    const cuidRegex = /^[a-z0-9]{24,32}$/

    return uuidRegex.test(value) || cuidRegex.test(value)
  }

  /**
   * JSON変換用
   */
  toJSON(): string {
    return this.value
  }
}

/**
 * 型付きIDクラスのファクトリ
 * エンティティごとに型安全なIDを作成
 */
export function createTypedId<T extends string>(type: T) {
  return class TypedId extends Id {
    private readonly _type: T = type

    static from(value: string): TypedId {
      const id = Id.from(value)
      return new TypedId(id.getValue())
    }

    static generate(): TypedId {
      const id = Id.generate()
      return new TypedId(id.getValue())
    }

    private constructor(value: string) {
      super(value)
    }

    getType(): T {
      return this._type
    }
  }
}

// 各エンティティ用の型付きIDクラス
export class UserId extends Id {
  static from(value: string): UserId {
    const id = Id.from(value)
    return new UserId(id.getValue())
  }

  static generate(): UserId {
    const id = Id.generate()
    return new UserId(id.getValue())
  }
}

export class PostId extends Id {
  static from(value: string): PostId {
    const id = Id.from(value)
    return new PostId(id.getValue())
  }

  static generate(): PostId {
    const id = Id.generate()
    return new PostId(id.getValue())
  }
}

export class CommentId extends Id {
  static from(value: string): CommentId {
    const id = Id.from(value)
    return new CommentId(id.getValue())
  }

  static generate(): CommentId {
    const id = Id.generate()
    return new CommentId(id.getValue())
  }
}

export class EmpathyId extends Id {
  static from(value: string): EmpathyId {
    const id = Id.from(value)
    return new EmpathyId(id.getValue())
  }

  static generate(): EmpathyId {
    const id = Id.generate()
    return new EmpathyId(id.getValue())
  }
}

export class AdminUserId extends Id {
  static from(value: string): AdminUserId {
    const id = Id.from(value)
    return new AdminUserId(id.getValue())
  }

  static generate(): AdminUserId {
    const id = Id.generate()
    return new AdminUserId(id.getValue())
  }
}

export class AdminLogId extends Id {
  static from(value: string): AdminLogId {
    const id = Id.from(value)
    return new AdminLogId(id.getValue())
  }

  static generate(): AdminLogId {
    const id = Id.generate()
    return new AdminLogId(id.getValue())
  }
}
