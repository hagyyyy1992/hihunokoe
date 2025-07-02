export interface RegisterInput {
  email: string
  username: string
  password: string
}

export interface RegisterOutput {
  id: string
  email: string
  username: string
  emailVerificationToken: string
}

export interface RegisterInputPort {
  execute(input: RegisterInput): Promise<RegisterOutput>
}
