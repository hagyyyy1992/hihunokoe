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

  // アクティブなユーザー（論理削除されていない）の重複チェック
  const existingActiveUser = await prisma!.user.findFirst({
    where: {
      OR: [{ email: data.email }, { userName: data.userName }],
      isActive: true,
      deletedAt: null,
    },
  })

  if (existingActiveUser) {
    throw new Error('ユーザー名またはメールアドレスが既に使用されています')
  }

  // 論理削除されたユーザーが存在するかチェック
  const deletedUser = await prisma!.user.findFirst({
    where: {
      OR: [{ email: data.email }, { userName: data.userName }],
      isActive: false,
      deletedAt: { not: null },
    },
  })

  const hashedPassword = await hashPassword(data.password)

  try {
    let user

    if (deletedUser) {
      // 論理削除されたユーザーが存在する場合、そのレコードを復活
      user = await prisma!.user.update({
        where: { id: deletedUser.id },
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
          isActive: true,
          deletedAt: null,
          emailVerified:
            process.env.NODE_ENV === 'test' ? false : process.env.NODE_ENV !== 'production',
          // その他のフィールドもリセット
          profileImageUrl: null,
          emailVerificationToken: null,
          emailVerificationExpiry: null,
          passwordResetToken: null,
          passwordResetExpiry: null,
        },
      })
    } else {
      // 新規ユーザー作成
      user = await prisma!.user.create({
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
            process.env.NODE_ENV === 'test' ? false : process.env.NODE_ENV !== 'production',
        },
      })
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
      emailVerified: user.emailVerified,
    }
  } catch (error: unknown) {
    console.error('User registration error:', error)
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

    if (user && user.isActive && !user.deletedAt) {
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
      deletedAt: null,
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

export async function deleteUserAccount(id: string): Promise<boolean> {
  if (!isDatabaseAvailable() || !isValidUUID(id)) {
    // モックモードでは削除をサポートしない
    throw new Error('アカウント削除はモックモードではサポートされていません')
  }

  try {
    // ユーザーが存在するか確認（論理削除されていないもののみ）
    const user = await prisma!.user.findUnique({
      where: {
        id,
        isActive: true,
        deletedAt: null,
      },
    })

    if (!user) {
      throw new Error('ユーザーが見つかりません')
    }

    // 論理削除を実行（deletedAtに現在時刻を設定）
    await prisma!.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    })

    return true
  } catch (error) {
    console.error('Account deletion failed:', error)
    // Re-throw known application errors
    if (error instanceof Error && error.message === 'ユーザーが見つかりません') {
      throw error
    }
    throw new Error('アカウントの削除に失敗しました')
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
