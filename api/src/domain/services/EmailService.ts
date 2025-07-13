export interface EmailService {
  sendPasswordResetEmail(
    email: string,
    userName: string,
    resetToken: string,
    baseUrl?: string
  ): Promise<void>
  sendVerificationEmail(
    email: string,
    userName: string,
    verificationToken: string,
    baseUrl?: string
  ): Promise<void>
  sendWelcomeEmail(email: string, userName: string): Promise<void>
  sendAccountDeletionEmail(email: string, userName: string): Promise<void>
}
