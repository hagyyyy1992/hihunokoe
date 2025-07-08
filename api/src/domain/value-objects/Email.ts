export class Email {
  private readonly value: string

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new Error('無効なメールアドレス形式です')
    }
    this.value = value.toLowerCase()
  }

  private isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  getValue(): string {
    return this.value
  }

  equals(other: Email): boolean {
    return this.value === other.value
  }
}
