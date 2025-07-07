export interface EmailService {
  sendPasswordResetEmail(email: string, userName: string, resetToken: string): Promise<void>
  sendVerificationEmail(email: string, userName: string, verificationToken: string): Promise<void>
  sendWelcomeEmail(email: string, userName: string): Promise<void>
}
