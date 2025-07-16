export interface IEmailService {
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
  sendAccountDeletionEmail(email: string, userName: string): Promise<void>
}
