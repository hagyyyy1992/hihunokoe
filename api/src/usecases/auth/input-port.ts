import { User } from '@api/domain/entities/User'
import {
  LoginOutputPort,
  RegisterOutputPort,
  ForgotPasswordOutputPort,
  ResetPasswordOutputPort,
  VerifyEmailOutputPort,
  ResendVerificationEmailOutputPort,
  DeleteAccountOutputPort,
  GetCurrentUserOutputPort,
  VerifyTokenOutputPort,
  VerifyPasswordResetTokenOutputPort,
  LogoutOutputPort,
} from './output-port'

// Authentication
export abstract class IAuthenticationUseCase {
  abstract login(inputPort: LoginInputPort): Promise<LoginOutputPort>
  abstract register(inputPort: RegisterInputPort): Promise<RegisterOutputPort>
  abstract logout(inputPort: LogoutInputPort): Promise<LogoutOutputPort>
  abstract getCurrentUser(inputPort: GetCurrentUserInputPort): Promise<GetCurrentUserOutputPort>
  abstract verifyToken(inputPort: VerifyTokenInputPort): Promise<VerifyTokenOutputPort>
}

export type LoginInputPort = {
  email: string
  password: string
  acceptTerms?: boolean
  acceptPrivacy?: boolean
  ipAddress?: string
  userAgent?: string
}

export type RegisterInputPort = {
  email: string
  password: string
  userName: string
  ipAddress?: string
  userAgent?: string
}

export type LogoutInputPort = {
  token: string
}

export type GetCurrentUserInputPort = {
  token: string
}

export type VerifyTokenInputPort = {
  token: string
}

// Password Management
export abstract class IPasswordManagementUseCase {
  abstract forgotPassword(inputPort: ForgotPasswordInputPort): Promise<ForgotPasswordOutputPort>
  abstract resetPassword(inputPort: ResetPasswordInputPort): Promise<ResetPasswordOutputPort>
  abstract verifyPasswordResetToken(
    inputPort: VerifyPasswordResetTokenInputPort
  ): Promise<VerifyPasswordResetTokenOutputPort>
}

export type ForgotPasswordInputPort = {
  email: string
  ipAddress?: string
  userAgent?: string
}

export type ResetPasswordInputPort = {
  token: string
  newPassword: string
  ipAddress?: string
  userAgent?: string
}

export type VerifyPasswordResetTokenInputPort = {
  token: string
}

// Email Verification
export abstract class IEmailVerificationUseCase {
  abstract verifyEmail(inputPort: VerifyEmailInputPort): Promise<VerifyEmailOutputPort>
  abstract resendVerificationEmail(
    inputPort: ResendVerificationEmailInputPort
  ): Promise<ResendVerificationEmailOutputPort>
}

export type VerifyEmailInputPort = {
  token: string
  ipAddress?: string
  userAgent?: string
}

export type ResendVerificationEmailInputPort = {
  email: string
  ipAddress?: string
  userAgent?: string
}

// Account Management
export abstract class IAccountManagementUseCase {
  abstract deleteAccount(inputPort: DeleteAccountInputPort): Promise<DeleteAccountOutputPort>
}

export type DeleteAccountInputPort = {
  userId: string
  password: string
  ipAddress?: string
  userAgent?: string
  survey?: {
    reason: string
    reasonOther?: string
    feedback?: string
    wouldRecommend?: boolean
  }
}
