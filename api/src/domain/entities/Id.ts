import { ValueObject } from './ValueObject'
import { randomUUID } from 'crypto'

/**
 * ID値オブジェクト
 * UUID v4形式のIDを生成・管理する
 */
export class Id extends ValueObject<string> {
  /**
   * 新しいIDを生成
   */
  constructor()
  /**
   * 既存のID文字列から作成
   */
  constructor(value: string)
  constructor(value?: string) {
    // 引数なしの場合は新しいUUIDを生成
    const id = value ?? randomUUID()
    super(id)
  }

  /**
   * UUID形式のバリデーション
   */
  protected validate(value: string): void {
    if (!value) {
      throw new Error('IDは必須です')
    }

    // UUID v4の正規表現パターン
    const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    if (!uuidV4Pattern.test(value)) {
      throw new Error(`無効なID形式です: ${value}`)
    }
  }

  /**
   * 新しいIDを生成（ファクトリーメソッド）
   */
  static generate(): Id {
    return new Id()
  }

  /**
   * 既存のID文字列からIdオブジェクトを作成
   */
  static from(value: string): Id {
    return new Id(value)
  }

  /**
   * ID文字列かどうかを検証（バリデーションのみ、例外を投げない）
   */
  static isValid(value: string): boolean {
    if (!value) return false

    const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidV4Pattern.test(value)
  }
}
