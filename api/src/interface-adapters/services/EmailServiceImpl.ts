import { EmailService } from '@api/domain/services/EmailService'
import { getEmailBaseUrl } from '@/lib/email/utils'

export class EmailServiceImpl implements EmailService {
  async sendPasswordResetEmail(
    email: string,
    userName: string,
    resetToken: string,
    baseUrl?: string
  ): Promise<void> {
    // Use email-based approach instead of the existing userId-based function
    const { sendEmail, generatePasswordResetEmailHtml, generatePasswordResetEmailText } =
      await import('@/lib/email/email')

    const finalBaseUrl = getEmailBaseUrl(baseUrl)
    const resetUrl = `${finalBaseUrl}/auth/reset-password?token=${resetToken}`

    const htmlContent = generatePasswordResetEmailHtml(userName, resetUrl)
    const textContent = generatePasswordResetEmailText(userName, resetUrl)

    await sendEmail({
      to: email,
      subject: '【化粧品体験共有サービス】パスワードリセット',
      html: htmlContent,
      text: textContent,
    })
  }

  async sendVerificationEmail(
    email: string,
    userName: string,
    verificationToken: string,
    baseUrl?: string
  ): Promise<void> {
    // The existing sendVerificationEmail expects userId as first parameter
    // Since we only have email, we need to use the new email-based approach
    const { sendEmail, generateVerificationEmailHtml, generateVerificationEmailText } =
      await import('@/lib/email/email')

    const finalBaseUrl = getEmailBaseUrl(baseUrl)
    const verificationUrl = `${finalBaseUrl}/auth/verify-email?token=${verificationToken}`

    const htmlContent = generateVerificationEmailHtml(userName, verificationUrl)
    const textContent = generateVerificationEmailText(userName, verificationUrl)

    await sendEmail({
      to: email,
      subject: '【化粧品体験共有サービス】メールアドレスの確認',
      html: htmlContent,
      text: textContent,
    })
  }

  async sendWelcomeEmail(email: string, userName: string): Promise<void> {
    // This can be implemented later if needed
    console.log(`Welcome email would be sent to ${email} for user ${userName}`)
  }

  async sendAccountDeletionEmail(email: string, userName: string): Promise<void> {
    const { sendEmail, generateAccountDeletionEmailHtml, generateAccountDeletionEmailText } =
      await import('@/lib/email/email')

    const htmlContent = generateAccountDeletionEmailHtml(userName)
    const textContent = generateAccountDeletionEmailText(userName)

    await sendEmail({
      to: email,
      subject: '【化粧品体験共有サービス】アカウント削除完了のお知らせ',
      html: htmlContent,
      text: textContent,
    })
  }
}
