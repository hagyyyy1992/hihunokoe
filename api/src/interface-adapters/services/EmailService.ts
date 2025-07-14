import { IEmailService } from '@api/domain/services/EmailService'
import { getEmailBaseUrl } from '@/lib/email/utils'
import {
  sendEmail,
  generatePasswordResetEmailHtml,
  generatePasswordResetEmailText,
  generateVerificationEmailHtml,
  generateVerificationEmailText,
  generateAccountDeletionEmailHtml,
  generateAccountDeletionEmailText,
} from '@/lib/email/email'

export class EmailService implements IEmailService {
  async sendPasswordResetEmail(
    email: string,
    userName: string,
    resetToken: string,
    baseUrl?: string
  ): Promise<void> {
    const finalBaseUrl = getEmailBaseUrl(baseUrl)
    const resetUrl = `${finalBaseUrl}/auth/reset-password?token=${resetToken}`
    await sendEmail({
      to: email,
      subject: '【化粧品体験共有サービス】パスワードリセット',
      html: generatePasswordResetEmailHtml(userName, resetUrl),
      text: generatePasswordResetEmailText(userName, resetUrl),
    })
  }

  async sendVerificationEmail(
    email: string,
    userName: string,
    verificationToken: string,
    baseUrl?: string
  ): Promise<void> {
    const finalBaseUrl = getEmailBaseUrl(baseUrl)
    const verificationUrl = `${finalBaseUrl}/auth/verify-email?token=${verificationToken}`
    await sendEmail({
      to: email,
      subject: '【化粧品体験共有サービス】メールアドレスの確認',
      html: generateVerificationEmailHtml(userName, verificationUrl),
      text: generateVerificationEmailText(userName, verificationUrl),
    })
  }

  async sendAccountDeletionEmail(email: string, userName: string): Promise<void> {
    await sendEmail({
      to: email,
      subject: '【化粧品体験共有サービス】アカウント削除完了のお知らせ',
      html: generateAccountDeletionEmailHtml(userName),
      text: generateAccountDeletionEmailText(userName),
    })
  }
}
