import { User } from '@api/domain/entities/User'

// Authentication
export type LoginOutputPort = {
  token: string
  user: {
    id: string
    email: string
    userName: string
    role: string
    emailVerified: boolean
  }
}

export type RegisterOutputPort = {
  user: User
  message: string
}

export type LogoutOutputPort = {
  message: string
}

export type GetCurrentUserOutputPort = {
  user: User
}

export type VerifyTokenOutputPort = {
  user?: {
    id: string
    email: string
    userName: string
    role: string
    emailVerified: boolean
  }
  isValid: boolean
}

// Password Management
export type ForgotPasswordOutputPort = {
  message: string
}

export type ResetPasswordOutputPort = {
  message: string
}

export type VerifyPasswordResetTokenOutputPort = {
  isValid: boolean
  email?: string
}

// Email Verification
export type VerifyEmailOutputPort = {
  user: User
  message: string
}

export type ResendVerificationEmailOutputPort = {
  message: string
}

// Account Management
export type DeleteAccountOutputPort = {
  message: string
}
