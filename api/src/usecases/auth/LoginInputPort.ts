export interface LoginInput {
  email: string
  password: string
}

export interface LoginOutput {
  token: string
  user: {
    id: string
    email: string
    username: string
    role: string
    emailVerified: boolean
  }
}

export interface LoginInputPort {
  execute(input: LoginInput): Promise<LoginOutput>
}
