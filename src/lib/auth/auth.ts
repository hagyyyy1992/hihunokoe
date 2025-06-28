import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma, isDatabaseAvailable } from '@/lib/prisma'
import { MOCK_USERS } from '@/lib/mock-data'
import { SkinType, Gender, AllergyType, BodyType, UserRole } from '@prisma/client'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key'

export interface AuthUser {
  id: string
  userName: string
  email: string
  role?: UserRole
  birthDate?: Date | null
  gender?: Gender | null
  skinType?: SkinType | null
  skinTypeOther?: string | null
  allergies?: AllergyType[]
  allergiesOther?: string | null
  bodyType?: BodyType | null
  bodyTypeOther?: string | null
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
  birthDate?: Date
  gender?: Gender
  skinType?: SkinType
  skinTypeOther?: string
  allergies?: AllergyType[]
  allergiesOther?: string
  bodyType?: BodyType
  bodyTypeOther?: string
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
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: '7d',
    }
  )
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string
      userName: string
      email: string
      role?: UserRole
    }
    return {
      id: decoded.id,
      userName: decoded.userName,
      email: decoded.email,
      role: decoded.role,
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
        birthDate: data.birthDate,
        gender: data.gender,
        skinType: data.skinType,
        skinTypeOther: data.skinTypeOther,
        allergies: data.allergies || [],
        allergiesOther: data.allergiesOther,
        bodyType: data.bodyType,
        bodyTypeOther: data.bodyTypeOther,
        emailVerified:
          process.env.NODE_ENV === 'test' ? false : process.env.NODE_ENV !== 'production', // テスト環境では未認証、開発環境では認証済み
      },
    })

    return {
      id: user.id,
      userName: user.userName,
      email: user.email,
      birthDate: user.birthDate,
      gender: user.gender,
      skinType: user.skinType,
      skinTypeOther: user.skinTypeOther,
      allergies: user.allergies,
      allergiesOther: user.allergiesOther,
      bodyType: user.bodyType,
      bodyTypeOther: user.bodyTypeOther,
      profileImageUrl: user.profileImageUrl || undefined,
      emailVerified: user.emailVerified,
    }
  } catch (error: unknown) {
    // Prismaのユニーク制約エラーハンドリング
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        // 重複エラーを示すカスタムエラー
        const duplicateError = new Error(
          'ユーザー名またはメールアドレスが既に使用されています'
        ) as Error & { code: string }
        duplicateError.code = 'P2002'
        throw duplicateError
      }
    }
    throw new Error('ユーザー名またはメールアドレスが既に使用されています')
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
          role: user.role,
          birthDate: user.birthDate,
          gender: user.gender,
          skinType: user.skinType,
          skinTypeOther: user.skinTypeOther,
          allergies: user.allergies,
          allergiesOther: user.allergiesOther,
          bodyType: user.bodyType,
          bodyTypeOther: user.bodyTypeOther,
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
    role: user.role,
    birthDate: user.birthDate,
    gender: user.gender,
    skinType: user.skinType,
    skinTypeOther: user.skinTypeOther,
    allergies: user.allergies,
    allergiesOther: user.allergiesOther,
    bodyType: user.bodyType,
    bodyTypeOther: user.bodyTypeOther,
    profileImageUrl: user.profileImageUrl || undefined,
    emailVerified: user.emailVerified, // 重要: emailVerifiedを含める
  }
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN
}

export function isSuperAdmin(user: AuthUser | null): boolean {
  return user?.role === UserRole.SUPER_ADMIN
}

export async function logAdminAction(
  userId: string,
  action: string,
  target?: string,
  details?: unknown,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  if (!isDatabaseAvailable()) {
    return
  }

  try {
    await prisma!.adminLog.create({
      data: {
        userId,
        action,
        target,
        details: details ? JSON.parse(JSON.stringify(details)) : null,
        ipAddress,
        userAgent,
      },
    })
  } catch (error) {
    console.error('Failed to log admin action:', error)
  }
}
