export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  constructor(message?: string) {
    super(message || 'メールアドレスまたはパスワードが間違っています')
    this.name = 'InvalidCredentialsError'
  }
}

export class AccountLockedError extends AuthenticationError {
  constructor() {
    super('ログイン試行回数が多すぎるため、アカウントがロックされています')
    this.name = 'AccountLockedError'
  }
}

export class AccountInactiveError extends AuthenticationError {
  constructor() {
    super('アカウントが無効です')
    this.name = 'AccountInactiveError'
  }
}

export class EmailNotVerifiedError extends AuthenticationError {
  constructor() {
    super('メールアドレスの確認が完了していません。確認メールをご確認ください。')
    this.name = 'EmailNotVerifiedError'
  }
}

export class TokenExpiredError extends AuthenticationError {
  constructor() {
    super('Token has expired')
    this.name = 'TokenExpiredError'
  }
}

export class InvalidTokenError extends AuthenticationError {
  constructor() {
    super('Invalid token')
    this.name = 'InvalidTokenError'
  }
}
