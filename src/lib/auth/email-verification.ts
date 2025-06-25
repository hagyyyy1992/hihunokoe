import { randomBytes } from 'crypto'
import { PrismaClient, SkinType } from '@prisma/client'
import {
  sendEmail,
  generateVerificationEmailHtml,
  generateVerificationEmailText,
} from '@/lib/email/email'

const prisma = new PrismaClient()

export async function generateVerificationToken(): Promise<string> {
  return randomBytes(32).toString('hex')
}

export async function createVerificationToken(userId: string): Promise<string> {
  const token = await generateVerificationToken()
  const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24時間後

  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationToken: token,
      emailVerificationExpiry: expiryDate,
    },
  })

  return token
}

export async function sendVerificationEmail(
  userId: string,
  email: string,
  userName: string
): Promise<void> {
  const token = await createVerificationToken(userId)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}`

  const htmlContent = generateVerificationEmailHtml(userName, verificationUrl)
  const textContent = generateVerificationEmailText(userName, verificationUrl)

  await sendEmail({
    to: email,
    subject: '【化粧品体験共有サービス】メールアドレスの確認',
    html: htmlContent,
    text: textContent,
  })
}

export async function verifyEmailToken(token: string): Promise<{
  success: boolean
  message: string
  user?: {
    id: string
    userName: string
    email: string
    displayName?: string
    skinType?: SkinType | null
    profileImageUrl?: string
    emailVerified: boolean
  }
}> {
  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: token,
      emailVerificationExpiry: {
        gt: new Date(),
      },
    },
  })

  if (!user) {
    return {
      success: false,
      message: '無効なトークンまたは期限切れです',
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiry: null,
    },
  })

  return {
    success: true,
    message: 'メールアドレスの確認が完了しました',
    user: {
      id: updatedUser.id,
      userName: updatedUser.userName,
      email: updatedUser.email,
      displayName: updatedUser.displayName || undefined,
      skinType: updatedUser.skinType,
      profileImageUrl: updatedUser.profileImageUrl || undefined,
      emailVerified: updatedUser.emailVerified,
    },
  }
}

export async function isEmailVerified(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  })

  return user?.emailVerified || false
}

export async function resendVerificationEmail(
  email: string
): Promise<{ success: boolean; message: string }> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, userName: true, emailVerified: true },
  })

  if (!user) {
    return {
      success: false,
      message: 'ユーザーが見つかりません',
    }
  }

  if (user.emailVerified) {
    return {
      success: false,
      message: 'このメールアドレスは既に確認済みです',
    }
  }

  await sendVerificationEmail(user.id, email, user.userName)

  return {
    success: true,
    message: '確認メールを再送信しました',
  }
}
