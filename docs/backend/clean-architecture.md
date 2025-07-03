# クリーンアーキテクチャ実装ガイド

## 概要

このプロジェクトでは、Robert C. Martin (Uncle Bob) が提唱するクリーンアーキテクチャの原則に基づいて、API層を実装しています。この設計により、ビジネスロジックの独立性、テスタビリティ、保守性を確保しています。

## ディレクトリ構造

```
api/src/
├── domain/                      # ドメイン層（最内層）
│   ├── entities/               # エンティティ
│   │   ├── User.ts
│   │   └── AuthSession.ts
│   ├── value-objects/          # 値オブジェクト
│   │   ├── Email.ts
│   │   └── Password.ts
│   ├── repositories/           # リポジトリインターフェース
│   │   ├── UserRepository.ts
│   │   └── AuthSessionRepository.ts
│   ├── services/               # ドメインサービスインターフェース
│   │   ├── PasswordHashService.ts
│   │   └── TokenService.ts
│   └── exceptions/            # ドメイン例外
│       └── AuthenticationError.ts
│
├── usecases/                   # ユースケース層
│   ├── auth/
│   │   ├── LoginUseCase.ts
│   │   ├── LoginInputPort.ts
│   │   └── RegisterUseCase.ts
│   └── user/
│       ├── interactor.ts       # ユースケースの実装
│       ├── input-port.ts       # 入力ポート（インターフェース）
│       └── output-port.ts      # 出力ポート（インターフェース）
│
├── interface-adapters/         # インターフェースアダプター層
│   ├── repositories/           # リポジトリ実装
│   │   ├── UserRepositoryImpl.ts
│   │   └── AuthSessionRepositoryImpl.ts
│   └── services/              # サービス実装
│       ├── PasswordHashServiceImpl.ts
│       └── TokenServiceImpl.ts
│
└── framework/                  # フレームワーク層（最外層）
    └── controllers/           # コントローラー
        ├── UserController.ts
        └── AuthController.ts
```

## 層の責務と依存関係

### 1. ドメイン層（Domain Layer）

**責務**: ビジネスロジックとビジネスルールを表現

- 他の層に依存しない
- フレームワークに依存しない
- データベースに依存しない

```typescript
// domain/entities/User.ts
export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly profileImage?: string
  ) {}
}
```

### 2. ユースケース層（Use Cases Layer）

**責務**: アプリケーション固有のビジネスルール

- ドメイン層のみに依存
- 入力ポート・出力ポートを定義
- 具体的な実装に依存しない

```typescript
// usecases/user/interactor.ts
export class GetUserInteractor {
  constructor(
    private userRepository: UserRepository,
    private presenter: GetUserOutputPort
  ) {}

  async execute(input: GetUserInputData): Promise<void> {
    const user = await this.userRepository.findById(input.userId)
    if (!user) {
      this.presenter.presentNotFound()
      return
    }
    this.presenter.presentUser(user)
  }
}
```

### 3. インターフェースアダプター層（Interface Adapters Layer）

**責務**: 外部システムとの接続を適応

- ドメイン層とユースケース層に依存
- 具体的な実装を提供

```typescript
// interface-adapters/repositories/UserRepositoryImpl.ts
export class UserRepositoryImpl implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    })
    return user ? new User(user.id, user.email, user.name) : null
  }
}
```

### 4. フレームワーク層（Frameworks & Drivers Layer）

**責務**: フレームワーク固有の実装

- すべての内側の層に依存可能
- Next.js、Express等の具体的なフレームワークを使用

```typescript
// framework/controllers/UserController.ts
export class UserController {
  private getUserInteractor: GetUserInteractor

  constructor() {
    const userRepository = new UserRepositoryImpl(prisma)
    const presenter = new UserPresenter()
    this.getUserInteractor = new GetUserInteractor(userRepository, presenter)
  }

  async getUser(req: Request): Promise<Response> {
    const input = { userId: req.params.id }
    await this.getUserInteractor.execute(input)
    return presenter.getResponse()
  }
}
```

## 命名規則

### ユースケース層

- **Interactor**: ユースケースの実装クラス
  - 例: `GetUserInteractor`, `CreatePostInteractor`
