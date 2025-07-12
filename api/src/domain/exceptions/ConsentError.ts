export class ConsentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConsentError'
  }
}

export class TermsNotAcceptedError extends ConsentError {
  constructor() {
    super('利用規約とプライバシーポリシーに同意してください')
    this.name = 'TermsNotAcceptedError'
  }
}
