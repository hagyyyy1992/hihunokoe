import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

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
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return {
      id: decoded.id,
      userName: decoded.userName,
      email: decoded.email,
    }
  } catch (error) {
    return null
  }
}

export async function registerUser(data: RegisterData): Promise<AuthUser> {
  const hashedPassword = await hashPassword(data.password)
  
  const user = await prisma.user.create({
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
  const user = await prisma.user.findUnique({
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

export async function getUserById(id: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
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