- **InputPort**: ユースケースへの入力インターフェース
  - ファイル名: `input-port.ts`
  - インターフェース名: `GetUserInputPort`
- **OutputPort**: ユースケースからの出力インターフェース
  - ファイル名: `output-port.ts`
  - インターフェース名: `GetUserOutputPort`

### リポジトリ

- **インターフェース**: `UserRepository`, `PostRepository`
- **実装**: `UserRepositoryImpl`, `PostRepositoryImpl`

### サービス

- **インターフェース**: `PasswordHashService`, `EmailService`
- **実装**: `PasswordHashServiceImpl`, `EmailServiceImpl`

## 実装例：ユーザー取得機能

### 1. 入力ポート定義

```typescript
// usecases/user/input-port.ts
export interface GetUserInputData {
  userId: string
}

export interface GetUserInputPort {
  execute(input: GetUserInputData): Promise<void>
}
```

### 2. 出力ポート定義

```typescript
// usecases/user/output-port.ts
export interface GetUserOutputPort {
  presentUser(user: User): void
  presentNotFound(): void
  presentError(error: Error): void
}
```

### 3. Interactor実装

```typescript
// usecases/user/interactor.ts
export class GetUserInteractor implements GetUserInputPort {
  constructor(
    private userRepository: UserRepository,
    private presenter: GetUserOutputPort
  ) {}

  async execute(input: GetUserInputData): Promise<void> {
    try {
      const user = await this.userRepository.findById(input.userId)
      if (!user) {
        this.presenter.presentNotFound()
        return
      }
      this.presenter.presentUser(user)
    } catch (error) {
      this.presenter.presentError(error as Error)
    }
  }
}
```

## 依存性注入（DI）

依存性注入により、各層の結合度を低く保ちます。

```typescript
// DIコンテナ（簡易版）
export class DIContainer {
  private static userRepository: UserRepository

  static getUserRepository(): UserRepository {
    if (!this.userRepository) {
      this.userRepository = new UserRepositoryImpl(prisma)
    }
    return this.userRepository
  }

  static createGetUserInteractor(presenter: GetUserOutputPort): GetUserInteractor {
    return new GetUserInteractor(this.getUserRepository(), presenter)
  }
}
```

## テスト戦略

### ユニットテスト

各層を独立してテスト可能：

```typescript
// __tests__/usecases/user/GetUserInteractor.test.ts
describe('GetUserInteractor', () => {
  it('ユーザーが存在する場合、正常に取得できる', async () => {
    const mockUser = new User('1', 'test@example.com', 'Test User')
    const mockRepository = {
      findById: jest.fn().mockResolvedValue(mockUser),
    }
    const mockPresenter = {
      presentUser: jest.fn(),
      presentNotFound: jest.fn(),
      presentError: jest.fn(),
    }

    const interactor = new GetUserInteractor(mockRepository, mockPresenter)
    await interactor.execute({ userId: '1' })

    expect(mockPresenter.presentUser).toHaveBeenCalledWith(mockUser)
  })
})
```

## ベストプラクティス

1. **依存性の方向を守る**: 内側の層は外側の層に依存しない
2. **インターフェースを使用**: 具体的な実装ではなく抽象に依存
3. **ビジネスロジックの分離**: フレームワーク固有のコードから分離
4. **テスタビリティ**: 各層を独立してテスト可能に
5. **命名の一貫性**: プロジェクト全体で統一された命名規則を使用

## 移行ガイド

既存のコードをクリーンアーキテクチャに移行する際のステップ：

1. **ドメインモデルの抽出**: エンティティと値オブジェクトを定義
2. **ユースケースの識別**: ビジネスロジックをInteractorに移動
3. **インターフェースの定義**: リポジトリとサービスのインターフェースを作成
4. **実装の分離**: 具体的な実装をインターフェースアダプター層に移動
5. **コントローラーの簡素化**: ユースケースの呼び出しのみに責務を限定

## 参考資料

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [The Clean Architecture in PHP](https://leanpub.com/cleanphp)
- [実践クリーンアーキテクチャ](https://nrslib.com/clean-architecture/)
