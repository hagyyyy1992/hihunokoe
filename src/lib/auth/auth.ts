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
  if (!isDatabaseAvailable()) {
    // モックモードでは新規登録は既存ユーザーとして扱う
    const mockUser = MOCK_USERS.find(u => u.email === data.email)
    if (mockUser) {
      throw new Error('ユーザー名またはメールアドレスが既に使用されています')
    }

    // デモ用の新しいユーザーを返す
    return {
      id: 'demo-new-user',
      userName: data.userName,
      email: data.email,
      displayName: data.displayName,
      skinType: data.skinType,
    }
  }

  const hashedPassword = await hashPassword(data.password)

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
}

export async function loginUser(credentials: LoginCredentials): Promise<AuthUser | null> {
  if (!isDatabaseAvailable()) {
    // モックモードでのログイン処理
    const mockUser = MOCK_USERS.find(u => u.email === credentials.email)
    if (!mockUser || !mockUser.isActive) {
      return null
    }

    // デモ用パスワードチェック（実際のハッシュ比較はしない）
    if (credentials.password !== 'demo123') {
      return null
    }

    return {
      id: mockUser.id,
      userName: mockUser.userName,
      email: mockUser.email,
      displayName: mockUser.displayName || undefined,
      skinType: mockUser.skinType || undefined,
      profileImageUrl: mockUser.profileImageUrl || undefined,
    }
  }

  const user = await prisma!.user.findUnique({
    where: {
      email: credentials.email,
    },
  })

  if (!user || !user.isActive) {
    return null
  }

  const isPasswordValid = await verifyPassword(credentials.password, user.passwordHash)

  if (!isPasswordValid) {
    return null
  }

  return {
    id: user.id,
    userName: user.userName,
    email: user.email,
    displayName: user.displayName || undefined,
    skinType: user.skinType || undefined,
    profileImageUrl: user.profileImageUrl || undefined,
  }
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
  }
}
