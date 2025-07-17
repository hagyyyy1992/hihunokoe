# ValueObject と Id クラスの使用方法

## ValueObject（値オブジェクト）

ValueObjectは、ドメイン駆動設計における値オブジェクトの基底クラスです。

### 特徴

- **イミュータブル（不変）**: 一度作成されると変更できません
- **値による等価性**: 同じ値を持つオブジェクトは等しいと判定されます
- **バリデーション**: コンストラクタでバリデーションを実行します

### 使用例

```typescript
import { ValueObject } from '@api/domain/entities/ValueObject'

// Email値オブジェクトの例
class Email extends ValueObject<string> {
  constructor(value: string) {
    super(value)
  }

  protected validate(value: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      throw new Error('無効なメールアドレス形式です')
    }
  }
}

// 使用
const email1 = new Email('user@example.com')
const email2 = new Email('user@example.com')

console.log(email1.equals(email2)) // true
console.log(email1.value) // 'user@example.com'
```

## Id クラス

IdクラスはUUID v4形式のIDを生成・管理するための値オブジェクトです。

### 使用方法

```typescript
import { Id } from '@api/domain/entities/Id'

// 新しいIDを生成
const newId = new Id()
console.log(newId.value) // '550e8400-e29b-41d4-a716-446655440000' のようなUUID

// ファクトリーメソッドを使用
const generatedId = Id.generate()

// 既存のID文字列から作成
const existingId = Id.from('550e8400-e29b-41d4-a716-446655440000')

// バリデーション
const isValid = Id.isValid('550e8400-e29b-41d4-a716-446655440000') // true
```

### エンティティでの使用例

```typescript
import { Id } from '@api/domain/entities/Id'

class User {
  public readonly id: Id
  public readonly email: Email
  public readonly name: string

  constructor(id: Id, email: Email, name: string) {
    this.id = id
    this.email = email
    this.name = name
  }

  // 新規作成用ファクトリーメソッド
  static create(email: string, name: string): User {
    return new User(
      new Id(), // 新しいIDを自動生成
      new Email(email),
      name
    )
  }

  // 既存データからの復元用ファクトリーメソッド
  static restore(id: string, email: string, name: string): User {
    return new User(
      Id.from(id), // 既存のID文字列から復元
      new Email(email),
      name
    )
  }
}

// 使用例
const newUser = User.create('user@example.com', 'John Doe')
console.log(newUser.id.value) // 新しく生成されたUUID

const existingUser = User.restore(
  '550e8400-e29b-41d4-a716-446655440000',
  'user@example.com',
  'John Doe'
)
```

### リポジトリでの使用例

```typescript
interface IUserRepository {
  findById(id: Id): Promise<User | null>
  save(user: User): Promise<void>
}

class UserRepository implements IUserRepository {
  async findById(id: Id): Promise<User | null> {
    const result = await db.user.findUnique({
      where: { id: id.value }, // 値を取り出してクエリに使用
    })

    if (!result) return null

    return User.restore(result.id, result.email, result.name)
  }

  async save(user: User): Promise<void> {
    await db.user.upsert({
      where: { id: user.id.value },
      update: {
        email: user.email.value,
        name: user.name,
      },
      create: {
        id: user.id.value,
        email: user.email.value,
        name: user.name,
      },
    })
  }
}
```

## メリット

1. **型安全性**: 文字列ではなく専用の型を使用することで、誤った値の代入を防げます
2. **バリデーション**: 不正な値の生成を防ぎます
3. **ドメイン知識の表現**: ビジネスルールをコードで表現できます
4. **テスタビリティ**: 値オブジェクトは独立してテストできます
