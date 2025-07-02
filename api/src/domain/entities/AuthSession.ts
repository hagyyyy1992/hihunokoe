export class AuthSession {
  constructor(
    public readonly userId: string,
    public readonly token: string,
    public readonly expiresAt: Date,
    public readonly createdAt: Date
  ) {}

  isExpired(): boolean {
    return this.expiresAt < new Date()
  }

  isValid(): boolean {
    return !this.isExpired()
  }
}

export interface AuthTokenPayload {
  userId: string
  email: string
  role: string
}
