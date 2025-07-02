export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  constructor() {
    super('Invalid email or password')
    this.name = 'InvalidCredentialsError'
  }
}

export class AccountLockedError extends AuthenticationError {
  constructor() {
    super('Account is locked due to too many failed login attempts')
    this.name = 'AccountLockedError'
  }
}

export class AccountInactiveError extends AuthenticationError {
  constructor() {
    super('Account is inactive')
    this.name = 'AccountInactiveError'
  }
}

export class EmailNotVerifiedError extends AuthenticationError {
  constructor() {
    super('Email address is not verified')
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