export class Password {
  private readonly value: string

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new Error('Password must be at least 8 characters long')
    }
    this.value = value
  }

  private isValid(password: string): boolean {
    return password.length >= 8
  }

  getValue(): string {
    return this.value
  }

  equals(other: Password): boolean {
    return this.value === other.value
  }
}