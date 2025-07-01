# Testing Strategy for Claude Code

## Overview

Usakaプロジェクトにおけるテスト戦略と、Claude Codeを使用したテスト作成のガイドラインです。

## Testing Pyramid

### 1. Unit Tests (Jest)

**対象**: 個別の関数、クラス、コンポーネント
**場所**: `__tests__/` ディレクトリ
**実行**: `npm test`

#### API Route Tests

```typescript
// Example: __tests__/api/auth/login.test.ts
import { POST } from '@/app/api/auth/login/route'
import { createMockRequest } from '@/__tests__/helpers/test-utils'

describe('/api/auth/login', () => {
  it('should return JWT token for valid credentials', async () => {
    const request = createMockRequest({
      email: 'demo@example.com',
      password: 'demo123',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.token).toBeDefined()
  })
})
```

#### Component Tests

```typescript
// Example: __tests__/components/ui/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  it('should render with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 2. Integration Tests (Jest)

**対象**: API + Database の統合
**場所**: `__tests__/api/` ディレクトリ
**実行**: `npm run test:api`

```typescript
// Example: API + Database integration
describe('User Registration Flow', () => {
  beforeEach(async () => {
    // Clean test database
    await prisma.user.deleteMany()
  })

  it('should create user and send verification email', async () => {
    const userData = {
      userName: 'newuser',
      email: 'newuser@example.com',
      password: 'password123',
    }

    const response = await POST(createMockRequest(userData))
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)

    // Verify user was created in database
    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    })
    expect(user).toBeDefined()
    expect(user?.emailVerified).toBe(false)
  })
})
```

### 3. E2E Tests (Playwright)

**対象**: ユーザーワークフロー全体
**場所**: `e2e/` ディレクトリ
**実行**: `npm run test:e2e`

```typescript
// Example: e2e/auth/login.spec.ts
import { test, expect } from '@playwright/test'

test('user can login and access dashboard', async ({ page }) => {
  // Navigate to login page
  await page.goto('/auth/login')

  // Fill login form
  await page.fill('[data-testid="email-input"]', 'demo@example.com')
  await page.fill('[data-testid="password-input"]', 'demo123')

  // Submit form
  await page.click('[data-testid="login-button"]')

  // Verify successful login
  await expect(page).toHaveURL('/dashboard')
  await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible()
})
```

## Test Data Management

### Mock Data Strategy

```typescript
// __tests__/helpers/test-data.ts
export const mockUser = {
  id: 'test-user-id',
  userName: 'testuser',
  email: 'test@example.com',
  isActive: true,
  role: 'USER' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const mockPost = {
  id: 'test-post-id',
  title: 'Test Post',
  content: 'Test content',
  cosmeticName: 'Test Cosmetic',
  userId: mockUser.id,
  status: 'published' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
}
```

### Database Test Setup

```typescript
// __tests__/helpers/test-utils.ts
import { PrismaClient } from '@prisma/client'

const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL,
    },
  },
})

export async function setupTestData() {
  await testPrisma.user.create({
    data: mockUser,
  })

  await testPrisma.post.create({
    data: mockPost,
  })
}

export async function cleanupTestData() {
  await testPrisma.post.deleteMany()
  await testPrisma.user.deleteMany()
}
```

## Claude Code Testing Workflow

### 1. Test-Driven Development (TDD)

```
1. 要件を理解
2. テストケースを先に作成
3. テストが失敗することを確認
4. 実装を行い、テストを通す
5. リファクタリング
```

### 2. テスト作成時の指示例

```
以下の機能のテストを作成してください：
機能: ユーザー登録API
要件:
- 有効なデータでユーザー作成成功
- 重複メールでエラー
- 無効なメール形式でエラー
- パスワード強度チェック

テスト種類: ユニットテスト + 統合テスト
```

### 3. テスト更新時の指示例

```
以下のコード変更に対してテストを更新してください：
変更内容: [変更詳細]
影響範囲: [テストファイルパス]
追加テストケース: [新しいテストシナリオ]
```

## Test Coverage Goals

### Coverage Targets

- **Unit Tests**: 90%以上
- **API Routes**: 95%以上
- **Critical Components**: 100%
- **Authentication Logic**: 100%

### Coverage Monitoring

```bash
# カバレッジレポート生成
npm run test:coverage

# カバレッジの確認
open coverage/lcov-report/index.html
```

## Continuous Testing

### Pre-commit Hooks

```bash
# テスト実行を自動化
npm test              # ユニット・統合テスト
npm run test:e2e      # E2Eテスト（重要な変更時）
npm run lint          # コード品質チェック
npx tsc --noEmit      # 型チェック
```

### CI/CD Integration

- プルリクエスト時: 全テスト実行
- マージ時: E2Eテスト含む完全テスト
- デプロイ前: 本番類似環境でのテスト

## Best Practices

### 1. テストの独立性

- 各テストは他のテストに依存しない
- 適切なsetup/teardownを実装
- 共有状態を避ける

### 2. 明確なテスト名

```typescript
// Good
it('should return 400 when email is missing')
it('should create user when all required fields are provided')

// Bad
it('should work')
it('test user creation')
```

### 3. テストデータの管理

- ファクトリーパターンの使用
- テスト用のseedデータ
- モックデータの一元管理

### 4. パフォーマンステスト

- データベースクエリの最適化確認
- APIレスポンス時間の監視
- メモリ使用量のチェック
