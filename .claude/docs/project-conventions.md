# Project Conventions for Claude Code

## Overview

Usakaプロジェクトでコード生成・編集を行う際の規約とパターンを定義します。

## Coding Conventions

### TypeScript/JavaScript

```typescript
// Good: 明確な型定義
interface UserProfile {
  id: string
  userName: string
  email: string
  isActive: boolean
}

// Good: 適切なエラーハンドリング
try {
  const result = await userService.createUser(userData)
  return NextResponse.json(result)
} catch (error) {
  console.error('User creation failed:', error)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
```

### API Routes

```typescript
// Good: 一貫したレスポンス形式
export async function POST(request: Request) {
  try {
    // 入力検証
    const body = await request.json()
    const validatedData = schema.parse(body)

    // ビジネスロジック
    const result = await service.process(validatedData)

    // 成功レスポンス
    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    // エラーレスポンス
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 400 }
    )
  }
}
```

### React Components

```tsx
// Good: Props型定義とデフォルトProps
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  children: React.ReactNode
  onClick?: () => void
}

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  onClick,
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${disabled ? 'opacity-50' : ''}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
```

## Database Conventions

### Prisma Schema

```prisma
// Good: 一貫した命名規則
model User {
  id        String   @id @default(uuid()) @db.Uuid
  userName  String   @unique @map("user_name") @db.VarChar(100)
  email     String   @unique @db.VarChar(255)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  posts     Post[]

  @@map("users")
}
```

### クエリパターン

```typescript
// Good: 適切なエラーハンドリングと型安全性
async function getUserWithPosts(userId: string): Promise<UserWithPosts | null> {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        posts: {
          where: { status: 'published' },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
  } catch (error) {
    console.error('Database query failed:', error)
    throw new Error('Failed to fetch user data')
  }
}
```

## Testing Conventions

### Unit Tests

```typescript
// Good: 明確なテスト構造
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData = {
        userName: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      }

      // Act
      const result = await userService.createUser(userData)

      // Assert
      expect(result).toBeDefined()
      expect(result.userName).toBe('testuser')
      expect(result.email).toBe('test@example.com')
    })

    it('should throw error with invalid email', async () => {
      // Arrange
      const invalidData = {
        userName: 'testuser',
        email: 'invalid-email',
        password: 'password123',
      }

      // Act & Assert
      await expect(userService.createUser(invalidData)).rejects.toThrow('Invalid email format')
    })
  })
})
```

### E2E Tests

```typescript
// Good: ページオブジェクトパターン
test('user can login successfully', async ({ page }) => {
  // Navigate to login page
  await page.goto('/auth/login')

  // Fill login form
  await page.fill('[data-testid="email-input"]', 'demo@example.com')
  await page.fill('[data-testid="password-input"]', 'demo123')

  // Submit form
  await page.click('[data-testid="login-button"]')

  // Verify redirect to dashboard
  await expect(page).toHaveURL('/dashboard')
  await expect(page.locator('[data-testid="user-name"]')).toBeVisible()
})
```

## File Organization

### Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── posts/        # Post-related endpoints
│   │   └── admin/        # Admin endpoints
│   ├── auth/             # Auth pages
│   └── dashboard/        # Dashboard pages
├── components/           # React components
│   ├── ui/              # Reusable UI components
│   ├── forms/           # Form components
│   └── layout/          # Layout components
├── lib/                 # Utility libraries
│   ├── auth/           # Authentication logic
│   ├── email/          # Email handling
│   └── prisma.ts       # Database client
└── types/              # Type definitions
```

## Error Handling Patterns

### API Error Response

```typescript
// Standard error response format
interface ErrorResponse {
  success: false
  error: string
  details?: any
  code?: string
}

// Usage
return NextResponse.json(
  {
    success: false,
    error: 'Validation failed',
    details: validationErrors,
    code: 'VALIDATION_ERROR',
  },
  { status: 400 }
)
```

### Frontend Error Handling

```typescript
// Good: Consistent error handling
async function handleSubmit(data: FormData) {
  try {
    setLoading(true)
    setError(null)

    const response = await api.createPost(data)

    if (!response.success) {
      throw new Error(response.error)
    }

    router.push('/posts')
  } catch (error) {
    setError(error.message || 'An unexpected error occurred')
  } finally {
    setLoading(false)
  }
}
```
