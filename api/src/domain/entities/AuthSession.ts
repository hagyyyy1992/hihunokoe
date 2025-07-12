export class AuthSession {
  constructor(
    public readonly id: string, // Added for database compatibility
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
  userName?: string // オプショナルフィールドとして追加
  termsAcceptedAt?: string | null // 利用規約同意日時
  privacyAcceptedAt?: string | null // プライバシーポリシー同意日時
}
