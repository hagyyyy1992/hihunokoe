/**
 * ValueObject（値オブジェクト）の基底クラス
 *
 * 値オブジェクトの特徴：
 * - イミュータブル（不変）
 * - 値による等価性の判定
 * - 副作用を持たない
 */
export abstract class ValueObject<T> {
  protected readonly _value: T

  protected constructor(value: T) {
    this.validate(value)
    this._value = value
    Object.freeze(this)
  }

  /**
   * 値を取得
   */
  get value(): T {
    return this._value
  }

  /**
   * 値のバリデーション
   * サブクラスで実装
   */
  protected abstract validate(value: T): void

  /**
   * 等価性の判定
   */
  equals(other: ValueObject<T>): boolean {
    if (!other || !(other instanceof ValueObject)) {
      return false
    }

    // 同じクラスのインスタンスかチェック
    if (this.constructor !== other.constructor) {
      return false
    }

    return this.isEqual(this._value, other._value)
  }

  /**
   * 値の等価性判定の実装
   * プリミティブ型はそのまま比較、オブジェクト型は深い比較が必要
   */
  protected isEqual(value1: T, value2: T): boolean {
    if (value1 === value2) {
      return true
    }

    // オブジェクトの場合は JSON.stringify で比較（簡易実装）
    if (typeof value1 === 'object' && value1 !== null) {
      return JSON.stringify(value1) === JSON.stringify(value2)
    }

    return false
  }

  /**
   * 文字列表現
   */
  toString(): string {
    return String(this._value)
  }

  /**
   * JSON表現
   */
  toJSON(): T {
    return this._value
  }
}
