import { EmailService } from '@api/domain/services/EmailService'
import { sendPasswordResetEmail } from '@/lib/auth/password-reset'
import { sendVerificationEmail } from '@/lib/auth/email-verification'

export class EmailServiceImpl implements EmailService {
  async sendPasswordResetEmail(email: string, userName: string, resetToken: string): Promise<void> {
    // In the existing system, the token is the userId, not the actual token
    // We need to adapt this for the clean architecture
    await sendPasswordResetEmail(resetToken, email, userName)
  }

  async sendVerificationEmail(
    email: string,
    userName: string,
    verificationToken: string
  ): Promise<void> {
    await sendVerificationEmail(email, userName, verificationToken)
  }

  async sendWelcomeEmail(email: string, userName: string): Promise<void> {
    // This can be implemented later if needed
    console.log(`Welcome email would be sent to ${email} for user ${userName}`)
  }
}
