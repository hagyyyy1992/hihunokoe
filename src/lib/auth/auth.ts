import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { MOCK_USERS } from '@/lib/mock-data'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key'

export interface AuthUser {
  id: string
  userName: string
  email: string
  displayName?: string
  skinType?: string
  profileImageUrl?: string
  emailVerified?: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  userName: string
  email: string
  password: string
  displayName?: string
  skinType?: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      userName: user.userName,
      email: user.email,
    },
    JWT_SECRET,
    {
      expiresIn: '7d',
    }
  )
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; userName: string; email: string }
    return {
      id: decoded.id,
      userName: decoded.userName,
      email: decoded.email,
    }
  } catch {
    return null
  }
}

export async function registerUser(data: RegisterData): Promise<AuthUser> {
  // デモユーザーとの重複チェック（常に実行）
  const mockUser = MOCK_USERS.find(u => u.email === data.email || u.userName === data.userName)
  if (mockUser) {
    throw new Error('このメールアドレスまたはユーザー名は既に使用されています（デモユーザー）')
  }

  if (!isDatabaseAvailable()) {
    // モックモードでは新規登録を制限
    throw new Error('現在、新規登録は制限されています。デモ用ログイン情報をご利用ください。')
  }

  const hashedPassword = await hashPassword(data.password)

  try {
    const user = await prisma!.user.create({
      data: {
        userName: data.userName,
        email: data.email,
        passwordHash: hashedPassword,
        displayName: data.displayName,
        skinType: data.skinType,
      },
    })

    return {
      id: user.id,
      userName: user.userName,
      email: user.email,
      displayName: user.displayName || undefined,
      skinType: user.skinType || undefined,
      profileImageUrl: user.profileImageUrl || undefined,
    }
  } catch (error: unknown) {
    // Prismaのユニーク制約エラーハンドリング
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        throw new Error('ユーザー名またはメールアドレスが既に使用されています')
      }
    }
    throw new Error('ユーザー登録に失敗しました')
  }
}

export async function loginUser(credentials: LoginCredentials): Promise<AuthUser | null> {
  // データベースが利用可能な場合は、データベースユーザーを優先
  if (isDatabaseAvailable()) {
    const user = await prisma!.user.findUnique({
      where: {
        email: credentials.email,
      },
    })

    if (user && user.isActive) {
      const isPasswordValid = await verifyPassword(credentials.password, user.passwordHash)

      if (isPasswordValid) {
        return {
          id: user.id,
          userName: user.userName,
          email: user.email,
          displayName: user.displayName || undefined,
          skinType: user.skinType || undefined,
          profileImageUrl: user.profileImageUrl || undefined,
          emailVerified: user.emailVerified,
        }
      }
    }
  }

  // データベースが利用できない場合、またはデータベースにユーザーが見つからない場合はモックユーザーをチェック
  const mockUser = MOCK_USERS.find(u => u.email === credentials.email)
  if (mockUser && mockUser.isActive && credentials.password === 'demo123') {
    return {
      id: mockUser.id,
      userName: mockUser.userName,
      email: mockUser.email,
      displayName: mockUser.displayName || undefined,
      skinType: mockUser.skinType || undefined,
      profileImageUrl: mockUser.profileImageUrl || undefined,
      emailVerified: true, // モックユーザーは常に認証済み
    }
  }

  return null
}

// UUID形式のチェック用関数
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  if (!isDatabaseAvailable() || !isValidUUID(id)) {
    // モックモードまたは無効なUUIDの場合
    const mockUser = MOCK_USERS.find(u => u.id === id && u.isActive)
    if (!mockUser) {
      return null
    }

    return {
      id: mockUser.id,
      userName: mockUser.userName,
      email: mockUser.email,
      displayName: mockUser.displayName || undefined,
      skinType: mockUser.skinType || undefined,
      profileImageUrl: mockUser.profileImageUrl || undefined,
      emailVerified: true, // モックユーザーは常に認証済み
    }
  }

  const user = await prisma!.user.findUnique({
    where: {
      id,
      isActive: true,
    },
  })

  if (!user) {
    return null
  }

  return {
    id: user.id,
    userName: user.userName,
    email: user.email,
    displayName: user.displayName || undefined,
    skinType: user.skinType || undefined,
    profileImageUrl: user.profileImageUrl || undefined,
    emailVerified: user.emailVerified, // 重要: emailVerifiedを含める
  }
}
