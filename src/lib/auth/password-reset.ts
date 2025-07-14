import { randomBytes } from 'crypto'
import { hashPassword } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma'
import {
  sendEmail,
  generatePasswordResetEmailHtml,
  generatePasswordResetEmailText,
} from '@/lib/email/email'
import { getEmailBaseUrl } from '@/lib/email/utils'

export async function generatePasswordResetToken(): Promise<string> {
  return randomBytes(32).toString('hex')
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = await generatePasswordResetToken()
  const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await prisma!.user.update({
    where: { id: userId },
    data: {
      passwordResetToken: token,
      passwordResetExpiry: expiryDate,
    },
  })

  return token
}

export async function sendPasswordResetEmail(
  userId: string,
  email: string,
  userName: string,
  baseUrl?: string
): Promise<void> {
  const token = await createPasswordResetToken(userId)
  const finalBaseUrl = getEmailBaseUrl(baseUrl)
  const resetUrl = `${finalBaseUrl}/auth/reset-password?token=${token}`

  const htmlContent = generatePasswordResetEmailHtml(userName, resetUrl)
  const textContent = generatePasswordResetEmailText(userName, resetUrl)

  await sendEmail({
    to: email,
    subject: '【化粧品体験共有サービス】パスワードリセット',
    html: htmlContent,
    text: textContent,
  })
}

export async function verifyPasswordResetToken(token: string): Promise<{
  success: boolean
  message: string
  user?: {
    id: string
    userName: string
    email: string
    skinType?: string
  }
}> {
  const user = await prisma!.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiry: {
        gt: new Date(),
      },
      deletedAt: null,
    },
  })

  if (!user) {
    return {
      success: false,
      message: '無効なトークンまたは期限切れです',
    }
  }

  return {
    success: true,
    message: 'トークンが確認されました',
    user: {
      id: user.id,
      userName: user.userName,
      email: user.email,
      skinType: user.skinType || undefined,
    },
  }
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{
  success: boolean
  message: string
}> {
  const user = await prisma!.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiry: {
        gt: new Date(),
      },
      deletedAt: null,
    },
  })

  if (!user) {
    return {
      success: false,
      message: '無効なトークンまたは期限切れです',
    }
  }

  const hashedPassword = await hashPassword(newPassword)

  await prisma!.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashedPassword,
      passwordResetToken: null,
      passwordResetExpiry: null,
    },
  })

  return {
    success: true,
    message: 'パスワードが正常にリセットされました',
  }
}
